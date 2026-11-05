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

The project includes instructions, contracts and a working empty Viewer with exact-time video export. Start with [production](.agents/skills/production/SKILL.md) for the requested output and [story](.agents/skills/story/SKILL.md) for creative work. Default lint and evidence check ordinary TypeScript source and tests; [evidence configuration](.agents/skills/evidence/configuration.md) adds narrative scope and stages to that same configuration. The empty scene and checks do not complete a production.

## Viewer and export

Run `npm run dev`, then open [the Viewer](http://127.0.0.1:5173/). Play, pause and seek use the same deterministic performance as export. URL parameters `start`, `end`, `rate` and `play=1` select interval playback, for example [0–15 seconds at half speed](http://127.0.0.1:5173/?start=0&end=15&rate=0.5&play=1). Author the scene, camera, exact-time placement and asset disposal in `src/createProduction.ts`; `src/durationSeconds.ts` supplies the whole-film clock.

Keep the server running, set `CHROME_PATH` to an installed Chrome or Chromium executable, then run `npm run render`. `render.config.ts` supplies the capture URL, raster, frame rate, destinations and optional complete soundtrack through `audioMix`. FFmpeg is supplied by `ffmpeg-static`; `FFMPEG_PATH` selects another executable. `VIEWER_URL` selects another running host. Capture mode uses `?capture=1&w=1280&h=720` and the completed `__afSeek(seconds)` hook.

The public Render runner writes `media/automovie/videos/film.mp4` and the command retains `media/automovie/videos/capture-report.json`. Export requires a whole number of frames and captures actual Viewer pixels at `i / fps`, followed by one video/audio encode. Its hashes and timings describe capture; inspect continuous playback and listen to the actual sound before accepting the film.

## Make a motion hint

1. Adopt the request, output boundary and operating choices, including the intended execution/capture path, in [PROJECT.md](PROJECT.md) through [project context](.agents/skills/production/profile.md). Make routine choices within the user's delegation and keep creative requirements with their owners.
2. Study any specialist performance through [research](.agents/skills/story/planning/research.md), then write the complete [screenplay](.agents/skills/story/SKILL.md), retaining settings → treatments → scripts → final audiovisual screenplay for long work. A short enters directly at screenplay or retains compact settings followed by screenplay, without treatments, scripts or an outline. Finish scripts content and expression together in construction, then final screenplay construction and its naturalness pass, with evidence and independent review. Both short routes retain their screenplay duties.
3. Build the [motion](.agents/skills/motion/SKILL.md) library from the study with its tests, then program every required main-scene performance through [staging for the camera](.agents/skills/motion/staging.md). Use suitable retained assets or start newly authored [representations and controls](.agents/skills/3d-modeling/SKILL.md) at low cost, preserving actual interactions and reactions, readable views and continued state across cuts before selective detail upgrades. [Accepted audio](.agents/skills/audio/SKILL.md) supplies performed sound and measured timing when required.
4. Prepare the [motion hint and requested companion controls](.agents/skills/production/conditioning.md) from the same actual performance, with aligned frame/camera mapping for time-matched channels. Use the supplied Viewer/export host or document the production's adopted replacement here.
5. Assemble and encode the complete work through [finishing](.agents/skills/production/finishing.md), then inspect the actual output through [delivery review](.agents/skills/review/delivery.md). Hand off the fixed inputs, source, commands, observed result and remaining limits.

A separately commissioned screenplay ends with its text duties; a standalone asset needs no invented narrative. A whole motion hint needs no finished diffusion film. A requested direct 3D film finishes through its actual renderer and sound path; [generated video](.agents/skills/production/generation.md) uses a selected service and accepted fixed takes before the final edit. Their delivery boundaries stay explicit in PROJECT.md.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run lint` | TypeScript and source correctness |
| `npm run evidence` | Source/test checklists and the selected path's active evidence obligations |
| `npm test` | Run exported `test_*` functions under `test/features` through `tsconfig.test.json`; an empty selection fails |
| `npm run format` | Source formatting |
| `npm run dev` | Actual production Viewer on `127.0.0.1:5173` |
| `npm run build` | Bundle the production Viewer |
| `npm run render` | Export the running Viewer using `render.config.ts` |

The project uses ES modules with `verbatimModuleSyntax` and `isolatedModules`: mark type-only imports and exports with `type`, and keep each file transformable on its own.

`test/index.ts` discovers pure logic unit tests in `test/features/<source path>/test_<name>.ts` through `tsconfig.test.json`. Export a named `test_<name>(): void` or `Promise<void>` function and assert behavior with `TestValidator` from `@nestia/e2e`. Use `npm test -- --include <substring> --exclude <substring>` to select test filenames; repeated options accumulate. Tests call portable logic directly; actual Viewer and media inspection run separately.

## Project files

- `.agents/skills` holds the task entry points `AGENTS.md` lists, their resources and the contracts. `AGENTS.md` groups creation, implementation/evidence, writing and assessment; `story` routes to its planning, layers, naturalness, correction and evidence parts.
- `PROJECT.md` holds the project overview, commissioned scope, current choices, constraints and setup authority.
- `docs/instructions` holds creative writing requirements; other `docs` locations hold bodies, working editions, evidence and reviews when needed. [Document layout](.agents/skills/story/layout.md), [source layout](.agents/skills/development/layout.md) and [media](.agents/skills/production/media.md) explain their owners.
- `src` holds executable source and actual host entries, with optional provider or local-tool code in `src/integrations`; `test` holds tests and their runner; `public` holds small fixed browser inputs, while audio and video belong in `media/`.
- Runtime README instructions and `.env.example` hold nonsecret setup and variable names. Keep actual secrets in ignored local `.env`.
- `evidence.config.ts` selects duties through installed `@automovie/evidence`; `pnpm evidence` evaluates the selected native graph.
- `lint.config.ts` configures source lint; `tsconfig.json` owns compiler settings and `tsconfig.test.json` scopes pure TypeScript unit tests. `package.json` owns dependencies and commands.

Package upgrades never rewrite this project. An explicit `automovie sync <directory> --check` inspects generated instruction updates; omit `--check` to apply a conflict-free plan. Sync preserves contracts, project decisions, README, configuration, authored content and proof. Keep `.automovie/scaffold-state.json` with the project; a legacy project needs a verified previous instruction root through `--baseline` for differing existing instructions. Retired generated paths are reported for explicit retirement. Updating instructions grants no renewed approval to old bodies or reviews. Installed package READMEs, public types and JSDoc own API behavior; the production supplies and documents its actual host and integrations.

The production skills and story contracts adapt [wrtnlabs/novels](https://github.com/wrtnlabs/novels/tree/13c60af339cc6f97dda67e40be055c94aa9bb144/packages/template/scaffold/.agents/skills). Video realization replaces final prose with image, sound, performance and editing decisions; installed `@automovie/evidence` owns the adapted graph and its separate source notice.
