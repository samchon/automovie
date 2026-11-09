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

Run `npm run dev`, then open [the Viewer](http://127.0.0.1:5173/). Play, pause and seek use the same deterministic performance as export. Each delivered video is one film in `src/composition/films/`, registered in `src/composition/films/index.ts` under its screenplay file's name, with its running time, frame rate and optional `width` × `height` delivery raster (1280 × 720 by default; 720 × 1280 for a vertical short); `?film=<name>` selects one, and may be omitted while only one exists. URL parameters `start`, `end`, `rate` and `play=1` select interval playback, for example [0–15 seconds at half speed](http://127.0.0.1:5173/?film=starter&start=0&end=15&rate=0.5&play=1). The starter film `src/composition/films/starter.ts` holds an empty scene; each film composes its scenes and sets its own running time.

Keep the server running, set `CHROME_PATH` to an installed Chrome or Chromium executable, then run `npm run render -- --film <name>`, omitting `--film` while only one film exists. `src/executable/render.ts` sets the selected film's capture URL, raster, frame rate, duration and destinations, and takes an optional complete soundtrack through `audioMix`. FFmpeg is supplied by `ffmpeg-static`; `FFMPEG_PATH` selects another executable. `VIEWER_URL` selects another running host. Capture mode uses `?capture=1&w=1280&h=720&film=<name>` and the completed `__afSeek(seconds)` hook.

The public Render runner writes `media/automovie/<film>/videos/film.mp4` and the command retains `capture-report.json` beside it, so each film's renders stay apart. Export requires a whole number of frames and captures actual Viewer pixels at `i / fps`, followed by one video/audio encode. Its hashes and timings describe capture; inspect continuous playback and listen to the actual sound before accepting the film.

## Node frame capture

`npm run capture -- --film <name>` draws film frames directly in Node, with no Viewer server, browser or GPU: it mounts the film through its own `create()` and `seek()` and rasterizes each second on the CPU through the installed Viewer's Node rasterizer. By default it samples the ten-second window from `--from <s>` (0) at 5 frames per second on the film's frame grid, so one run writes 50 frames `t<seconds>.png` with the second stamped in the corner, one 50-cell contact sheet `sheet-<from>-<to>.png` with a JSON cell index, and `manifest.json`, into `media/automovie/<film>/frames/capture/<from>-<to>/`, the same path on every run. `--to <s>` ends the half-open window, `--rate <n>` samples up to 10 per second, `--events <s,…>` adds 10 per second within half a second of each event second, such as a contact, `--every <frames>` samples the film's frame grid instead, `--at <s,…>` draws exact seconds, `--view <name>` draws through one of the film's named `IFilmProduction.views`, such as a side-on view, one behind a subject or a high 45° view, into a folder suffixed with that name, and `--view x,y,z:tx,ty,tz` through a static inspection camera in world metres. `--width`/`--height` override the film's raster, `--supersample <1-4>` antialiases, `--per-sheet`/`--columns` lay out sheets, `--no-label`/`--no-sheet` drop them, `--out <dir>` redirects, and `--list` prints the films. `--module <file.ts>` (with `--export <name>` for a module with several exports) captures an unregistered film module instead, into `media/automovie/modules/<module>/`. The script runs through `ttsx --no-plugins --noCheck`, so no type check or compiler plugin delays the drawing; the [compile checker](.agents/skills/development/SKILL.md) reports compile errors.

A catalog case is one window of the catalog film, and a review segment one ten-second window of a delivered film:

```bash
npm run capture -- --film catalog --from 12 --to 14 --events 13.1 --view side
npm run capture -- --film <name> --from 60
```

The frames are flat-shaded diagnostics of pose, contact, staging and framing under the scene's lights, without textures, shadows or post-processing; their manifest counts objects that were not drawn. Film code must therefore run in plain Node: no DOM, no URL-loaded textures and no `import.meta.env`, with any development-server request falling back when absent. Delivered pixels still come from the Viewer through `npm run render`.

## Physical performance review

[Physical feedback](.agents/skills/motion/physics.md) chooses each scene's physical mode; the installed Engine's README and public declarations own its profiles, simulation, checkpoints, archives and audits. Supply `IFilmProduction.performance` from the displayed state to enable the shared inspection overlays; the starter's empty scene supplies none.

Run `npm run review:setup` once to install Playwright's recording FFmpeg, and set `CHROME_PATH` to an installed Chrome or Chromium executable. `npm run review -- still <viewer-url> <duration-seconds>` captures one still at the URL's `at=<seconds>`; `playback <viewer-url> <observation-seconds>` records actual Play-button playback as a silent video with its displayed clock and browser errors, so listen to the soundtrack separately. Output goes to `media/automovie/<film>/frames/review/` or `media/automovie/<film>/videos/review/` unless a final directory argument names another.

In the Viewer, URL parameters `rig=1` and `contacts=1` show the review skeleton and contact force vectors, and `view` an inspection camera: a named view or `x,y,z:tx,ty,tz` in world metres, as for capture. Omit them for delivered captures. Judge a correction at the same source revision, film seconds and camera.

`npm run physics -- <input-module.ts> <output.amphys> [maximum-bytes]` computes a simulated performance once from a Node module exporting `createPhysicalInput()` and writes the archive with its JSON manifest, limited to 256 MiB by default. Keep the archive as a [saved stage](.agents/skills/production/stages.md) under `.cache/` and regenerate it after changing physical inputs; playback, seeking and capture read it through the installed Engine's physical playback, which checks it against the current input's identity.

## Make a motion hint

1. Adopt the request, output boundary and operating choices, including the intended execution/capture path, in [PROJECT.md](PROJECT.md) through [project context](.agents/skills/production/profile.md). Make routine choices within the user's delegation and keep creative requirements with their owners.
2. Study every practice and style the film shows through [research](.agents/skills/story/planning/research.md), write the [settings](.agents/skills/story/layers/settings.md) that draw on it, then write the complete [screenplay](.agents/skills/story/SKILL.md) along its [writing route](.agents/skills/story/workflow.md#route-and-parents), with evidence and independent review.
3. Build the entities, laws, interactions and consequences through [motion](.agents/skills/motion/SKILL.md) with their tests, from suitable retained assets or newly authored [representations and controls](.agents/skills/3d-modeling/SKILL.md) at low cost, and perfect each one in its isolated catalog cases on screen.
4. Compose every required main scene from those accepted modules through their APIs and the screenplay alone, under [staging for the camera](.agents/skills/motion/staging.md) in the folders [source layout](.agents/skills/development/layout.md) gives, reviewing each 10-second segment in film order. [Accepted audio](.agents/skills/audio/SKILL.md) supplies performed sound and measured timing when required.
5. Prepare the [motion hint and requested companion controls](.agents/skills/production/conditioning.md) from the same actual performance, with aligned frame/camera mapping for time-matched channels. Use the supplied Viewer/export host or document the production's adopted replacement here.
6. Assemble and encode the complete work through [finishing](.agents/skills/production/finishing.md), then inspect the actual output through [delivery review](.agents/skills/review/delivery.md). Hand off the fixed inputs, source, commands, observed result and remaining limits.

A separately commissioned screenplay ends with its text duties; a standalone asset needs no invented narrative. A whole motion hint needs no finished diffusion film. A requested direct 3D film finishes through its actual renderer and sound path; [generated video](.agents/skills/production/generation.md) uses a selected service and accepted fixed takes before the final edit. Their delivery boundaries stay explicit in PROJECT.md.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm ttsc --watch`, run in `test/` | The single compile checker kept running while you edit; read compile errors from its output |
| `npm run lint` | TypeScript and source correctness |
| `npm run evidence` | Source/test checklists and the selected path's active evidence obligations |
| `npm test` | Run exported `test_*` functions under `test/features` through `tsconfig.test.json`; an empty selection fails |
| `npm run format` | Source formatting |
| `npm run dev` | Actual production Viewer on `127.0.0.1:5173` |
| `npm run build` | Bundle the production Viewer |
| `npm run physics -- <input-module.ts> <output.amphys> [maximum-bytes]` | Precompute an adopted physical performance outside the browser |
| `npm run render -- --film <name>` | Export one film of the running Viewer |
| `npm run render -- --film <name> --from <s> --to <s> --every <frames>` | Write stills of one film's frames, or `--at <s,…>` seconds, into `--out <dir>` (default `media/automovie/<film>/frames/`) |
| `npm run capture -- --film <name> --from <s>` | Draw a ten-second window at 5 frames per second (`--rate` up to 10, `--events` around contacts) in Node into one 50-cell sheet, without a server or browser |

The project uses ES modules with `verbatimModuleSyntax` and `isolatedModules`: mark type-only imports and exports with `type`, and keep each file transformable on its own.

`test/index.ts` discovers pure logic unit tests in `test/features/<source path>/test_<name>.ts` through `tsconfig.test.json`. Export a named `test_<name>(): void` or `Promise<void>` function and assert behavior with `node:assert/strict` or `TestValidator` from `@nestia/e2e`. Use `npm test -- --include <substring> --exclude <substring>` to select test filenames; repeated options accumulate. Tests call portable logic directly; actual Viewer and media inspection run separately.

## Project files

- `.agents/skills` holds the task entry points `AGENTS.md` lists, their resources and the contracts. `AGENTS.md` groups creation, implementation/evidence, writing and assessment; `story` routes to its planning, layers, naturalness, correction and evidence parts.
- `PROJECT.md` holds the project overview, commissioned scope, current choices, constraints and setup authority.
- `docs/instructions` holds creative writing requirements; other `docs` locations hold research studies, bodies, working editions, evidence, reviews and acceptance records when needed, and `references/` the retained research originals. [Document layout](.agents/skills/story/layout.md), [source layout](.agents/skills/development/layout.md) and [media](.agents/skills/production/media.md) explain their owners.
- `src` holds entities, laws, interactions, consequences, scene and film composition, host entries and commands as [source layout](.agents/skills/development/layout.md) assigns, with optional provider or local-tool code in `src/integrations`; `test` holds tests and their runner; `public` holds small fixed browser inputs, while audio and video belong in `media/`.
- Runtime README instructions and `.env.example` hold nonsecret setup and variable names. Keep actual secrets in ignored local `.env`.
- `evidence.config.ts` selects duties through installed `@automovie/evidence`; `npm run evidence` evaluates the selected native graph.
- `lint.config.ts` configures source lint, including the dependency direction between source folders; `tsconfig.json` owns compiler settings and `tsconfig.test.json` scopes pure TypeScript unit tests. `package.json` owns dependencies and commands.

Package upgrades leave this project unchanged. `automovie sync <directory> --check` previews generated instruction updates, and omitting `--check` applies a conflict-free plan that preserves contracts, project decisions, README, configuration, authored content and proof. Keep `.automovie/scaffold-state.json` with the project; [ownership and customization](.agents/skills/production/customization.md) covers baselines, retired paths and approvals. Installed package READMEs, public types and JSDoc own API behavior.

Video realization turns the screenplay into image, sound, performance and editing decisions; the installed `@automovie/evidence` owns the evidence graph.
