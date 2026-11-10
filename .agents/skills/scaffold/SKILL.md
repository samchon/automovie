---
name: scaffold
description: Maintains the generated-project scaffold under packages/template and routes production-content work to each production's own instructions. Use before editing packages/template, and before reading, authoring, or reviewing production content anywhere, repository fixtures and sandboxes included.
---

# Scaffold

A production's own `AGENTS.md`, `README.md`, and source own its meaning; read them and the installed package APIs before interpreting, authoring, or reviewing it. Repository instructions never override them.

[Scaffold prompting](../scaffold-prompting/SKILL.md) owns the design of shipped task skills, contracts and routers, with the [product principles](../scaffold-prompting/SKILL.md#product-principles) they serve. This skill owns their distribution and production ownership boundaries; [development](../development/SKILL.md) owns implementation changes to the materializer and checker.

## What the scaffold owns

The scaffold owns its production skills, directly linked resources and contracts, apart from the shared repository items below. Its own skills describe making a production, not developing this repository.

Read its [production skill](../../../packages/template/scaffold/instructions/.agents/skills/production/SKILL.md) for the commissioned outputs, project context and handoff, and [story](../../../packages/template/scaffold/instructions/.agents/skills/story/SKILL.md) before changing narrative authoring. The production's [motion skill](../../../packages/template/scaffold/instructions/.agents/skills/motion/SKILL.md) owns programmatic choreography, constraints, scene time and engine feedback, and 3D modeling owns its asset representations.

Installed package APIs own API documentation, and the scaffold does not duplicate them. `@automovie/evidence` owns reusable evidence defaults and native graph composition; the scaffold keeps one options object evaluated by native `pnpm evidence`.

## Source layout

The production's [source layout](../../../packages/template/scaffold/instructions/.agents/skills/development/layout.md) is its backbone. A folder change moves the layout table, the development stages of `@automovie/evidence` and the contract respondents together, or they disagree about where code belongs. The scaffold `lint.config.ts` stays generic and names no folder.

## Outputs and routes

The primary output is a whole deterministic motion-video hint from a complete LLM-authored screenplay: program the main scenes' motion and staging, then assemble the full video. Stills or pilot clips do not complete that commission.

Keep separately commissioned screenplay, whole motion hint, finished direct 3D film, and finished post-diffusion film distinct. Direct 3D needs no diffusion, and a motion hint needs no finished diffusion film.

Long-form work preserves settings → treatments → scripts → final screenplay, with construction, expression revision, evidence, current independent review, and whole-work completion. Short video runs brief → final screenplay, and asset-only work has no narrative. Compact questions within those responsibilities rather than removing the architecture.

Default lint and evidence configurations serve ordinary TypeScript development; narrative work opts into its additional workflow while retaining engineering checks.

## Shared items

An empty `$<name>` file under the scaffold's `.agents/skills` ships the repository item `<name>` at the same place under `.agents/skills`: `$3d-modeling` the whole folder, `development/$repair.md` the single file. The [instruction synchronizer](../../../packages/template/build/syncScaffoldInstructions.ts) copies those items into `lib/skills` on `prepare` and `build`, and the scaffold reader ships them in the placeholders' place.

Share a repository skill this way instead of keeping a second copy, and edit it at its repository source under the [shared skill](../prompting/SKILL.md#shared-skills) rule. [Root and scaffold](../scaffold-prompting/SKILL.md#root-and-scaffold) says which rules belong on which side.

## Layers

The scaffold has three layers:

| Layer | Ships at |
| --- | --- |
| `instructions` | A single production's root, and a workspace root |
| `production` | A single production's root, and each workspace `movies/<shorts|series>/<name>` |
| `workspace` | A workspace root only |

Instruction files take no token and stay layout-neutral: a project path they name is the production's, never a link out of `.agents`, and the production layer reaches the shared skills through `{{skills}}`. Shorts run brief → screenplay and series the whole long route.

Untracked files under `scaffold` still ship, so remove stale copies from a checkout before packaging.

## What a production owns

The generated project-root `PROJECT.md` owns adopted production scope, delivery and setup decisions, and `docs/instructions` owns creative instructions.

Runtime README and `.env.example` own nonsecret operational setup and variable names, and ignored `.env` holds actual secrets. `src/integrations` can hold adopted provider or local-tool code, and the scaffold's Node tooling ships under `src/executable` beside the commands that run it.

## Updating productions

Package upgrades do not rewrite productions. Explicit instruction updates use the CLI sync documented in the [CLI README](../../../packages/cli/README.md), which updates routers and bundled task resources while preserving contracts, project decisions, configuration and authored content. A scaffold edit alone reaches only future installations until sync is run.

For an authorized update to an existing production:

1. Compare the adopted baseline, the proposed scaffold and the actual local files before applying the named scope.
2. Use sync check to inspect changes and conflicts.
3. Preserve project choices and custom contracts, and align changed addresses, selected respondents and consumers together.
4. Follow that production's repair rules for affected answers and reviews.

New installations retain instruction digests; legacy projects need an explicitly verified prior instruction baseline for differing existing files. Do not infer renewed approval from new wording or overwrite a repaired body with an old working edition.

For changed installation behavior, observe a generated project's installed entry point and its `lint`, `evidence`, and `test` commands.
