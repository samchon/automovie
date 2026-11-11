# {{name}}

Use an LLM to author a complete movie screenplay, then program the main scenes' motion, staging and camera and assemble the whole video as a reproducible motion hint. Every person is a polygon man, drawn from the body the installed Human package prepares, and every other subject is the simplest form that identifies it, as [entity work]({{skills}}/development/entities.md#coarse-first) sets; the accuracy goes to motion. Stills and pilot clips alone do not complete a motion hint.

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

Run `npm run dev`, then open [the Viewer](http://127.0.0.1:5173/). Play, pause and seek use the same deterministic performance as export. Each delivered video is one film in `src/composition/films/`, registered in `src/composition/films/index.ts` under its screenplay file's name, with its running time, frame rate and optional `width` × `height` delivery raster (1280 × 720 by default; 720 × 1280 for a vertical short); `?film=<name>` selects one, and may be omitted while only one exists. URL parameters `start`, `end`, `rate` and `play=1` select interval playback, for example [0 to 15 seconds at half speed](http://127.0.0.1:5173/?film=starter&start=0&end=15&rate=0.5&play=1). The starter film `src/composition/films/starter.ts` holds an empty scene; each film composes its scenes and sets its own running time.

Keep the server running, set `CHROME_PATH` to an installed Chrome or Chromium executable, then run `npm run render -- --film <name>`, omitting `--film` while only one film exists. `src/executable/render.ts` sets the selected film's capture URL, raster, frame rate, duration and destinations. FFmpeg is supplied by `ffmpeg-static`; `FFMPEG_PATH` selects another executable. `VIEWER_URL` selects another running host. Capture mode uses `?capture=1&w=1280&h=720&film=<name>` and the completed `__afSeek(seconds)` hook.

The public Render runner writes `media/automovie/<film>/videos/film.mp4` and the command retains `capture-report.json` beside it, so each film's renders stay apart. Export requires a whole number of frames and captures actual Viewer pixels at `i / fps`, followed by one picture-only encode. Its hashes and timings describe capture; judge the film on stills of the encoded file under [delivery review]({{skills}}/review/delivery-review.md), and ask the user to watch its playback before accepting it.

## Node frame capture

`npm run capture -- --film <name>` draws film frames directly in Node, with no Viewer server, browser or GPU: it mounts the film through its own `create()` and `seek()` and rasterizes each second on the CPU through the installed Viewer's Node rasterizer. It is the one route to stills of the source: by default it samples the ten-second window from `--from <s>` (0) at 5 frames per second on the film's frame grid and writes 50 frames `t<seconds>.png` with the second stamped in the corner, one 50-cell contact sheet `sheet-<from>-<to>.png` with a JSON cell index, and `manifest.json` into `media/automovie/<film>/frames/capture/<first>-<last>/`, named after the seconds of the first and the last still, `000.000-009.800` for the default window, and the same path on every run, so a run replaces the one before it unless `--round` keeps it. The script runs through `ttsx --no-plugins --noCheck`, so no type check or compiler plugin delays the drawing; the [compile checker]({{skills}}/development/SKILL.md) reports compile errors.

| Option | Effect |
| --- | --- |
| `--from <s>`, `--to <s>` | Half-open window, ten seconds from `--from` by default |
| `--rate <n>` | Stills per second, 5 by default and at most 10 |
| `--events <s,…>` | Adds 10 per second within half a second of each second, such as a contact |
| `--every <frames>`, `--at <s,…>` | The film's frame grid, or exact seconds, instead of the rate |
| `--view <name>[,<name>…]` | Each name is one of the film's `IFilmProduction.views`, such as side-on, behind a subject or high 45°, `film` for the film camera, or one of `front`, `back`, `right`, `left`, `top`, `bottom`, `three-quarter` and `three-quarter-back`, which frame everything the run draws; one name suffixes the folder, and several draw every second through each as `t<seconds>-<view>.png` into a folder suffixed `-views`, one sheet row per second |
| `--view x,y,z:tx,ty,tz` | A static inspection camera in world metres |
| `--parts <pattern,…>`, `--hide <pattern,…>` | Draw only, or leave out, the objects whose path matches |
| `--paths` | Print every object and construction curve path of the film, and draw nothing |
| `--shade <name>` | Colour surfaces as `depth`, `mask`, `normal`, `outline` or `pose`, as `clay` for form without colour, or as `faces` for the side each surface shows; `pose` draws the whole skeleton whatever `--parts` selects |
| `--surface 0`, `--wire` | Leave the surfaces out so only marks remain, or draw the triangle edges |
| `--curves <kind,…>` | Draw the film's `IFilmProduction.constructions`: `section`, `guide`, `axis` or `all` |
| `--defects <kind,…>`, `--sliver <aspect>` | Mark mesh defects: `open`, `non-manifold`, `inconsistent`, `degenerate` or `all`, and triangles thinner than the aspect |
| `--section <axis:metres>` | Cut the scene, as `y:1.2` removes everything above 1.2 m and `-y:1.2` everything below |
| `--xray`, `--stroke <px>` | Draw marks over the surfaces in front of them, and set their width, 3 by default |
| `--round <name>` | Keep the run under `rounds/<name>/` of its folder, where later runs leave it |
| `--compare <name>`, `--tolerance <n>` | Compare the run's stills against that round, counting a channel difference up to the tolerance, 0 by default, as unchanged |
| `--width`, `--height`, `--supersample <1-4>` | Raster override and antialiasing |
| `--per-sheet`, `--columns`, `--no-label`, `--no-sheet` | Cells per sheet, at least one per view, and cells per row, or no stamp or sheet |
| `--out <dir>`, `--list` | Another directory, or print the films |
| `--module <file.ts>[,<file.ts>…]` [`--export <name>`] | Unregistered film modules such as motion rehearsals, whole by default, into `media/automovie/modules/<module>/`; several share one run |
| `--video` | Every frame of the film's grid in the window (whole film by default), encoded with the installed FFmpeg into `media/automovie/<film>/videos/capture.mp4` as a quick review copy before the Viewer render |
| `--file <video>` | Sample [an encoded file](#stills-from-an-encoded-file) instead of a film |

A catalog case is one window of the catalog film, and a review segment one ten-second window of a delivered film:

```bash
npm run capture -- --film catalog --from 12 --to 14 --events 13.1 --view side
npm run capture -- --film <name> --from 60
```

The frames are flat-shaded diagnostics of pose, contact, staging and framing under the scene's lights, without textures, shadows or post-processing; their manifest counts objects that were not drawn. Film code must therefore run in plain Node: no DOM, no URL-loaded textures and no `import.meta.env`, with any development-server request falling back when absent. Delivered pixels still come from the Viewer through `npm run render`.

### Inspecting a form

The inspection options change what a still shows of the same film second, and each can be combined with the others. A pattern is matched against the object paths `--paths` prints, names joined by `/`: `*` stands for any run of characters inside one name and `**` for any number of names, a pattern without `/` matches that name anywhere and takes everything beneath it, and a pattern that matches nothing stops the run.

```bash
npm run capture -- --film catalog --paths
npm run capture -- --film catalog --at 0 --parts teapot --view front,right,top,three-quarter --shade clay --curves all
npm run capture -- --film catalog --at 0 --parts teapot --view three-quarter --shade faces --defects all --sliver 20
```

`--curves` draws what the film supplies as `IFilmProduction.constructions`: for each lofted form, the curves the installed Engine's `sampleAutoMovieConstructionCurves` reads from its realization, with the scene object the form was built into. They are the form at rest, so read them at a second that holds the rest pose. Each kind of mark has its own colour, and the run prints the legend with the count of each and records it in the manifest with the selected paths. A kind that was asked for and is missing from the legend was not found, so a mark's absence is a record and not a guess from the picture.

### Comparing rounds

An inspected run takes the same folder as a plain run of that window and view, so name a round for whatever a later run must leave. `--compare` reads the stills of the same names from `rounds/<name>/`, writes `diff-<still>` for each changed still, and writes `comparison.json` with each still's changed pixel count, share, largest difference and box, and the stills the round does not have.

```bash
npm run capture -- --film catalog --from 12 --to 14 --view side --round before
npm run capture -- --film catalog --from 12 --to 14 --view side --compare before
```

A named view frames what its own run draws, so a correction that moves or resizes the subject moves its camera too. The manifest records each named view's position and target; pass them as `--view x,y,z:tx,ty,tz` to hold the camera across rounds.

## Stills from an encoded file

The Node capture draws the source, so it cannot show what an encoded or generated file holds. `npm run capture -- --file <video>` samples such a file with the FFmpeg this project already uses, the `ffmpeg-static` executable or the one `FFMPEG_PATH` names, from `--from <s>` (0) to `--to <s>` (ten seconds later) at `--rate <n>` stills per second (5), and writes `t<seconds>.png` stills of the file's own pixels, captioned sheets and `manifest.json` into `media/automovie/files/<file name>/<from>-<to>/` or `--out <dir>`. Only those options, the sheet layout and the round options apply to a file.

```bash
npm run capture -- --file media/automovie/<film>/videos/film.mp4 --from 60
```

## Physical performance review

[Physical feedback]({{skills}}/motion/physical-feedback.md) chooses each scene's physical mode; the installed Engine's README and public declarations own its profiles, simulation, checkpoints, archives and audits. Supply `IFilmProduction.performance` from the displayed state to enable the shared inspection overlays; the starter's empty scene supplies none.

Run `npm run review:setup` once to install Playwright's recording FFmpeg, and set `CHROME_PATH` to an installed Chrome or Chromium executable. `npm run review -- playback <viewer-url> <observation-seconds>` records actual Play-button playback as a video with its displayed clock and browser errors into `media/automovie/<film>/videos/review/`, unless a final directory argument names another, for the user to watch.

In the Viewer, URL parameters `rig=1` and `contacts=1` show the review skeleton and contact force vectors, and `view` an inspection camera: one name or `x,y,z:tx,ty,tz` in world metres, as for capture. The capture's inspection options are URL parameters of the same names without the dashes, such as `?parts=teapot&shade=clay&curves=all`, and the page draws the same picture, with every mark one pixel wide, and lists each mark colour with its count beside the clock. On the page `section` cuts a film's own shader material only when its shader includes three.js's clipping chunks, while a capture cuts every material. A request the capture refuses is refused on the page too, with the reason in place of the clock. The page frames a named view on what each second draws, while a capture holds one framing for its run. Omit them for delivered captures. Judge a correction at the same source revision, film seconds and camera.

`npm run physics -- <input-module.ts> <output.amphys> [maximum-bytes]` computes a simulated performance once from a Node module exporting `createPhysicalInput()` and writes the archive with its JSON manifest, limited to 256 MiB by default. Keep the archive as a [stage cache]({{skills}}/production/stage-caches.md) under `.cache/` and regenerate it after changing physical inputs; playback, seeking and capture read it through the installed Engine's physical playback, which checks it against the current input's identity.

## Make a motion hint

1. Adopt the request, output boundary and operating choices in [PROJECT.md](PROJECT.md) through [project context]({{skills}}/production/project-context.md).

   Include the intended execution/capture path. Make routine choices within the user's delegation and keep creative requirements with their owners.

2. Study every practice and style the film shows through [research]({{skills}}/story/planning/research.md), then write the story with evidence and independent review.

   Write the [settings]({{skills}}/story/layers/settings.md), or a short's [brief]({{skills}}/story/layers/brief.md), that draw on the study, then the complete [screenplay]({{skills}}/story/SKILL.md) along its [writing route]({{skills}}/story/workflow.md#route-and-parents).

3. Build the coarse entities under [entity work]({{skills}}/development/entities.md) and accept every module in its [catalog cases]({{skills}}/motion/catalog-cases.md).

   Compose people's actions from the installed motion vocabulary, and write laws, interactions and consequences, with their tests, only for what it lacks.

4. Compose every required main scene from the accepted modules under [motion]({{skills}}/motion/SKILL.md) and [staging for the camera]({{skills}}/motion/staging.md).

   Put the scenes in the folders [source layout]({{skills}}/development/source-layout.md) gives. [Audio]({{skills}}/audio/SKILL.md) describes each shot's sound for the video-diffusion prompt.

5. Prepare the [motion hint and its control channels]({{skills}}/motion/control-channels.md) from the same actual performance.

   Keep the frame/camera mapping aligned for time-matched channels. Use the supplied Viewer/export host or document the production's adopted replacement here.

6. Assemble and encode the complete work through [assembly]({{skills}}/production/assembly.md), then inspect the actual output through [delivery review]({{skills}}/review/delivery-review.md).

   Hand off the fixed inputs, source, commands, observed result and remaining limits.

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
| `npm run capture -- --film <name> --from <s>` | Stills and one 50-cell sheet of a ten-second window, drawn in Node at 5 per second, with inspection views, marks and round comparison |
| `npm run capture -- --file <video> --from <s>` | The same stills and sheet sampled from an encoded file |

The project uses ES modules with `verbatimModuleSyntax` and `isolatedModules`: mark type-only imports and exports with `type`, and keep each file transformable on its own.

`test/index.ts` discovers pure logic unit tests in `test/features/<source path>/test_<name>.ts` through `tsconfig.test.json`. Export a named `test_<name>(): void` or `Promise<void>` function and assert behavior with `node:assert/strict` or `TestValidator` from `@nestia/e2e`. Use `npm test -- --include <substring> --exclude <substring>` to select test filenames; repeated options accumulate. Tests call portable logic directly; actual Viewer and media inspection run separately.

## Project files

| Path, when used | Holds |
| --- | --- |
| `.agents/skills`, at this project's root or its workspace root | The task entry points `AGENTS.md` lists, their resources and the contracts |
| `PROJECT.md` | The project overview, commissioned scope, current choices, constraints and setup authority |
| `docs/instructions` | Creative writing requirements |
| Other `docs` locations | Research studies, bodies, working editions, evidence, reviews and acceptance records when needed |
| `references/` | The retained research originals |
| `src` | Entities, laws, interactions, consequences, scene and film composition, host entries and commands |
| `src/integrations` | Optional provider or local-tool code |
| `test` | Tests and their runner |
| `index.html`, `vite.config.ts` | The Viewer host page and its Vite configuration |
| `public` | Small fixed browser inputs; audio and video belong in `media/` |
| Runtime README instructions and `.env.example` | Nonsecret setup and variable names; actual secrets stay in ignored local `.env` |
| `evidence.config.ts` | The duties selected through installed `@automovie/evidence`, which `npm run evidence` evaluates as the selected native graph |
| `lint.config.ts` | Generic source lint |
| `tsconfig.json` | Compiler settings |
| `tsconfig.test.json` | The scope of pure TypeScript unit tests |
| `package.json` | Dependencies and commands |

`AGENTS.md` groups creation, implementation/evidence, writing and assessment; `story` routes to its planning, layers, naturalness, correction and evidence parts.

[Document layout]({{skills}}/story/document-layout.md), [source layout]({{skills}}/development/source-layout.md) and [media records]({{skills}}/production/media-records.md) explain the owners of the `docs`, `src` and `media` locations. The dependency direction between source folders is the source layout's rule.

Package upgrades leave this project unchanged. `automovie sync <directory> --check`, run on the directory holding `AGENTS.md` (this project or its workspace root), previews generated instruction updates, and omitting `--check` applies a conflict-free plan that preserves contracts, project decisions, README, configuration, authored content and proof. Keep `.automovie/scaffold-state.json` beside that `AGENTS.md`; [sync and reorganization]({{skills}}/production/sync-and-reorganization.md) covers baselines, retired paths and approvals. Installed package READMEs, public types and JSDoc own API behavior.
