# typixnode.com

Official website for **TypixNode** — a compact CNC aluminum cyberdeck powered by Raspberry Pi CM4/CM5.

Live at: [typixnode.com](https://typixnode.com)

## Tech Stack

- [Astro](https://astro.build/) — static site generator
- [Tailwind CSS](https://tailwindcss.com/) — utility-first styling
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) — hosting & CDN

## Development

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # output → dist/
```

## Deployment

Pushes to `main` automatically deploy via Cloudflare Workers (connected to this GitHub repo).

## Project Structure

```
src/
├── pages/index.astro        # Main page
├── layouts/Layout.astro     # HTML shell
├── components/              # Section components
│   ├── HeroSection.astro
│   ├── GallerySection.astro
│   ├── FeaturesSection.astro
│   ├── SpecsSection.astro
│   ├── OpenSourceSection.astro
│   ├── Nav.astro
│   └── Footer.astro
└── styles/global.css
public/images/               # Product renders
```

## License

Website source code is [MIT licensed](./LICENSE).

Product images and the TypixNode trademark are copyright Haohua Li. The "TypixNode" name and logo may not be used without permission.
