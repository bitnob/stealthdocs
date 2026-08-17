# Bitnob docs

Source for the Bitnob developer documentation, built with [Mintlify](https://mintlify.com). It covers the product guides, the API reference generated from OpenAPI, the wallet infrastructure API, the learning courses and playbooks, and the developer playground.

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

Tabs: Docs, API reference, Wallet infrastructure, Playground, Learn, Changelog.

When a page moves or is renamed, add an entry to the `redirects` array in `docs.json` rather than leaving the old URL dead.

## API reference

The endpoint pages under `api-reference/` and the Wallet infrastructure tab are generated at build time from the specs in `api-collections/swagger/`:

- `bitnob-api-v2.openapi.json` renders into `api-reference/`
- `bitnob-wallet-infrastructure.openapi.json` renders into `api-reference/wallet-infrastructure/`

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

`related` renders the **Related topics** list at the bottom of the page. Entries are root-relative paths, and Mintlify infers the label from the target page's title. Use the `"Label": /path` form only when the target title is ambiguous out of context, such as a page titled `Overview`. Set `related: false` to hide the section on a page.

This section needs **Show related topics** enabled on the [Add-ons](https://app.mintlify.com/settings/deployment/addons) page in the Mintlify dashboard. Set the mode to Manual so only curated links appear.

### Writing style

- Sentence case for titles and headings. Lowercase the article after a colon.
- Lowercase `bitcoin` when it means the currency, capitalised `Bitcoin` when it means the network or protocol.
- Amounts are integers in the smallest unit of the currency, satoshis for BTC and cents for fiat. Never floats.
- Sandbox credentials in every example. Never a live key.
- No em dashes.

### Components

The set in use across the docs is `Steps`, `Columns`, `Card`, `Note`, `Tip`, `Info`, `Warning`, `Accordion`, `CodeGroup`, `ParamField`, `ResponseField`, and `Update` in the changelog. Use `Columns` rather than the deprecated `CardGroup`, and prefer `related` frontmatter over a hand-built card grid for onward navigation.

## Deployment

Mintlify builds from this repository. Merging to `main` rebuilds the site once the repo is connected in the Mintlify dashboard. Preview a branch locally with `make dev` before merging.
