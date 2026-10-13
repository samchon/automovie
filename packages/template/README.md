# @automovie/template

`@automovie/template` renders and installs the bundled `scaffold` for a new AutoMovie production. The installed files then belong to the project; package upgrades never overwrite them.

## Generated project

- `AGENTS.md` routes the shipped skills, and `CLAUDE.md` only imports it.
- `.agents/skills/3d-modeling` and `.agents/skills/contracts/common.md` are byte copies of the repository's own, synced by `build/syncScaffoldInstructions.ts`; `.agents/skills/contracts/SKILL.md` says how production source answers that checklist.
- `evidence.config.ts` has every exported type and function under `src` answer `contracts/common.md` through `@wrtnlabs/evidence`; `lint.config.ts` configures source correctness lint.
- The scaffold ships no production content, viewer stub, or provider-specific hook.

`renderScaffold` excludes working artifacts from its source population: a `node_modules`, `.git`, or `.cache` directory, or a file with a builder-output shape, belongs to whoever ran a tool there, and a generated project's loader would prefer an emitted `.js` to the `.ts` beside it. The scaffold's ignore rules ship as `scaffold/_gitignore` and install as `.gitignore`, because npm renames a packed `.gitignore` to `.npmignore`; supplying both root identities is refused.

## Public API

`renderScaffold` returns a deterministic project-relative file map with `{{name}}` and the catalog-resolved `{{version:*}}` tokens substituted. `publishFiles` validates and freezes that candidate, then returns a receipt naming every completed file and the first refused or parent-bound partial effect; `writeFiles` keeps the throwing API. New slots are created through Koffi-backed POSIX `openat` or Windows `NtCreateFile` parent-handle-relative adapters, so neither creation nor verification follows a successor child pathname.

## Development checks

`pnpm run build` syncs the scaffold's version placeholders and shared instructions, then compiles with source correctness lint. `pnpm run evidence` checks the declarations' checklist answers with `@wrtnlabs/evidence`, then runs the native source evidence guards.
