# {{name}}

Use an LLM to author a complete movie screenplay, then program the main scenes' motion, staging and camera and assemble the whole video as a reproducible motion hint. Every person is a polygon man, drawn from the body the installed Human package prepares, and every other subject is the simplest form that identifies it, as [entity work]({{skills}}/development/entities.md#coarse-first) sets; the accuracy goes to motion. Stills and pilot clips alone do not complete a movie hint.

## First run

Use Node.js 22.23.2 or later. A production inside an AutoMovie workspace installs once with `pnpm install` at the workspace root instead of the `npm install` line, then runs the same scripts here.

```bash
npm install --package-lock=false
npm run lint
npm run evidence
npm test
```

The project includes instructions, contracts and a working empty Viewer with exact-time video export. Start with [production]({{skills}}/production/SKILL.md) for the requested output and [story]({{skills}}/story/SKILL.md) for creative work. Default lint and evidence check ordinary TypeScript source and tests; [evidence configuration]({{skills}}/evidence/configuration.md) adds narrative scope and stages to that same configuration. The empty scene and checks do not complete a production.

## Viewer and export

Run `npm run dev`, then open [the Viewer](http://127.0.0.1:5173/). Play, pause and seek use the same deterministic performance as export. Each delivered video is one film in `src/composition/films/`, registered in `src/composition/films/index.ts` under its screenplay file's name, with its running time, frame rate and optional `width` × `height` delivery raster (1280 × 720 by default; 720 × 1280 for a vertical short); `?film=<name>` selects one, and may be omitted while only one exists. URL parameters `start`, `end`, `rate` and `play=1` select interval playback, for example [0–15 seconds at half speed](http://127.0.0.1:5173/?film=starter&start=0&end=15&rate=0.5&play=1). The starter film `src/composition/films/starter.ts` holds an empty scene; each film composes its scenes and sets its own running time.

Keep the server running, set `CHROME_PATH` to an installed Chrome or Chromium executable, then run `npm run render -- --film <name>`, omitting `--film` while only one film exists. `src/executable/render.ts` sets the selected film's capture URL, raster, frame rate, duration and destinations. FFmpeg is supplied by `ffmpeg-static`; `FFMPEG_PATH` selects another executable. `VIEWER_URL` selects another running host. Capture mode uses `?capture=1&w=1280&h=720&film=<name>` and the completed `__afSeek(seconds)` hook.

The public Render runner writes `media/automovie/<film>/videos/film.mp4` and the command retains `capture-report.json` beside it, so each film's renders stay apart. Export requires a whole number of frames and captures actual Viewer pixels at `i / fps`, followed by one picture-only encode. Its hashes and timings describe capture; judge the film on stills of the encoded file under [delivery review]({{skills}}/review/delivery-review.md), and ask the user to watch its playback before accepting it.

## Node frame capture

`npm run capture -- --film <name>` draws film frames directly in Node, with no Viewer server, browser or GPU: it mounts the film through its own `create()` and `seek()` and rasterizes each second on the CPU through the installed Viewer's Node rasterizer. It is the one route to stills: by default it samples the ten-second window from `--from <s>` (0) at 5 frames per second on the film's frame grid and writes 50 frames `t<seconds>.png` with the second stamped in the corner, one 50-cell contact sheet `sheet-<from>-<to>.png` with a JSON cell index, and `manifest.json` into `media/automovie/<film>/frames/capture/<from>-<to>/`, the same path on every run. The script runs through `ttsx --no-plugins --noCheck`, so no type check or compiler plugin delays the drawing; the [compile checker]({{skills}}/development/SKILL.md) reports compile errors.

| Option | Effect |
| --- | --- |
| `--from <s>`, `--to <s>` | Half-open window, ten seconds from `--from` by default |
| `--rate <n>` | Stills per second, 5 by default and at most 10 |
| `--events <s,…>` | Adds 10 per second within half a second of each second, such as a contact |
| `--every <frames>`, `--at <s,…>` | The film's frame grid, or exact seconds, instead of the rate |
| `--view <name>` | One of the film's named `IFilmProduction.views`, such as side-on, behind a subject or high 45°, into a folder suffixed with that name |
| `--view x,y,z:tx,ty,tz` | A static inspection camera in world metres |
| `--width`, `--height`, `--supersample <1-4>` | Raster override and antialiasing |
| `--per-sheet`, `--columns`, `--no-label`, `--no-sheet` | Sheet layout, or no stamp or sheet |
| `--out <dir>`, `--list` | Another directory, or print the films |
| `--module <file.ts>[,<file.ts>…]` [`--export <name>`] | Unregistered film modules such as motion rehearsals, whole by default, into `media/automovie/modules/<module>/`; several share one run |
| `--video` | Every frame of the film's grid in the window (whole film by default), encoded with the installed FFmpeg into `media/automovie/<film>/videos/capture.mp4` as a quick review copy before the Viewer render |

A catalog case is one window of the catalog film, and a review segment one ten-second window of a delivered film:

```bash
npm run capture -- --film catalog --from 12 --to 14 --events 13.1 --view side
npm run capture -- --film <name> --from 60
```

The frames are flat-shaded diagnostics of pose, contact, staging and framing under the scene's lights, without textures, shadows or post-processing; their manifest counts objects that were not drawn. Film code must therefore run in plain Node: no DOM, no URL-loaded textures and no `import.meta.env`, with any development-server request falling back when absent. Delivered pixels still come from the Viewer through `npm run render`.

## Physical performance review

[Physical feedback]({{skills}}/motion/physical-feedback.md) chooses each scene's physical mode; the installed Engine's README and public declarations own its profiles, simulation, checkpoints, archives and audits. Supply `IFilmProduction.performance` from the displayed state to enable the shared inspection overlays; the starter's empty scene supplies none.

Run `npm run review:setup` once to install Playwright's recording FFmpeg, and set `CHROME_PATH` to an installed Chrome or Chromium executable. `npm run review -- playback <viewer-url> <observation-seconds>` records actual Play-button playback as a video with its displayed clock and browser errors into `media/automovie/<film>/videos/review/`, unless a final directory argument names another.

In the Viewer, URL parameters `rig=1` and `contacts=1` show the review skeleton and contact force vectors, and `view` an inspection camera: a named view or `x,y,z:tx,ty,tz` in world metres, as for capture. Omit them for delivered captures. Judge a correction at the same source revision, film seconds and camera.

`npm run physics -- <input-module.ts> <output.amphys> [maximum-bytes]` computes a simulated performance once from a Node module exporting `createPhysicalInput()` and writes the archive with its JSON manifest, limited to 256 MiB by default. Keep the archive as a [saved stage]({{skills}}/production/stage-caches.md) under `.cache/` and regenerate it after changing physical inputs; playback, seeking and capture read it through the installed Engine's physical playback, which checks it against the current input's identity.

## Make a motion hint

1. Adopt the request, output boundary and operating choices, including the intended execution/capture path, in [PROJECT.md](PROJECT.md) through [project context]({{skills}}/production/project-context.md). Make routine choices within the user's delegation and keep creative requirements with their owners.
2. Study every practice and style the film shows through [research]({{skills}}/story/planning/research.md), write the [settings]({{skills}}/story/layers/settings.md), or a short's [brief]({{skills}}/story/layers/brief.md), that draw on it, then write the complete [screenplay]({{skills}}/story/SKILL.md) along its [writing route]({{skills}}/story/workflow.md#route-and-parents), with evidence and independent review.
3. Build the entities, laws, interactions and consequences with their tests, from suitable retained assets or newly authored [representations and controls]({{skills}}/3d-modeling/SKILL.md) at low cost, and accept them case by case under [motion]({{skills}}/motion/SKILL.md).
4. Compose every required main scene from the accepted modules under [motion]({{skills}}/motion/SKILL.md) and [staging for the camera]({{skills}}/motion/staging.md), in the folders [source layout]({{skills}}/development/source-layout.md) gives. [Audio]({{skills}}/audio/SKILL.md) describes each shot's sound for the video-diffusion prompt.
5. Prepare the [motion hint and requested companion controls]({{skills}}/motion/control-channels.md) from the same actual performance, with aligned frame/camera mapping for time-matched channels. Use the supplied Viewer/export host or document the production's adopted replacement here.
6. Assemble and encode the complete work through [finishing]({{skills}}/production/assembly.md), then inspect the actual output through [delivery review]({{skills}}/review/delivery-review.md). Hand off the fixed inputs, source, commands, observed result and remaining limits.

A separately commissioned screenplay ends with its text duties; a standalone asset needs no invented narrative. A whole motion hint needs no finished diffusion film. A requested direct 3D film finishes through its actual renderer, with sound only as [audio]({{skills}}/audio/SKILL.md) sets; [generated video]({{skills}}/video/generation.md) uses the model, requests and prompts [video]({{skills}}/video/SKILL.md) sets and accepted fixed takes before the final edit. Their delivery boundaries stay explicit in PROJECT.md.

## Commands

| Command | Purpose |
| --- | --- |
| `npx ttsc --watch`, run in `test/` | The single compile checker kept running while you edit; read compile errors from its output |
| `npm run lint` | TypeScript and source correctness |
| `npm run evidence` | Source/test checklists and the selected path's active evidence obligations |
| `npm test` | Run exported `test_*` functions under `test/features` through `tsconfig.test.json`; an empty selection fails |
| `npm run format` | Source formatting |
| `npm run dev` | Actual production Viewer on `127.0.0.1:5173` |
| `npm run build` | Bundle the production Viewer |
| `npm run physics -- <input-module.ts> <output.amphys> [maximum-bytes]` | Precompute an adopted physical performance outside the browser |
| `npm run render -- --film <name>` | Export one film of the running Viewer as a picture-only video |
| `npm run capture -- --film <name> --from <s>` | Stills and one 50-cell sheet of a ten-second window, drawn in Node at 5 per second |

The project uses ES modules with `verbatimModuleSyntax` and `isolatedModules`: mark type-only imports and exports with `type`, and keep each file transformable on its own.

`test/index.ts` discovers pure logic unit tests in `test/features/<source path>/test_<name>.ts` through `tsconfig.test.json`. Export a named `test_<name>(): void` or `Promise<void>` function and assert behavior with `node:assert/strict` or `TestValidator` from `@nestia/e2e`. Use `npm test -- --include <substring> --exclude <substring>` to select test filenames; repeated options accumulate. Tests call portable logic directly; actual Viewer and media inspection run separately.

## Project files

- `.agents/skills`, at this project's root or at its workspace root, holds the task entry points `AGENTS.md` lists, their resources and the contracts. `AGENTS.md` groups creation, implementation/evidence, writing and assessment; `story` routes to its planning, layers, naturalness, correction and evidence parts.
- `PROJECT.md` holds the project overview, commissioned scope, current choices, constraints and setup authority.
- `docs/instructions` holds creative writing requirements; other `docs` locations hold research studies, bodies, working editions, evidence, reviews and acceptance records when needed, and `references/` the retained research originals. [Document layout]({{skills}}/story/document-layout.md), [source layout]({{skills}}/development/source-layout.md) and [media]({{skills}}/production/media-records.md) explain their owners.
- `src` holds entities, laws, interactions, consequences, scene and film composition, host entries and commands as [source layout]({{skills}}/development/source-layout.md) assigns, with optional provider or local-tool code in `src/integrations`; `test` holds tests and their runner; `public` holds small fixed browser inputs, while audio and video belong in `media/`.
- Runtime README instructions and `.env.example` hold nonsecret setup and variable names. Keep actual secrets in ignored local `.env`.
- `evidence.config.ts` selects duties through installed `@automovie/evidence`; `npm run evidence` evaluates the selected native graph.
- `lint.config.ts` configures generic source lint; the dependency direction between source folders is the [source layout]({{skills}}/development/source-layout.md)'s rule; `tsconfig.json` owns compiler settings and `tsconfig.test.json` scopes pure TypeScript unit tests. `package.json` owns dependencies and commands.

Package upgrades leave this project unchanged. `automovie sync <directory> --check`, run on the directory holding `AGENTS.md` (this project or its workspace root), previews generated instruction updates, and omitting `--check` applies a conflict-free plan that preserves contracts, project decisions, README, configuration, authored content and proof. Keep `.automovie/scaffold-state.json` beside that `AGENTS.md`; [ownership and customization]({{skills}}/production/sync-and-reorganization.md) covers baselines, retired paths and approvals. Installed package READMEs, public types and JSDoc own API behavior.

Video realization turns the screenplay into image, sound, performance and editing decisions; the installed `@automovie/evidence` owns the evidence graph.
