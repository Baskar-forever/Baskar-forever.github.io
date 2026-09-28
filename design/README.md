# Portfolio Design Proposal

Approved static visual mockups. The implemented website is in `../site/`; see the root `README.md` for preview and deployment instructions.

## Previews

- `desktop.svg`: 1440 x 2630, full desktop homepage.
- `mobile.svg`: 390 x 3340, full mobile homepage.
- PNG versions are generated from the SVG originals for convenient viewing.

The SVGs open directly in a browser. Buttons, navigation, and project links are visual only.

## Direction

Light editorial layout, dark technical project previews, deep teal accents, generous spacing, and restrained borders. Project previews are explicitly labeled illustrations, not product screenshots or live telemetry.

| Token | Value |
| --- | --- |
| Page | `#f6f5ef` |
| Surface | `#fffef9` |
| Primary text | `#202925` |
| Secondary text | `#64716a` |
| Accent | `#146b58` |
| Border | `#d9ded5` |
| Voice preview | `#183c30` |
| Retrieval preview | `#182b2d` |
| Document preview | `#30352e` |

Mockups use Segoe UI and Consolas, with standard fallbacks, for reproducible local previews. During implementation, evaluate locally hosted Manrope and IBM Plex Mono without depending on a third-party font service.

## Content And Layout

1. Name, navigation, and resume download.
2. Role-focused introduction, work/contact calls to action, and system diagram.
3. Three featured projects, each leading to a case study.
4. Two supporting projects without unverified metrics.
5. Experience, short biography, education, and award.
6. Direct email, GitHub, LinkedIn, and resume links.

Desktop emphasizes the voice-commerce project with a wide split panel. Mobile places previews above the project descriptions and simplifies the system diagrams rather than shrinking desktop content. Secondary mobile labels are illustrative; final implementation must use comfortable font sizes and touch targets of at least 44 x 44 CSS pixels.

## Confirm Before Publishing

- Whether SareeBot AI is a product within TeleAutomation, its former name, or a separate implementation. The mockup retains the CV project name until confirmed.
- Which Omnichannel RAG version to document. The CV and public README list different models and vector stores. The mockup only describes the shared retrieval architecture.
- Current education and employment status. Dates are taken from the supplied CV; degree completion is not asserted.
- Obtain the actual resume PDF. Parsed resume text is not a downloadable PDF asset.
- Obtain permission-cleared screenshots or demo recordings. Replace or supplement illustrations with real evidence where available.
- Verify final case-study claims against the implementation. Do not publish unmeasured latency, accuracy, ATS improvement, or client-impact figures.

## Implementation After Approval

Use static HTML, custom CSS, and minimal JavaScript. Plan one homepage and three case-study pages. Deploy on Cloudflare Pages Free with its supplied subdomain; GitHub Pages is an alternative.

Include semantic headings, visible keyboard focus, reduced-motion support, responsive images, metadata, and meaningful link labels. Keep essential content available without JavaScript. Do not add an API-backed chatbot, analytics, or a contact-form backend by default.
