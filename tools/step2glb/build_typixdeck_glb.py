#!/usr/bin/env python3
"""
Build the web 3D preview GLB for the TypixDeck from a Fusion 360 STEP.

Produces an ordered, layered exploded model with 5 named groups:
    screen -> top_shell -> pcb -> cm4 -> back_cover

Strategy
--------
* cascadio (native OpenCASCADE) tessellates the 139 MB STEP -> GLB in ~30 s,
  keeping per-part XCAF colours. (occt-import-js / WASM fails on this assembly.)
* Structural / large parts keep their geometry + STEP colour:
  enclosure shells, screen, Board, copper, silkscreen, keyboard.
* The thousands of tiny passives / ICs / connectors and the very dense CM4
  module are replaced by colour-matched bounding BOXES (LOD) -- a 0603 cap is a
  box anyway -- which cuts ~1.5 M faces down to ~0.25 M (GLB ~28 MB -> ~5 MB).
* Meshes are merged per (group, colour) so the whole model is only a few dozen
  draw calls, while the <Viewer3D> component groups nodes by name for the
  layered explode. Enclosure shells are forced to a dark CNC-aluminium grey.

Setup (one-time)
----------------
    python3.12 -m venv .venv
    .venv/bin/pip install cascadio trimesh scipy networkx numpy

Usage
-----
    .venv/bin/python build_typixdeck_glb.py /path/to/TypixNode11-YYYYMMDD.step
"""
import os
import re
import sys
import tempfile
from collections import defaultdict

import numpy as np
import trimesh

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(REPO, "public", "assets", "models", "typixdeck.glb")

TOL_LINEAR_MM = 0.18
TOL_ANGULAR = 0.6

# Enclosure CNC dark-grey (near black). STEP ships a light grey we override.
CNC_RGBA = (40, 42, 46, 255)

PAT = {
    "screen": re.compile(r"ER-TFT|HD317|TFT|LCD", re.I),
    # The real compute module in the design is U26, named COMM-SMD ... _CM5.
    "cm4": re.compile(r"COMM-SMD.*_CM\d", re.I),
    "keyboard": re.compile(r"keebdeck|Keyboard_", re.I),
    "board": re.compile(r"Board~", re.I),
    "copper": re.compile(r"Copper", re.I),
    "silk": re.compile(r"Silkscreen", re.I),
}

# RPI-CM4-No-Silk is a 2nd, fully overlapping CM render (~0.29 M faces) that
# duplicates the U26 CM5 module — drop it so the module isn't doubled / z-fighting.
EXCLUDE = re.compile(r"RPI-CM4-No-Silk|RPI-CM5", re.I)


def color_of(geom):
    v = geom.visual
    try:
        bcf = getattr(getattr(v, "material", None), "baseColorFactor", None)
        if bcf is not None:
            c = [int(x) for x in bcf]
            return tuple((c + [255])[:4])
    except Exception:
        pass
    try:
        if hasattr(v, "face_colors") and len(v.face_colors):
            return tuple(int(x) for x in v.face_colors[0][:4])
    except Exception:
        pass
    return (150, 150, 150, 255)


def quantize(c):
    return (c[0] // 12 * 12, c[1] // 12 * 12, c[2] // 12 * 12, 255)


def main(step_path):
    import cascadio

    with tempfile.TemporaryDirectory() as tmp:
        full = os.path.join(tmp, "full.glb")
        print(f"[1/4] cascadio -> {full}")
        cascadio.step_to_glb(step_path, full, tol_linear=TOL_LINEAR_MM,
                             tol_angular=TOL_ANGULAR, tol_relative=False,
                             merge_primitives=True)

        print("[2/4] loading + classifying")
        s = trimesh.load(full, process=False)

        # group_key -> color -> list[trimesh] (detailed) ; LOD groups collect boxes
        detailed = defaultdict(lambda: defaultdict(list))
        box_specs = defaultdict(list)  # group -> list[(transform, extents, color)]

        for node in s.graph.nodes_geometry:
            T, gname = s.graph[node]
            if EXCLUDE.search(gname):
                continue
            base = s.geometry[gname]
            col = color_of(base)

            cat = None
            for k, p in PAT.items():
                if p.search(gname):
                    cat = k
                    break
            is_enclosure = gname == "COMPOUND"

            g = base.copy()
            g.apply_transform(T)
            g.apply_scale(1000.0)  # m -> mm

            if is_enclosure:
                detailed["__enclosure__"][CNC_RGBA].append(g)
            elif cat == "screen":
                detailed["screen"][quantize(col)].append(g)
            elif cat == "cm4":
                # The real CM5 module: keep its detail + STEP colour.
                detailed["cm4"][quantize(col)].append(g)
            elif cat in ("board", "copper", "silk", "keyboard"):
                detailed["pcb"][quantize(col)].append(g)
            else:
                # passives / ICs / connectors / battery -> colour boxes on the PCB
                lo, hi = g.bounds
                box_specs["pcb"].append((_box_T(lo, hi), hi - lo, col))

        print("[3/4] splitting enclosure + merging by colour")
        scene = trimesh.Scene()

        # enclosure: split COMPOUND into the two physical shells, top vs back
        shell = trimesh.util.concatenate(detailed["__enclosure__"][CNC_RGBA])
        dim = shell.bounds[1] - shell.bounds[0]
        axis = int(np.argmin(dim))
        mid = (shell.bounds[0][axis] + shell.bounds[1][axis]) / 2
        top, back = [], []
        for comp in shell.split(only_watertight=False):
            (top if comp.centroid[axis] >= mid else back).append(comp)
        _add(scene, "top_shell", _merge(top), CNC_RGBA)
        _add(scene, "back_cover", _merge(back), CNC_RGBA)

        # detailed colour buckets -> one mesh per (group,colour)
        for grp in ("screen", "pcb", "cm4"):
            for ci, (col, meshes) in enumerate(detailed[grp].items()):
                _add(scene, f"{grp}__{ci}", _merge(meshes), col)

        # LOD boxes -> one mesh per (group,colour)
        for grp, specs in box_specs.items():
            by_col = defaultdict(list)
            for T, ext, col in specs:
                by_col[quantize(col)].append((T, ext))
            for ci, (col, items) in enumerate(by_col.items()):
                boxes = [trimesh.creation.box(extents=e, transform=T) for T, e in items]
                _add(scene, f"{grp}__box{ci}", _merge(boxes), col)

        print("[4/4] export", OUT)
        os.makedirs(os.path.dirname(OUT), exist_ok=True)
        scene.export(OUT)
        faces = sum(len(g.faces) for g in scene.geometry.values())
        print(f"      groups={len(scene.geometry)} faces={faces:,} "
              f"size={os.path.getsize(OUT) / 1e6:.2f} MB")


def _box_T(lo, hi):
    T = np.eye(4)
    T[:3, 3] = (lo + hi) / 2
    return T


def _merge(meshes):
    return trimesh.util.concatenate(meshes) if meshes else None


def _add(scene, node_name, mesh, rgba):
    if mesh is None or len(mesh.faces) == 0:
        return
    mesh.visual = trimesh.visual.TextureVisuals(
        material=trimesh.visual.material.PBRMaterial(
            name=node_name, baseColorFactor=list(rgba),
            metallicFactor=0.6, roughnessFactor=0.5))
    scene.add_geometry(mesh, geom_name=node_name, node_name=node_name)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: build_typixdeck_glb.py <input.step>")
    main(sys.argv[1])
