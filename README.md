# Baskar R Portfolio

A static, hiring-focused Applied AI engineering portfolio. Built from the approved light editorial mockups with dark project illustrations, using HTML, CSS, and a small amount of JavaScript.

## Preview Locally

Requires Node.js 18 or later for the development server. No dependency installation is needed to view the site:

```sh
npm run dev
```

Open http://127.0.0.1:4173. Stop the server with Ctrl+C.

You can also open `site/index.html` directly in a browser. The email-copy button is only offered in secure contexts such as localhost or HTTPS. Navigation, case studies, and email links work without JavaScript.

## Pages

| File | Purpose |
| --- | --- |
| `site/index.html` | Homepage, experience, skills, and contact |
| `site/projects/sareebot.html` | Voice commerce case study |
| `site/projects/omnichannel-rag.html` | Hybrid retrieval case study |
| `site/projects/resumeai.html` | Document processing case study |
| `site/resume.html` | Printable resume based on the provided CV text |
| `site/404.html` | Missing-page recovery |
| `site/assets/styles.css` | Responsive styles and design tokens |
| `site/assets/main.js` | Mobile navigation, copy email, and print action |
| `design/` | Approved SVG and PNG mockups, not deployed |

All production files are in `site/`. There is no build step, application server, database, tracking script, external font request, or API key. Node.js and test packages are local development tools, not hosting requirements.

## Deploy For Free

### Recommended: Cloudflare Pages

Use Cloudflare Pages Free and its supplied `*.pages.dev` address. A custom purchased domain is optional and not free. No paid Workers, database, or AI service is needed for this site.

For automatic deployments from GitHub:

1. Create or select a GitHub repository for this project. Commit and push when you are ready; nothing has been committed or pushed automatically.
2. In Cloudflare, go to **Workers & Pages**, then create a **Pages** project and connect the GitHub repository. Make sure you select Pages, not a Worker deployment.
3. Use the configuration below and deploy.
4. Open the assigned HTTPS address and check the homepage, project links, resume printing, and a missing URL.

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Production branch | Your published branch; this workspace currently uses `master` |
| Root directory | `site` |
| Build command | Leave empty |
| Build output directory | `.` |
| Environment variables | None |

For a manual deployment instead, choose Pages **Direct Upload** and upload the `site` folder contents. `index.html` must be at the deployment root, not inside a nested `site` directory. Do not upload `node_modules`, tests, or design files. Cloudflare's direct-upload and Git-integrated project modes have different workflows; choose Git integration if you want future automatic updates.

Current service details: [Cloudflare Pages](https://developers.cloudflare.com/pages/), [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), [Free plan limits](https://developers.cloudflare.com/pages/platform/limits/). Free plans have quotas and terms that can change.

### Alternative: GitHub Pages

GitHub Pages can host these files without a paid server. For the cleanest URL, use the account-site repository `Baskar-forever.github.io` and publish `site/` as the Pages artifact with GitHub Actions. The resulting account-site address is `https://baskar-forever.github.io/`.

The included `.github/workflows/deploy-pages.yml` publishes `site/` on pushes to `main`. In the repository's Settings > Pages, choose **GitHub Actions** as the source. Remove any previous custom domain if you want the `github.io` address instead.

GitHub's branch-publishing option only accepts the repository root or `/docs`, not `/site`. The included workflow uploads `site/` directly, so no folder move or build step is needed. See [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Ordinary page links and assets also work under a project subpath. If using a project site such as `/baskar-portfolio/`, first change the recovery link in `site/404.html` from `/` to that exact site base. The default 404 link is for root-hosted Cloudflare or GitHub account sites.

## Before Sharing With Recruiters

- Confirm the freelance and education dates are current. The site preserves the CV's dates without asserting degree completion.
- Confirm the relationship between SareeBot AI and TeleAutomation. Until then, the case study labels TeleAutomation as a related product.
- Review the Omnichannel case study against the version you want to present. It describes the current public README's Qdrant/BGE/Llama 3.2 version rather than mixing it with the older CV stack.
- Supply the original resume PDF if you prefer a direct download. For now, Resume opens a real, printable web resume; it does not pretend to download the original file. Use its Print / Save PDF button and turn off browser-added headers and footers for a clean copy.
- Add anonymized product screenshots or demo recordings if available. Current project visuals are clearly labeled workflow illustrations.
- Update your GitHub bio, which previously described you as a first-year student.
- Once the final public address is known, add its absolute canonical URL and `og:url` to each page, plus a sitemap. Titles, descriptions, Open Graph text, and the favicon are already included; no guessed production URL is embedded.

No unsupported latency, accuracy, ATS-score, or business-impact metrics have been added. Public contact uses email, LinkedIn, and GitHub rather than publishing the phone number from the CV.

## Tests

```sh
npm ci
npx playwright install chromium
npm test
```

If the Playwright browser download is unavailable but Microsoft Edge is installed, use `PLAYWRIGHT_CHANNEL=msedge`. In PowerShell, run these separately:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm test
```

`PLAYWRIGHT_CHANNEL=chrome` also supports an installed Chrome browser. The normal default is Playwright's bundled Chromium.

The suite checks desktop and emulated mobile pages, local links and fragments, loaded images, horizontal overflow at 320/390/768/1024/1440px, axe WCAG A/AA rules, keyboard navigation, menu focus, clipboard success/failure, reduced motion, no-JavaScript navigation, resume printing, and 404 recovery. Screenshots and generated test PDFs are under ignored `test-results/` directories. Automated checks do not replace assistive-technology or real-device testing.

## Editing

Edit text directly in the HTML. Shared color tokens are at the top of `site/assets/styles.css`. The site deliberately avoids a framework and build system: editing and publishing the static files is enough. Do not put secrets or private client data in any public asset or HTML file.
