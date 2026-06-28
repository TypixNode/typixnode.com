# STEP → web GLB (TypixDeck 3D preview)

Regenerates `public/assets/models/typixdeck.glb`, the model shown by the
`<Viewer3D>` component on the TypixDeck page (interactive rotate + scroll-driven
layered exploded view: **screen → top shell → mainboard → CM4 → back cover**).

## One-time setup

Needs Python 3.12 (OpenCASCADE wheels aren't published for 3.14 yet):

```bash
cd tools/step2glb
python3.12 -m venv .venv
.venv/bin/pip install cascadio trimesh scipy networkx numpy
```

## Regenerate after the CAD changes

```bash
.venv/bin/python build_typixdeck_glb.py ~/Downloads/TypixNode11-YYYYMMDD.step
```

The script:

1. Uses **cascadio** (native OpenCASCADE) to tessellate the full STEP to a GLB in
   ~30 s, preserving per-part XCAF names **and colours**. (The pure-WASM
   `occt-import-js` fails on this 139 MB assembly — named-but-empty meshes.)
2. Classifies every part into one of five layers and keeps the STEP colour:
   - `screen` (ER-TFT / HD317), `top_shell` / `back_cover` (the merged `COMPOUND`
     enclosure split by connected component + centroid along the thin axis,
     recoloured to a dark CNC-aluminium grey), and `pcb` (Board / copper /
     silkscreen / keyboard).
3. Replaces the thousands of tiny passives/ICs/connectors and the very dense CM4
   module with **colour-matched bounding boxes** (LOD) — a 0603 cap is a box
   anyway — cutting ~1.5 M faces to ~0.2 M.
4. Merges meshes per (layer, colour) so the model is only a few dozen draw calls,
   then writes a millimetre-scaled GLB (~4.6 MB). `<Viewer3D>` groups nodes by
   name and fans the layers out in stack order for the explode.

`.venv/` is git-ignored; only the script + this README are committed.
