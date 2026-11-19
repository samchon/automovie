---
name: website
description: Sets what the public website says, how its pages are built and how a change to it is verified.
---

# Website

The site in `website/` tells a visitor what AutoMovie does and lets a developer or a coding agent look up what it composes. [DESIGN.md](../../../website/DESIGN.md) owns each page's layout, the visual system and the reasons for them; the [website README](../../../website/README.md) owns the routes and commands.

## What the site says

Lead with the product's strongest claim: the coding agent writes the screenplay through the authoring chain, the evidence graph checks that every decision is realized, and the engine computes the motion hint from code into the same frames every time. Present the motions, the archetypes and the scenes as the kit a production composes with, after that claim.

State only what the repository does. Take a command, a file path, an option, a diagnostic or a number from the source or a run, and show real output rather than a made-up terminal or dashboard. Leave out what a release does not ship, and describe people only as the polygon man.

Write every page, label and doc under [Writing](../documentation/writing.md). A landing page may use short headlines, but each sentence still makes one plain claim.

## Building a page

### Takes

Show a card or a player from a baked take, never by planning a take in the browser while the visitor waits. `pnpm run bake` computes every listed scene's first take and every motion tried alone, and draws each still; a page reads `BakedManifest` while it is exported and falls back to the take worker only when a take was not baked. Compute in the page only what the visitor asks for, such as another take or a playground composition.

A scene that plays must bake: the bake exits 1 when the packages refuse one, so a scene record is fixed or marked `refusedUntil` in the same change. Keep the stills and the 3D views on the one viewport ground, since the packages' colours are chosen for it.

### Design

Use the tokens in `src/app/tokens.css` for every colour, face, space and radius. Add a colour as a token with a light and a dark value, and add its pairs to `build/contrast.ts`.

Keep these, which the visual system depends on:

- the display serif for headings, the typewriter face for screenplay text, the mono face for code and names, and the sans face for the rest;
- one accent, the amber, for what is selected, the one primary action and the paths of a motion;
- at most one dark band on a page, and at most one engineered moment on the landing page;
- motion only on `transform` and `opacity`, under 300 ms for an interface response, and nothing that moves under `prefers-reduced-motion`;
- explicit sizes on every image and canvas, and `loading="lazy"` below the first screen.

### Content of the docs

The docs live in `src/content/docs/` with a `_meta.ts` per folder. A rule the product owns stays in its package README or skill, and the docs link to it rather than restate it.

## Verifying a change

Verify on the production build, because the dev server compiles the packages slowly and serves what the export does not.

1. Run `pnpm --filter @automovie/website typecheck` and `test`.
2. Run `bake`, then `build`, which checks imports, contrast and bundles.
3. Run `smoke`, which opens every case in a headless browser.
4. Look at each changed page with `shots --full --scroll` at 1440 px and at 390 px, in both themes and under `--reduced`, and at the stills with `posters`.

Judge the screenshots under [visual debugging](../visual-debugging/SKILL.md). Fix every finding of a round by cause before the next round.
