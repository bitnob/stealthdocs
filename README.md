# Bitnob docs

Source for the Bitnob developer documentation, built with [Mintlify](https://mintlify.com). It covers the product guides, the API reference generated from OpenAPI, the Platform API, the learning courses and playbooks, and the developer playground.

## Local development

The Mintlify CLI does not support Node 25 or newer, so the `Makefile` pins the preview to an LTS Node installed through nvm.

```bash
nvm install 22        # once, if you do not have it
make dev              # http://localhost:3333
make broken-links     # check every internal link
```

Overrides:

```bash
make dev PORT=4000 NODE_VERSION=22
```

Run `make broken-links` before opening a pull request. It resolves every internal link, including links into the generated API reference.

## Layout

| Path | What lives there |
| --- | --- |
| `docs.json` | Site config: navigation, tabs, theme, redirects, contextual menu, OpenAPI sources |
| `docs/` | Product guides, grouped by product (bitcoin, stablecoins, trading, payouts, card issuing, virtual accounts, enterprise) |
| `api-reference/` | Hand-written API reference pages that sit alongside the generated endpoint pages |
| `api-collections/` | OpenAPI specs and Postman collections the API reference is generated from |
| `learn/` | Courses and operator playbooks |
| `snippets/` | Reusable MDX and the playground JSX components |
| `images/`, `logo/` | Static assets referenced with root-relative paths, for example `/images/hero.jpg` |
| `changelog.mdx` | Product changelog |
| `playground.css` | Styling for the playground tools |

## Navigation

Every page must be listed in `docs.json` under `navigation.tabs`. A page that is not listed will build but stays unreachable, so add the entry in the same change as the page.

Tabs: Docs, API reference, Platform, Playground, Learn, Changelog.

When a page moves or is renamed, add an entry to the `redirects` array in `docs.json` rather than leaving the old URL dead.

## API reference

The endpoint pages under `api-reference/` and the Platform tab are generated at build time from the specs in `api-collections/swagger/`:

- `bitnob-api-v2.openapi.json` renders into `api-reference/`
- `bitnob-platform.openapi.json` renders into `api-reference/platform/`

Edit the spec, not the generated page. Only the hand-written pages checked into `api-reference/` are edited directly.

## Page conventions

### Frontmatter

```yaml
---
title: "Handle payout failures"
description: "One sentence that says what the page covers and what the reader leaves with."
related:
  - /docs/payouts/statuses-and-webhook-events
  - /docs/payouts/payout-incident-postmortem
---
```

Rules the metadata has to hold to:

- `title` is the page's `<h1>` and its SEO title, which Mintlify renders as `Title - Bitnob`. Aim for roughly 40 to 60 characters including that suffix, and make it specific enough to stand alone in a search result. `Overview` is not a page title, `Virtual card issuing on Bitnob` is.
- `sidebarTitle` carries the short label when the SEO title is too long for the sidebar. Every section entry page uses this pair, so the sidebar still reads `Overview` while the title does the SEO work.
- `description` stays at 160 characters or fewer. Google truncates past that, and social previews truncate earlier still. It also feeds the auto-generated social card, so write it as a standalone sentence rather than a lead-in.
- No two pages share a title.

`related` renders the **Related topics** list at the bottom of the page. Entries are root-relative paths, and Mintlify infers the label from the target page's title. Use the `"Label": /path` form only when the target has no title to infer, such as an endpoint page generated from an OpenAPI spec. Set `related: false` to hide the section on a page.

This section needs **Show related topics** enabled on the [Add-ons](https://app.mintlify.com/settings/deployment/addons) page in the Mintlify dashboard. Set the mode to Manual so only curated links appear.

### Writing style

- Sentence case for titles and headings. Lowercase the article after a colon.
- Lowercase `bitcoin` when it means the currency, capitalised `Bitcoin` when it means the network or protocol.
- Amounts are integers in the smallest unit of the currency, satoshis for BTC and cents for fiat. Never floats.
- Sandbox credentials in every example. Never a live key.
- No em dashes.

### Components

The set in use across the docs is `Steps`, `Columns`, `Card`, `Note`, `Tip`, `Info`, `Warning`, `Accordion`, `CodeGroup`, `ParamField`, `ResponseField`, and `Update` in the changelog. Use `Columns` rather than the deprecated `CardGroup`, and prefer `related` frontmatter over a hand-built card grid for onward navigation.

## Social previews

Mintlify generates the Open Graph image for every page at 1200x630, overlaying the site logo, the page `title`, and the page `description` on a background. The overlay is automatic, so a page with a good title and description gets a good social card for free.

The background behind that overlay is `images/og-background.png`, wired up in `docs.json`:

```json
"thumbnails": {
  "appearance": "dark",
  "background": "/images/og-background.png"
}
```

Do not set a global `og:image` in `seo.metatags`. That replaces the generated card with one static image on every page, so every link unfurls with the same title. Set `og:image` in a single page's frontmatter only when that page needs a bespoke card.

Social previews served from `mint dev`, including through a tunnel, do not always resolve the generated image. Verify unfurls against the deployed site.

## Changelog

`changelog.mdx` is a list of dated `Update` blocks, and `rss: true` in its frontmatter publishes them as a feed integrators can subscribe to.

The published spec at `https://bitnob.dev/api-collections/swagger/` is the source of truth for the API, not the copy in this repository. The `Spec sync` workflow in `.github/workflows/spec-sync.yml` runs every weekday morning, fetches the published spec, and compares it to the committed copy:

- Nothing differs, and the run ends.
- Bytes differ but no endpoint or field moved, and it opens a pull request with the updated spec and no changelog entry.
- The API surface changed, and it also diffs the two with [oasdiff](https://github.com/oasdiff/oasdiff), drafts a changelog entry from the changes, and puts the raw diff in the pull request body.

Breaking changes tag the entry `Breaking`, added endpoints tag it `New`, and anything else tags it `Fix`. The tags and the date are derived by code, and the prose is drafted by a model, so read the entry before merging. Drafting is allowed to fail: if it does, the pull request still carries the spec update and says the entry needs writing by hand.

Syncing the spec is not the whole job. A removed endpoint leaves a dead entry in `docs.json`, and a new one is unreachable until it is listed, so every sync pull request also runs `.github/scripts/check-navigation.mjs` and reports both kinds of drift in its body. Run it locally any time with `node .github/scripts/check-navigation.mjs`.

Every run rebuilds the branch `automation/spec-sync` from the default branch, so an open sync pull request always shows the difference between the site and the published spec. Run it on demand from the Actions tab.

Configure it once in the repository settings:

- Secret `OPENROUTER_API_KEY`: an [OpenRouter](https://openrouter.ai) key. Every model in the default list is free, so a key with no credit works. Each model is tried up to three times before the next one, since a free model sometimes returns an empty response.
- Variable `OPENROUTER_MODELS` (optional): a comma-separated list of model ids to try in order. Free model ids are retired from time to time, so this is the setting to change when drafting starts failing on every model.
- Variable `SPEC_FILES` (optional): a comma-separated list of spec filenames to sync. It defaults to `bitnob-api-v2.openapi.json`, the only one currently published. Add `bitnob-platform.openapi.json` once that spec is served too.
- Variable `SPEC_BASE_URL` (optional): the directory the specs are fetched from.

Entries for documentation changes, such as new playground features, are still written by hand.

## Deployment

Mintlify builds from this repository. Merging to `main` rebuilds the site once the repo is connected in the Mintlify dashboard. Preview a branch locally with `make dev` before merging.
