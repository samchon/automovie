# @automovie/template

`@automovie/template` renders and installs the bundled `scaffold` for a new AutoMovie production or workspace. The installed project owns its content and contracts. Package upgrades never overwrite them; explicit instruction sync updates only the generated instruction surface.

## Layers and installations

The scaffold is three layers under `scaffold/`: `instructions` (`AGENTS.md`, `CLAUDE.md`, `.agents/skills`), `production` (one production's package, configuration, `PROJECT.md`, README, source and tests) and `workspace` (a pnpm workspace root's `pnpm-workspace.yaml`, `package.json`, README and ignore rules). `renderScaffold` joins `instructions` and `production` into a single production; `renderWorkspaceScaffold` joins `instructions` and `workspace` into a workspace root whose named catalogs pin every production dependency, sharing one YAML anchor per release group; `renderWorkspaceProductionScaffold` renders `production` alone for `movies/<shorts|series>/<name>`, with `catalog:<name>` dependencies and links and evidence reaching the root's `.agents/skills` three directories up. The instruction layer takes no token, so both roots ship identical instruction bytes and one sync bundle serves them; a production layer token `{{skills}}` names the path to the shared skills.

## Generated project

- `AGENTS.md` routes the shipped skills, and `CLAUDE.md` only imports it.
- Twelve entry points group production, story, 3D modeling, motion, image, video and audio under creation, development and evidence under implementation, documentation and prompting under writing, and review under assessment. Each skill links its conditional task resources directly; installed packages own API behavior.
- The scaffold owns its skills and compact contracts, except where an empty `$<name>` placeholder under `.agents/skills` ships the repository item of that name at the same place, a whole folder or a single file. `build/syncScaffoldInstructions.ts` copies the named items into `lib/skills` on `prepare` and `build`, and the renderers ship them in the placeholders' place.
- `evidence.config.ts` calls `@automovie/evidence` with one options object. By default, exported types and functions under `src` answer two engineering questions, and exported test functions answer two testing questions. Adding narrative options to that same object retains the engineering checks and selects stage, scope, evidence, current independent review, and expression-transfer duties. The reusable implementation stays in the package. Asset and delivery obligations retain their own respondents; the [evidence skill](scaffold/instructions/.agents/skills/evidence/SKILL.md) explains ownership. `lint.config.ts` configures ordinary source correctness lint independently of narrative selection.
- `test/index.ts` runs every exported `test_*` function under `test` through `node:test` for `npm test`, and passes when there is none; the development skill's [testing guide](scaffold/instructions/.agents/skills/development/testing.md) decides when a production has tests.
- The scaffold ships no production content, viewer stub, or provider-specific hook.

The renderers exclude working artifacts from their source population: a `node_modules`, `.git`, or `.cache` directory, or a file with a builder-output shape, belongs to whoever ran a tool there, and a generated project's loader would prefer an emitted `.js` to the `.ts` beside it. Each installed layer's ignore rules ship as its root `_gitignore` and install as `.gitignore`, because npm renames a packed `.gitignore` to `.npmignore`; supplying both root identities is refused.

The [generated production workflow](scaffold/production/README.md#make-a-motion-hint) carries the screenplay into programmed performance, camera staging, requested conditioning channels, the actual capture host, whole edit and inspected output. Long work retains settings, treatments, scripts, final screenplay, with scripts expression completed in construction and a separate screenplay naturalness pass; a short can enter at final screenplay. Low-cost representations can carry accurate motion; Human is optional. Stills or pilot clips cannot complete a whole motion hint, while separately commissioned text, assets, direct 3D films and post-diffusion films retain their actual boundaries.

The installed project-root `PROJECT.md` owns adopted scope, delivery method, representation, tools, runtime and setup authority. Creative instructions stay under `docs/instructions`. Runtime READMEs and `.env.example` hold nonsecret setup and variable names; actual secrets remain in ignored local `.env`. Optional integration code belongs under `src/integrations`.

## Public API

Each renderer returns a deterministic file map relative to its installed directory, with `{{name}}`, `{{skills}}` and the `{{version:*}}` tokens substituted; `assertScaffoldProjectName` is the one name rule they apply. `publishFiles` validates and freezes that candidate, then returns a receipt naming every completed file and the first refused or parent-bound partial effect; `writeFiles` keeps the throwing API. New slots are created through Koffi-backed POSIX `openat` or Windows `NtCreateFile` parent-handle-relative adapters, so neither creation nor verification follows a successor child pathname.

## Explicit instruction updates

`planScaffoldSync` inspects one existing production or workspace root against `renderScaffoldInstructions`; `syncScaffold` applies its fresh conflict-free plan through the same verified publication path. They update routers and bundled non-contract skill resources, preserving project scope, configuration, contracts, custom extra skills, authored content and historical proof. Creation records `.automovie/scaffold-state.json`. Sync compares current LF-normalized digests with that baseline and the new bundle, refuses all writes on a local conflict and publishes the new state last. `baseline` names an explicit prior adopted instruction root for legacy projects; `check` inspects without writing. Retired paths are reported and retained. File-generation preconditions prevent a changed inspected file from being adopted as a fresh replacement; partial publication retains its receipt and never silently retries or rolls back. The [CLI](../cli/README.md) exposes this as `automovie sync`.

## Development checks

For shipped instruction design, use the repository's [scaffold-prompting skill](../../.agents/skills/scaffold-prompting/SKILL.md); [scaffold](../../.agents/skills/scaffold/SKILL.md) owns distribution and project ownership. Review task strategy, quality questions and their actual consumers together. Existing productions adopt an update explicitly; changing this bundle does not update their files or renew their earlier reviews.

`pnpm run build` syncs the scaffold's version placeholders and shared instructions, then compiles with source correctness lint and the shared evidence declaration guards. `pnpm run evidence` checks the declarations' checklist answers with `@wrtnlabs/evidence`.
