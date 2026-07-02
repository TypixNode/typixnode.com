// Generates the monochrome compat-wall marks in public/assets/compat/*.png.
// Official brand marks come from simple-icons; the rest are hand-drawn glyphs.
// All render to 128x128, single light-gray silhouette (#c8e0e0) on transparent
// bg, matching the existing icons (light mode darkens them via CSS brightness(0)).
//
// Dev-only helper. Install deps then run:
//   npm i -D playwright simple-icons && npx playwright install chromium
//   node tools/gen-compat-icons.mjs
import { chromium } from 'playwright';
import * as si from 'simple-icons';

const COL = '#c8e0e0';
const ALL = si.default ?? si;

// ---- simple-icons official monochrome marks ----
const siPath = (key) => {
  const ic = ALL[key];
  if (!ic) throw new Error('missing simple-icon ' + key);
  return `<path d="${ic.path}"/>`;
};

// ---- hand-drawn monochrome glyphs (24x24 space, holes via mask) ----
// helper: body group masked by black holes
const masked = (body, holes) => `
  <defs><mask id="m"><rect x="-3" y="-3" width="30" height="30" fill="#fff"/>${holes}</mask></defs>
  <g mask="url(#m)">${body}</g>`;

const custom = {
  // Aider — AI pair-programming robot head
  aider: masked(
    `<rect x="4" y="6.5" width="16" height="13" rx="3.6"/>
     <rect x="11.25" y="2.4" width="1.5" height="4.2"/>
     <circle cx="12" cy="2.1" r="1.7"/>
     <rect x="2" y="10" width="1.9" height="5" rx="0.95"/>
     <rect x="20.1" y="10" width="1.9" height="5" rx="0.95"/>`,
    `<circle cx="9" cy="11.8" r="1.75" fill="#000"/>
     <circle cx="15" cy="11.8" r="1.75" fill="#000"/>
     <rect x="8.4" y="15.1" width="7.2" height="1.7" rx="0.85" fill="#000"/>`
  ),
  // Codex — sandboxed terminal CLI
  codex: masked(
    `<rect x="3" y="4.5" width="18" height="15" rx="2.6"/>`,
    `<circle cx="6" cy="6.9" r="0.75" fill="#000"/>
     <circle cx="8.3" cy="6.9" r="0.75" fill="#000"/>
     <circle cx="10.6" cy="6.9" r="0.75" fill="#000"/>
     <path d="M7 11 l3 2.3 l-3 2.3" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
     <rect x="11.6" y="15.1" width="4.2" height="1.5" rx="0.75" fill="#000"/>`
  ),
  // Crush — Charm's polished TUI (heart + sparkle)
  crush: masked(
    `<path d="M12 20.2 C4.8 15.2 2.8 10.2 6.4 7.1 C8.9 5 11 6.4 12 8.5 C13 6.4 15.1 5 17.6 7.1 C21.2 10.2 19.2 15.2 12 20.2 Z"/>
     <path d="M18.4 2.6 L19.15 5 L21.5 5.75 L19.15 6.5 L18.4 8.9 L17.65 6.5 L15.3 5.75 L17.65 5 Z"/>`,
    `<circle cx="8.7" cy="9.6" r="1.15" fill="#000"/>`
  ),
  // OpenClaw — the lobster (two big front pincers + segmented tail)
  openclaw: masked(
    `<path d="M12 12 L7.2 8.4" fill="none" stroke="${COL}" stroke-width="1.8" stroke-linecap="round"/>
     <path d="M12 12 L16.8 8.4" fill="none" stroke="${COL}" stroke-width="1.8" stroke-linecap="round"/>
     <g transform="rotate(-24 6 5.8)"><ellipse cx="6" cy="5.8" rx="2.8" ry="3.7"/></g>
     <g transform="rotate(24 18 5.8)"><ellipse cx="18" cy="5.8" rx="2.8" ry="3.7"/></g>
     <path d="M12 10 C14 11.4 14.2 13.4 13.4 15.4 L12 22 L10.6 15.4 C9.8 13.4 10 11.4 12 10 Z"/>
     <path d="M11.4 9.8 C10.6 7.2 10.2 5.4 10.2 3.6" fill="none" stroke="${COL}" stroke-width="0.9" stroke-linecap="round"/>
     <path d="M12.6 9.8 C13.4 7.2 13.8 5.4 13.8 3.6" fill="none" stroke="${COL}" stroke-width="0.9" stroke-linecap="round"/>`,
    `<g transform="rotate(-24 6 5.8)"><path d="M6 2.4 L4.5 6 L7.5 6 Z" fill="#000"/></g>
     <g transform="rotate(24 18 5.8)"><path d="M18 2.4 L16.5 6 L19.5 6 Z" fill="#000"/></g>
     <path d="M10.7 13 H13.3 M10.8 15.2 H13.2 M11 17.4 H13" stroke="#000" stroke-width="0.7"/>`
  ),
  // PortMaster — gamepad
  portmaster: masked(
    `<path d="M6 8.2 H18 C20.4 8.2 22 10.2 22 13 C22 15.6 20.8 17 19 17 C17.7 17 17 15.6 16 14.6 C15.4 14 14.8 13.8 14 13.8 H10 C9.2 13.8 8.6 14 8 14.6 C7 15.6 6.3 17 5 17 C3.2 17 2 15.6 2 13 C2 10.2 3.6 8.2 6 8.2 Z"/>`,
    `<rect x="5.7" y="11.4" width="3.6" height="1.15" rx="0.35" fill="#000"/>
     <rect x="6.92" y="10.2" width="1.15" height="3.6" rx="0.35" fill="#000"/>
     <circle cx="16.2" cy="10.9" r="0.95" fill="#000"/>
     <circle cx="18.1" cy="12.4" r="0.95" fill="#000"/>`
  ),
  // Pwnagotchi — cute-faced handheld
  pwnagotchi: masked(
    `<rect x="4" y="5" width="16" height="14.2" rx="2.6"/>
     <rect x="11.25" y="2.6" width="1.5" height="2.6"/>
     <circle cx="12" cy="2.3" r="1.35"/>`,
    `<path d="M7.6 9.8 l2.1 1.4 l-2.1 1.4" fill="none" stroke="#000" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
     <path d="M16.4 9.8 l-2.1 1.4 l2.1 1.4" fill="none" stroke="#000" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
     <path d="M9.7 14.2 Q12 16.2 14.3 14.2" fill="none" stroke="#000" stroke-width="1.2" stroke-linecap="round"/>`
  ),
  // Sonic Pi — live-coding music note
  'sonic-pi': `
    <ellipse cx="8.6" cy="17" rx="3.1" ry="2.4" transform="rotate(-20 8.6 17)"/>
    <rect x="11" y="5" width="1.7" height="11.6"/>
    <path d="M12.7 5 C17.2 6 18.4 8.8 16.6 11.6 C17.7 8.9 16 7.2 12.7 7.3 Z"/>
    <ellipse cx="16.8" cy="15.2" rx="2.5" ry="1.9" transform="rotate(-20 16.8 15.2)"/>
    <rect x="18.9" y="4" width="1.5" height="11" />`,
  // Batocera — arcade joystick
  batocera: `
    <ellipse cx="12" cy="18.2" rx="7" ry="2.4"/>
    <rect x="11" y="8" width="2" height="9.2"/>
    <circle cx="12" cy="6.6" r="3.3"/>`,
  // muOS — Greek letter mu
  muos: `
    <path d="M7 6 V19.5" fill="none" stroke="${COL}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M7 12.8 C7 15.6 9.1 16.8 11 16.8 C13 16.8 15 15.6 15 12.8 V6" fill="none" stroke="${COL}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M15 6 V16.6" fill="none" stroke="${COL}" stroke-width="2.5" stroke-linecap="round"/>`,
  // ROCKNIX — mountains
  rocknix: masked(
    `<path d="M1.5 19 L8.5 7.5 L12.5 13.6 L15.5 9 L22.5 19 Z"/>`,
    `<path d="M6.8 10.3 L8.5 7.5 L10.2 10.3 L9 11 L8.5 10.4 L8 11 Z" fill="#000"/>`
  ),
  // Knulli — cute blob mascot
  knulli: masked(
    `<path d="M5.8 12.5 C5.8 7 18.2 7 18.2 12.5 V18 Q16.7 16.4 15.2 18 Q13.7 19.6 12 18 Q10.3 16.4 8.8 18 Q7.3 19.6 5.8 18 Z"/>`,
    `<circle cx="9.9" cy="12.6" r="1.25" fill="#000"/>
     <circle cx="14.1" cy="12.6" r="1.25" fill="#000"/>`
  ),
};

const simpleIcons = {
  ollama: 'siOllama',
  opencode: 'siOpencode',
  pihole: 'siPihole',
  'home-assistant': 'siHomeassistant',
};

const wrap = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="-3 -3 30 30" fill="${COL}">${inner}</svg>`;

const jobs = [];
for (const [slug, key] of Object.entries(simpleIcons)) jobs.push([slug, wrap(siPath(key))]);
for (const [slug, inner] of Object.entries(custom)) jobs.push([slug, wrap(inner)]);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 200, height: 200 }, deviceScaleFactor: 1 });
for (const [slug, svg] of jobs) {
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`, { waitUntil: 'load' });
  const el = page.locator('svg');
  await el.screenshot({ path: `public/assets/compat/${slug}.png`, omitBackground: true });
  console.log('generated', slug);
}
await browser.close();
console.log('done', jobs.length, 'icons');
