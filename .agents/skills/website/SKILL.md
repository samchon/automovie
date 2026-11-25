---
name: website
description: Sets what the public website says, how its pages are built and how a change to it is verified.
---

# Website

The [website](../../../website/README.md) presents AutoMovie's guide, catalog and API. Follow [DESIGN.md](../../../website/DESIGN.md) for layouts and [package scripts](../../../website/package.json) for local commands.

## What the site says

Lead with the screenplay, its staged performance and deterministic frame generation. Describe Evidence as linking selected requirements to their answers. Show motions, archetypes and scene studies through examples of typed actions composing into a take.

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
4. Use `shots --full --scroll` at 1440 and 390 px in both themes and reduced motion.
5. Inspect the take stills with `posters`.

Judge the screenshots under [visual debugging](../visual-debugging/SKILL.md) and against the rules in DESIGN.md. Fix every finding of a round by cause before the next round.
