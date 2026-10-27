# {{name}}

Use an LLM to author a complete movie screenplay, then program the main scenes' motion, staging and camera and assemble the whole video as a reproducible film-generation hint. Stick figures, block figures and coarse meshes can carry that performance; Human is optional. Stills and pilot clips alone do not complete a movie hint.

## First run

Use Node.js 22.23.2 or later.

```bash
npm install --package-lock=false
npm run lint
npm run evidence
npm test
```

The blank project contains instructions, contracts, and configuration, with no story, models, viewer, render host, or media provider selected. Start with [production](.agents/skills/production/SKILL.md) for the requested output and [screenwriting](.agents/skills/screenwriting/SKILL.md) for creative work. Default lint and evidence check ordinary TypeScript source and tests; [evidence configuration](.agents/skills/evidence/configuration.md) adds narrative scope and stages to that same configuration. Checks on an empty harness do not complete a production.

## Make a motion hint

1. Adopt the request, output boundary and operating choices, including the intended execution/capture path, in [PROJECT.md](PROJECT.md) through [project context](.agents/skills/production/profile.md). Make routine choices within the user's delegation and keep creative requirements with their owners.
2. Write the complete [screenplay](.agents/skills/screenwriting/SKILL.md), retaining settings → treatments → scripts → final audiovisual screenplay for long work and the direct screenplay route for a short. Complete the selected expression, evidence and independent review duties.
3. Program every required main-scene performance through [staging for the camera](.agents/skills/motion/staging.md). Use suitable retained assets or start newly authored [representations and controls](.agents/skills/3d-modeling/SKILL.md) at low cost, preserving actual interactions and reactions, readable views and continued state across cuts before selective detail upgrades. [Accepted audio](.agents/skills/audio/SKILL.md) supplies performed sound and measured timing when required.
4. Prepare the [motion hint and requested companion controls](.agents/skills/production/conditioning.md) from the same actual performance, with aligned frame/camera mapping for time-matched channels. Capture through the supported production host and document its real entry and commands here; the scaffold installs no render host or universal movie command.
5. Assemble and encode the complete work through [finishing](.agents/skills/production/finishing.md), then inspect the actual output through [delivery review](.agents/skills/review/delivery.md). Hand off the fixed inputs, source, commands, observed result and remaining limits.

A separately commissioned screenplay ends with its text duties; a standalone asset needs no invented narrative. A whole motion hint needs no finished diffusion film. A requested direct 3D film finishes through its actual renderer and sound path; [generated video](.agents/skills/production/generation.md) uses a selected service and accepted fixed takes before the final edit. Their delivery boundaries stay explicit in PROJECT.md.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run lint` | TypeScript and source correctness |
| `npm run evidence` | Source/test checklists and the selected path's active evidence obligations |
| `npm run production:check -- --layer <layer> --pass <pass>` | After narrative opt-in, current pass structure and prerequisites; see [writing workflow](.agents/skills/screenwriting/workflow.md#completion) |
| `npm test` | Every exported `test_*` function under `test`; passes when there is none |
| `npm run format` | Source formatting |

The project uses ES modules with `verbatimModuleSyntax` and `isolatedModules`: mark type-only imports and exports with `type`, and keep each file transformable on its own.

## Project files

- `.agents/skills` holds eight task entry points, their directly linked resources and contracts. `AGENTS.md` groups creation, implementation/evidence and assessment; `screenwriting` selects its current stage, rewriting, evidence or repair procedure.
- `PROJECT.md` holds the project overview, commissioned scope, current choices, constraints and setup authority.
- `docs/instructions` holds creative writing requirements; other `docs` locations hold bodies, working editions, evidence and reviews when needed. [Layout and intake](.agents/skills/production/layout.md) explains their owners.
- `src` holds executable source and actual host entries, with optional provider or local-tool code in `src/integrations`; `test` holds tests and their runner; `public` holds retained fixed media.
- Runtime README instructions and `.env.example` hold nonsecret setup and variable names. Keep actual secrets in ignored local `.env`.
- `evidence.config.ts` selects duties through installed `@automovie/evidence`; `production.check.ts` calls its pass checker against that configuration.
- `lint.config.ts` configures source lint; `package.json` owns dependencies, commands, and compiler settings.

Installation is one-way: instructions, contracts, configuration and authored source belong to this project, and package upgrades never overwrite them. Installed package READMEs, public types and JSDoc own API behavior; the production supplies and documents its actual host and integrations.

The production skills and story contracts adapt [wrtnlabs/novels](https://github.com/wrtnlabs/novels/tree/6a9178bb2d96038d93b5313cd28682061cf44a03/packages/template/scaffold/.agents/skills). Its MIT copyright and permission notice remain in [LICENSE.novels](.agents/skills/LICENSE.novels); [provenance and responsibility ownership](.agents/skills/evidence/adoption.md#retain-provenance) records the adaptation.
