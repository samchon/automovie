# {{name}}

Use an LLM to author a complete movie screenplay, then program the main scenes' motion and staging and assemble the whole video as a reproducible film-generation hint. Stick figures, block figures, and coarse meshes can carry that performance; Human is optional. Stills and pilot clips alone do not complete a movie hint. A separately commissioned screenplay, whole motion hint, finished direct 3D film, and finished post-diffusion film have distinct delivery scopes. Standalone assets and short videos can use their own production path.

## First run

```bash
npm install --package-lock=false
npm run lint
npm run evidence
npm test
```

The blank project contains instructions, contracts, and configuration, with no story, models, viewer, render host, or media provider selected. Start with [production](.agents/skills/production/SKILL.md) for the requested output and [screenwriting](.agents/skills/screenwriting/SKILL.md) for creative work. Default lint and evidence check ordinary TypeScript source and tests; [evidence configuration](.agents/skills/evidence-configuration/SKILL.md) adds narrative scope and stages to that same configuration. Checks on an empty harness do not complete a production.

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

- `.agents/skills` holds task overviews, directly linked resources, and contracts. `AGENTS.md` routes narrative authoring to one `screenwriting` skill, whose task table selects stages, rewriting, evidence and repair without loading every procedure.
- `PROJECT.md` holds the project overview, commissioned scope, current choices, constraints and setup authority.
- `docs/instructions` holds creative writing requirements; other `docs` locations hold bodies, working editions, evidence and reviews when needed. [Layout and intake](.agents/skills/production/layout.md) explains their owners.
- `src` holds executable source and actual host entries, with optional provider or local-tool code in `src/integrations`; `test` holds tests and their runner; `public` holds retained fixed media.
- Runtime README instructions and `.env.example` hold nonsecret setup and variable names. Keep actual secrets in ignored local `.env`.
- `evidence.config.ts` selects duties through installed `@automovie/evidence`; `production.check.ts` calls its pass checker against that configuration.
- `lint.config.ts` configures source lint; `package.json` owns dependencies, commands, and compiler settings.

Installation is one-way: instructions, contracts, configuration, and authored source belong to this project, and package upgrades never overwrite them. Installed package READMEs, public types, and JSDoc own API behavior. Use [motion](.agents/skills/motion/SKILL.md) for scene performance, staging, and whole-video assembly. Choose [3D representation and acquisition](.agents/skills/3d-modeling/SKILL.md) and [audio](.agents/skills/audio/SKILL.md) for the commissioned video's actual needs, including direct 3D sound and setup; [delivery review](.agents/skills/delivery-review/SKILL.md) inspects the commissioned artifact. A motion hint needs the whole assembled video but no completed diffusion film; an explicitly requested direct 3D film can finish without diffusion.

The production skills and story contracts adapt [wrtnlabs/novels](https://github.com/wrtnlabs/novels/tree/6a9178bb2d96038d93b5313cd28682061cf44a03/packages/template/scaffold/.agents/skills). Its MIT copyright and permission notice remain in [LICENSE.novels](.agents/skills/LICENSE.novels); [provenance and responsibility ownership](.agents/skills/contracts/adoption.md#retain-provenance) records the adaptation.
