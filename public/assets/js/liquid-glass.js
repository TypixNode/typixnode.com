/* =====================================================================
   TypixNode — Liquid Glass (edge-only refraction + chromatic aberration)
   ---------------------------------------------------------------------
   Real glass only bends light at its CURVED EDGES; the flat centre stays
   clear. So for every glass surface we generate a displacement map that is
   neutral grey (128,128 = "don't move") in the centre and ramps outward only
   inside a thin rim band that follows the element's rounded-rect (SDF). That
   map drives THREE feDisplacementMap passes at slightly different scales
   (R/G/B) so the rim gets the faint chromatic fringe a real lens has.

   - Chromium honours `backdrop-filter: url(#id)` -> real refraction.
   - Safari / Firefox ignore it -> they keep the frosted blur from CSS.
   - Content is never filtered (backdrop-filter only touches the backdrop),
     so text stays crisp and undistorted.
   ===================================================================== */
(function () {
  'use strict';

  /* Only Chromium (Blink) actually applies an SVG `url(#id)` filter inside
     backdrop-filter. The catch: Safari LIES — `CSS.supports('backdrop-filter',
     'url(#x)')` returns true on Safari, but it then can't resolve the filter,
     so the whole backdrop-filter declaration becomes invalid and the frosted
     blur disappears too. So we gate on a reliable Blink-desktop signal and let
     Safari / Firefox / iOS keep the pure CSS `-webkit-backdrop-filter: blur()`
     frosted fallback. */
  function isBlinkDesktop() {
    var nav = navigator;
    var ua = nav.userAgent || '';
    // iOS / iPadOS browsers are all WebKit -> no url() backdrop support.
    var isIOS =
      /iP(hone|ad|od)/.test(ua) ||
      (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
    if (isIOS) return false;
    if (/Firefox\/|FxiOS\//.test(ua)) return false;
    // userAgentData is a Chromium-only API -> the most reliable signal.
    var uad = nav.userAgentData;
    if (uad && Array.isArray(uad.brands)) {
      return uad.brands.some(function (b) {
        return /Chromium|Google Chrome|Microsoft Edge|Opera/i.test(b.brand);
      });
    }
    // Fallback UA sniff: Blink engines, excluding Safari (no Chrome/Edg/OPR token).
    return /(Chrome|Chromium|Edg|OPR)\//.test(ua);
  }

  var SUPPORTED =
    !!window.CSS &&
    isBlinkDesktop() &&
    (CSS.supports('backdrop-filter', 'url(#x)') ||
      CSS.supports('-webkit-backdrop-filter', 'url(#x)'));
  if (!SUPPORTED) return; // CSS frosted fallback stays as-is.

  // Respect reduced-transparency / reduced-motion: skip the heavy effect.
  try {
    if (
      matchMedia('(prefers-reduced-transparency: reduce)').matches ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
  } catch (e) {}

  var SVGNS = 'http://www.w3.org/2000/svg';
  var XLINK = 'http://www.w3.org/1999/xlink';

  // Surfaces that get true refraction. (Tiny controls like <select> are left
  // on plain frosted glass — refraction there isn't worth the paint cost.)
  var SELECTOR = [
    '.nav', '.chip', '.stage', '.pin', '.strip',
    '.pc', '.tile', '.feat .c', '.ft', '.cart',
    '.row', '.qa', '.spectbl', '.exploded .img'
  ].join(',');

  // Per-surface optics. scale is NEGATIVE for a magnifying lens.
  var BLUR = 3;          // px of frost on top of the refraction
  var SCALE = -38;       // bend strength at the rim
  var BAND = 22;         // rim band thickness in CSS px (where the bend lives)
  var ABERR = 0.07;      // chromatic spread: R/B passes are ±7% of scale

  var defs = createDefsSvg();
  var uid = 0;

  function createDefsSvg() {
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText =
      'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    document.body.appendChild(svg);
    return svg;
  }

  /* Build a neutral-centre, rim-only displacement map sized to the element.
     R encodes horizontal bend, G vertical, both 128 in the flat centre. */
  function buildMap(w, h, radius) {
    var cw = Math.max(8, Math.min(Math.round(w), 640));
    var ch = Math.max(8, Math.min(Math.round(h), 240));
    var fx = cw / w, fy = ch / h;
    var cv = document.createElement('canvas');
    cv.width = cw;
    cv.height = ch;
    var ctx = cv.getContext('2d');
    var img = ctx.createImageData(cw, ch);
    var d = img.data;

    var r = Math.min(radius * fx, radius * fy, Math.min(cw, ch) / 2);
    var band = Math.max(2, BAND * Math.min(fx, fy));
    var halfX = cw / 2, halfY = ch / 2;

    for (var y = 0; y < ch; y++) {
      for (var x = 0; x < cw; x++) {
        var px = x + 0.5, py = y + 0.5;
        // signed distance to a rounded rectangle (negative inside).
        var qx = Math.abs(px - halfX) - (halfX - r);
        var qy = Math.abs(py - halfY) - (halfY - r);
        var ax = Math.max(qx, 0), ay = Math.max(qy, 0);
        var sdf = Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
        var dist = -sdf; // >0 inside, 0 at the edge
        var t = 1 - clamp(dist / band, 0, 1); // 1 at rim, 0 inside the band
        t = t * t * (3 - 2 * t); // smoothstep

        var nx = 0, ny = 0;
        var sgx = px < halfX ? -1 : 1;
        var sgy = py < halfY ? -1 : 1;
        if (qx > 0 || qy > 0) {
          // rounded corner: outward normal ~ (ax,ay) with edge signs
          nx = sgx * ax;
          ny = sgy * ay;
          var l = Math.hypot(nx, ny) || 1;
          nx /= l;
          ny /= l;
        } else {
          // straight band: push along the nearest axis
          var dh = Math.min(px, cw - px);
          var dv = Math.min(py, ch - py);
          if (dh < dv) {
            nx = sgx;
            ny = 0;
          } else {
            nx = 0;
            ny = sgy;
          }
        }

        var i = (y * cw + x) * 4;
        d[i] = 128 + nx * t * 127;
        d[i + 1] = 128 + ny * t * 127;
        d[i + 2] = 128;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return cv.toDataURL();
  }

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function fe(name, attrs) {
    var el = document.createElementNS(SVGNS, name);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // keep-one-channel colour matrices
  var M_R = '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0';
  var M_G = '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0';
  var M_B = '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0';

  function buildFilter(id, w, h, mapUrl) {
    var f = fe('filter', {
      id: id,
      filterUnits: 'userSpaceOnUse',
      x: '0', y: '0', width: w, height: h,
      'color-interpolation-filters': 'sRGB'
    });

    var map = document.createElementNS(SVGNS, 'feImage');
    map.setAttribute('result', 'map');
    map.setAttribute('x', '0');
    map.setAttribute('y', '0');
    map.setAttribute('width', w);
    map.setAttribute('height', h);
    map.setAttribute('preserveAspectRatio', 'none');
    map.setAttributeNS(XLINK, 'xlink:href', mapUrl);
    map.setAttribute('href', mapUrl);
    f.appendChild(map);

    var sR = SCALE * (1 + ABERR);
    var sG = SCALE;
    var sB = SCALE * (1 - ABERR);

    f.appendChild(fe('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: sR, xChannelSelector: 'R', yChannelSelector: 'G', result: 'dR' }));
    f.appendChild(fe('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: sG, xChannelSelector: 'R', yChannelSelector: 'G', result: 'dG' }));
    f.appendChild(fe('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: sB, xChannelSelector: 'R', yChannelSelector: 'G', result: 'dB' }));

    f.appendChild(fe('feColorMatrix', { in: 'dR', type: 'matrix', values: M_R, result: 'cR' }));
    f.appendChild(fe('feColorMatrix', { in: 'dG', type: 'matrix', values: M_G, result: 'cG' }));
    f.appendChild(fe('feColorMatrix', { in: 'dB', type: 'matrix', values: M_B, result: 'cB' }));

    f.appendChild(fe('feBlend', { in: 'cR', in2: 'cG', mode: 'screen', result: 'cRG' }));
    f.appendChild(fe('feBlend', { in: 'cRG', in2: 'cB', mode: 'screen' }));

    return f;
  }

  function attach(el) {
    var rect = el.getBoundingClientRect();
    var w = Math.round(rect.width);
    var h = Math.round(rect.height);
    if (w < 8 || h < 8) return;

    var prev = el.__lgSize;
    if (prev && prev.w === w && prev.h === h) return; // unchanged
    el.__lgSize = { w: w, h: h };

    var radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 16;
    var mapUrl = buildMap(w, h, radius);

    var id = el.__lgId || ('lg-' + ++uid);
    el.__lgId = id;
    var old = defs.querySelector('#' + id);
    if (old) defs.removeChild(old);
    defs.appendChild(buildFilter(id, w, h, mapUrl));

    var bf =
      'blur(' + BLUR + 'px) saturate(180%) brightness(1.05) url(#' + id + ')';
    el.style.webkitBackdropFilter = bf;
    el.style.backdropFilter = bf;
    el.classList.add('lg-on');
  }

  var ro =
    'ResizeObserver' in window
      ? new ResizeObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) attach(entries[i].target);
        })
      : null;

  var io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          function (entries) {
            for (var i = 0; i < entries.length; i++) {
              var e = entries[i];
              if (e.isIntersecting) {
                attach(e.target);
                if (ro) ro.observe(e.target);
              }
            }
          },
          { rootMargin: '200px' }
        )
      : null;

  function init() {
    var els = document.querySelectorAll(SELECTOR);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (io) io.observe(el);
      else attach(el); // no IO: just build now
    }
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();

  // Rebuild on orientation / big viewport changes (debounced).
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var els = document.querySelectorAll('.lg-on');
      for (var i = 0; i < els.length; i++) attach(els[i]);
    }, 180);
  });
})();
