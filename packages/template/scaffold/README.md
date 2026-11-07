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

Run `npm run dev`, then open [the Viewer](http://127.0.0.1:5173/). Play, pause and seek use the same deterministic performance as export. Each delivered video is one film in `src/composition/films/`, registered in `src/composition/films/index.ts` under its screenplay file's name; `?film=<name>` selects one, and may be omitted while only one exists. URL parameters `start`, `end`, `rate` and `play=1` select interval playback, for example [0–15 seconds at half speed](http://127.0.0.1:5173/?film=starter&start=0&end=15&rate=0.5&play=1). The starter film `src/composition/films/starter.ts` holds an empty scene; each film composes its scenes and sets its own running time.

Keep the server running, set `CHROME_PATH` to an installed Chrome or Chromium executable, then run `npm run render -- --film <name>`, omitting `--film` while only one film exists. `src/executable/render.ts` sets the selected film's capture URL, raster, frame rate, duration and destinations, and takes an optional complete soundtrack through `audioMix`. FFmpeg is supplied by `ffmpeg-static`; `FFMPEG_PATH` selects another executable. `VIEWER_URL` selects another running host. Capture mode uses `?capture=1&w=1280&h=720&film=<name>` and the completed `__afSeek(seconds)` hook.

The public Render runner writes `media/automovie/<film>/videos/film.mp4` and the command retains `capture-report.json` beside it, so each film's renders stay apart. Export requires a whole number of frames and captures actual Viewer pixels at `i / fps`, followed by one video/audio encode. Its hashes and timings describe capture; inspect continuous playback and listen to the actual sound before accepting the film.

## Physical performance review

Declare each scene's default and each body's override as `kinematic`, `simulated` or `exaggerated`, following the installed Engine contracts. Kinematic performance uses authored targets, geometric contact receipts and formula reactions. Simulated performance uses admitted physical profiles, bounded tracking and solved contacts; exaggerated performance additionally records its impulse, gravity and compliance factors and their production reason. Keep screenplay outcomes as audit requirements in every mode. A failed contact or fall audit fails the performance; changing the screenplay to conceal it is not a repair.

The installed Engine owns numerical profiles, deterministic simulation, checkpoints, geometric measurements and audits. Its README and public declarations own their syntax. Retain the sampled inputs and cached state identity used by playback and export. Supply `IFilmProduction.performance` from that same displayed state to enable shared inspection overlays; the starter's empty scene supplies no physical data.

Run `npm run review:setup` once to install Playwright's matching recording FFmpeg, and set `CHROME_PATH` to an installed Chrome or Chromium executable. Run `npm run review -- still <viewer-url> <duration-seconds>` for a still, `npm run review -- sheet <viewer-url> <duration-seconds>` for frames every twenty film frames and their sheet, or `npm run review -- playback <viewer-url> <observation-seconds>` for actual Play-button playback. An optional final directory overrides `media/automovie/frames/review/` or `media/automovie/videos/review/`. Add `at=<seconds>` to a still URL. A sheet's JSON index maps each cell to its source and film second. Playback records the actual displayed clock and browser errors and a silent browser video; inspect the picture and listen to the production's soundtrack separately.

URL parameters `rig=1` and `contacts=1` enable the review skeleton and contact mean-force vectors in newtons, using each cached sample's impulse divided by its duration. `view=x,y,z:tx,ty,tz` selects a static inspection camera in world metres. These review URLs leave the ordinary delivered route unchanged. Omit review parameters for delivered captures, and compare the same source revision, film seconds and camera when judging a correction. Numerical success and a written capture receipt do not establish visible performance.

For an adopted simulated performance, export `createPhysicalInput()` from a Node input module and run `npm run physics -- src/composition/films/createPhysicalInput.ts public/performance.amphys`. The command computes the fixed-step performance once and writes the binary archive and its JSON manifest. An optional final argument limits archive bytes; the default is 256 MiB. Browser film creation loads the archive through `AutoMoviePhysicalPlayback.decode` with the expected identity from the current authored input and explicit byte/frame/segment limits, then seek, playback and capture read `playback.at(seconds)`. A hash copied only from the downloaded manifest cannot establish that the performance matches current source. Regenerate and recheck the archive after changing physical inputs. Installed Engine types and README own the input, checkpoint and solver-quality contracts.

## Make a motion hint

1. Adopt the request, output boundary and operating choices, including the intended execution/capture path, in [PROJECT.md](PROJECT.md) through [project context](.agents/skills/production/profile.md). Make routine choices within the user's delegation and keep creative requirements with their owners.
2. Study any specialist performance through [research](.agents/skills/story/planning/research.md), then write the complete [screenplay](.agents/skills/story/SKILL.md), retaining settings → treatments → scripts → final audiovisual screenplay for long work. A short enters directly at screenplay or retains compact settings followed by screenplay, without treatments, scripts or an outline. Finish scripts content and expression together in construction, then final screenplay construction and its naturalness pass, with evidence and independent review. Both short routes retain their screenplay duties.
3. Build the entities, laws, interactions and consequences through [motion](.agents/skills/motion/SKILL.md) with their tests, then compose every required main scene through [staging for the camera](.agents/skills/motion/staging.md), in the folders [source layout](.agents/skills/development/layout.md) gives. Use suitable retained assets or start newly authored [representations and controls](.agents/skills/3d-modeling/SKILL.md) at low cost, preserving actual interactions and reactions, readable views and continued state across cuts before selective detail upgrades. [Accepted audio](.agents/skills/audio/SKILL.md) supplies performed sound and measured timing when required.
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
| `npm run physics -- <input-module.ts> <output.amphys> [maximum-bytes]` | Precompute an adopted physical performance outside the browser |
| `npm run render -- --film <name>` | Export one film of the running Viewer |
| `npm run render -- --film <name> --from <s> --to <s> --every <frames>` | Write stills of one film's frames, or `--at <s,…>` seconds, into `--out <dir>` (default `media/automovie/<film>/frames/`) |

The project uses ES modules with `verbatimModuleSyntax` and `isolatedModules`: mark type-only imports and exports with `type`, and keep each file transformable on its own.

`test/index.ts` discovers pure logic unit tests in `test/features/<source path>/test_<name>.ts` through `tsconfig.test.json`. Export a named `test_<name>(): void` or `Promise<void>` function and assert behavior with `TestValidator` from `@nestia/e2e`. Use `npm test -- --include <substring> --exclude <substring>` to select test filenames; repeated options accumulate. Tests call portable logic directly; actual Viewer and media inspection run separately.

## Project files

- `.agents/skills` holds the task entry points `AGENTS.md` lists, their resources and the contracts. `AGENTS.md` groups creation, implementation/evidence, writing and assessment; `story` routes to its planning, layers, naturalness, correction and evidence parts.
- `PROJECT.md` holds the project overview, commissioned scope, current choices, constraints and setup authority.
- `docs/instructions` holds creative writing requirements; other `docs` locations hold bodies, working editions, evidence and reviews when needed. [Document layout](.agents/skills/story/layout.md), [source layout](.agents/skills/development/layout.md) and [media](.agents/skills/production/media.md) explain their owners.
- `src` holds entities, laws, interactions, consequences, scene and film composition, host entries and commands as [source layout](.agents/skills/development/layout.md) assigns, with optional provider or local-tool code in `src/integrations`; `test` holds tests and their runner; `public` holds small fixed browser inputs, while audio and video belong in `media/`.
- Runtime README instructions and `.env.example` hold nonsecret setup and variable names. Keep actual secrets in ignored local `.env`.
- `evidence.config.ts` selects duties through installed `@automovie/evidence`; `pnpm evidence` evaluates the selected native graph.
- `lint.config.ts` configures source lint, including the dependency direction between source folders; `tsconfig.json` owns compiler settings and `tsconfig.test.json` scopes pure TypeScript unit tests. `package.json` owns dependencies and commands.

Package upgrades never rewrite this project. An explicit `automovie sync <directory> --check` inspects generated instruction updates; omit `--check` to apply a conflict-free plan. Sync preserves contracts, project decisions, README, configuration, authored content and proof. Keep `.automovie/scaffold-state.json` with the project; a legacy project needs a verified previous instruction root through `--baseline` for differing existing instructions. Retired generated paths are reported for explicit retirement. Updating instructions grants no renewed approval to old bodies or reviews. Installed package READMEs, public types and JSDoc own API behavior; the production supplies and documents its actual host and integrations.

The production skills and story contracts adapt [wrtnlabs/novels](https://github.com/wrtnlabs/novels/tree/13c60af339cc6f97dda67e40be055c94aa9bb144/packages/template/scaffold/.agents/skills). Video realization replaces final prose with image, sound, performance and editing decisions; installed `@automovie/evidence` owns the adapted graph and its separate source notice.
