---
name: website
description: Sets what the public website says, how its pages are built and how a change to it is verified.
---

# Website

The site in `website/` tells a visitor what AutoMovie does and lets a developer or a coding agent look up what it composes. [DESIGN.md](../../../website/DESIGN.md) owns each page's layout and the visual rules a change keeps; the [website README](../../../website/README.md) owns the routes and commands.

## What the site says

Lead with the product's strongest claim: the coding agent writes the screenplay through the authoring chain, the evidence graph checks that every decision is realized, and the engine computes the motion hint from code into the same frames every time. Present the motions, the archetypes and the scenes as the kit a production composes with, after that claim: any action is a typed call over the engine's primitives, and calls compose. Never lead with how many there are, since the count changes with every release.

State only what the repository does. Take a command, a file path, an option, a diagnostic or a number from the source or a run. Show real output, or mark an excerpt as abridged and say whose numbers it shows. Leave out what a release does not ship, and describe people only as the polygon man.

Write every page, label and doc under [Writing](../documentation/writing.md). A landing page may use short headlines, but each sentence still makes one plain claim.

## Building a page

Show a card or a player from a baked take, never by planning a take in the browser while the visitor waits. A page reads `BakedManifest` while it is exported and falls back to the take worker only when a take was never baked. Compute in the page only what the visitor asks for, such as another take or a playground composition.

A scene that plays must bake: the bake exits 1 when the packages refuse one, so a scene record is fixed or marked `refusedUntil` in the same change.

The documentation is two trees, each with a `_meta.ts` per folder. The guide in `src/content/docs/` serves the person who makes a film: what to do, what happens and why. The reference in `src/content/reference/` serves whoever writes against the packages: commands, configuration, formats and APIs. A page that mixes the two is split, the guide linking to the reference for the details. The API at `/api/` is TypeDoc's output over every library package, regenerated each build; a page links an export's entry there rather than restating its type. A rule the product owns stays in its package README or skill, and the docs link to it rather than restate it.

## Verifying a change

Verify on the production build, because the dev server compiles the packages for minutes and serves what the export does not.

1. Run `pnpm --filter @automovie/website typecheck`.
2. Run `build`, which runs the checks and the bake before the export and the bundle check after it.
3. Run `smoke`, which opens every case in a headless browser.
4. Look at each changed page with `shots --full --scroll` at 1440 px and at 390 px, in both themes and under `--reduced`, and at the stills with `posters`.

Judge the screenshots under [visual debugging](../visual-debugging/SKILL.md) and against the rules in DESIGN.md. Fix every finding of a round by cause before the next round.
