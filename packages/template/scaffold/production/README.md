# {{name}}

Use an LLM to author a complete screenplay and program its motion, staging and camera in 3D. Assemble the result as a reproducible motion hint or finish it as a direct 3D or generated film. Start with the polygon man prepared by the installed Human package and [coarse forms]({{skills}}/development/entities.md#coarse-first) for the other subjects.

## First run

Use Node.js 22.23.2 or later. Inside an AutoMovie workspace, run `pnpm install` once at the workspace root instead; the other commands still run here.

```bash
pnpm install
pnpm run lint
pnpm run evidence
pnpm test
```

The project starts with instructions, contracts and a working inspector page over an empty starter film. Passing checks do not complete a production.

Read the [production workflow]({{skills}}/production/workflow.md) for the stages, their handoffs and the skills that own them.

Default lint and evidence check ordinary TypeScript source and tests. [Evidence configuration]({{skills}}/evidence/configuration.md) adds the narrative scope and stages to the same configuration.

## Films and the inspector

Each delivered video is one film in `src/composition/films/`, registered in `src/composition/films/index.ts` under its [film name]({{skills}}/development/source-layout.md#source), which its folder's path gives, with its running time, frame rate and optional `width` × `height` delivery raster: 1280 × 720 by default, 720 × 1280 for a vertical short. Each film composes its own scenes; the starter film `src/composition/films/starter.ts` holds an empty one.

`pnpm run dev` serves [the inspector](http://127.0.0.1:5173/) over the films of `src/subjects.ts`, the same subjects the capture draws. The page holds one request in the capture's grammar: its panels edit it, its address carries it, such as [the starter at 2 seconds through the front view](http://127.0.0.1:5173/?subject=starter&at=2&views=front), and it shows the `automovie capture` command whose options, given to `pnpm run capture`, repeat the picture. A request the capture refuses is refused on the page too, with the reason. Play, pause and seek run the same deterministic performance as export.

## Stills

Run `pnpm run review:setup` once to install the browser. `pnpm run capture --subject <film> [request]` runs `automovie capture --module src/subjects.ts`: it draws each planned still of the film through the delivery render's draw function and writes the stills, contact sheets and a record into `media/capture/<film>/`, as the [render README](https://github.com/samchon/automovie/tree/master/packages/render#capture) describes, exiting non-zero when a cell could not be drawn. `pnpm exec automovie capture --file <video>` captures an encoded file's own frames around its cuts instead of a film.

The request takes the inspector address's keys, each written with `--` before it. The [render README](https://github.com/samchon/automovie/tree/master/packages/render#request-keys) lists every key with what it asks for and the requirement it serves, including marks, rounds, comparisons and the options that select exact frames or seconds.

```bash
pnpm run capture --subject catalog --from 12 --to 14 --events 13.1 --views "right;three-quarter@ortho"
pnpm exec automovie capture --file media/automovie/<film>/videos/film.mp4 --from 60 --to 70
```

## Render and playback

`pnpm run render --subject <film>` runs `automovie render --module src/subjects.ts`, and `--subject` may be omitted while only one film exists. It draws every frame in the browser `pnpm run review:setup` installs, through the capture's draw function, and encodes them once with no server running. When the production declares a film's [`sound`]({{skills}}/audio/soundtrack.md#sound-list), the render mixes its lines and cues into the film's soundtrack and encodes it with the picture; a soundtrack supplied as `delivery.audio.path` is encoded as given. `CHROME_PATH` selects another browser and `FFMPEG_PATH` another FFmpeg.

The render writes `media/automovie/<film>/videos/film.mp4`, or into `--out <dir>`, with `render-report.json` beside it. Export requires a whole number of frames. The report's hashes describe the drawn frames and, for a mixed soundtrack, its digest and each line's PCM digest, and [delivery review]({{skills}}/review/delivery-review.md) judges the film.

`--background transparent` instead draws the beauty pass over a transparent background and wraps the straight-alpha PNG frames, unencoded, into `media/automovie/<film>/transparent/film.mov` with no audio, for compositing in post. It cannot be combined with `--passes`. A film with `optics` keeps its camera response, and its haze adds its own opacity to the layer.

`--passes depth,mask` also draws those guide passes at every frame through the film's camera and writes them, never encoded, into `controls/` beside the film, with `record.json` naming each pass's convention and every frame file's SHA-256. It takes the guide passes other than `beauty`, each once. A blocked or failed render keeps the previous film and `controls/`, so use them only under the [render report check]({{skills}}/production/media-records.md#render-reports).

## Production diagnostics

Every host inspects the placed film through `src/inspectFilmProduction.ts`: the inspector on each painted picture, the capture on each drawn still and the render on every delivered frame. It judges the evaluated pose whoever produced it, a native action, raw authored keyframes or a physical performance, so one fault is reported the same way from each. Extend it per film through `IFilmProduction.inspectionLayers`, `inspectionChecks`, `inspectionCamera` and `inspectPlaced`.

Declare contact and continuity expectations by returning `selectAutoMoviePlacedChecks({ scene: sample.scene, time: sample.time, fps, supports, grips, custody, continuity })` from `@automovie/render` in `inspectionChecks(sample)`.

- **Supports** are half-open film-second phases `[from, to)`, each with the displayed socket, the support node and a support-local anchor. A moving deck carries its anchor. Consecutive phases express a foot roll or a transfer, and the incoming phase owns the boundary second.
- **Grips** are windows naming the hand, the prop and the expected hand-local frame.
- **Custody** lists the holder nodes and a schedule of `{ from, holder }`. The actual holder is read from the scene graph, so parent the prop to the receiving hand on the handoff frame.
- **Continuity** takes the film's admitted cut (`cutSequence`), its `sequenceTimeline` layout and deliberate breaks `{ shot, seconds }`. Each track's `observe(shot, shotSeconds)` returns the authored world transform as `{ kind: "present" }` or `{ kind: "missing" }`, or `null` when the shot does not involve the entity, with `maxSpeed` and `maxAngularSpeed` per shot-local second. Cuts, transitions and declared breaks are excluded. A resuming seam and retimes are checked on shot time.

Nothing reads proximity, contact receipts or physics to choose a support, grip or holder.

A film that performs Humans through `@automovie/motions` also returns `{ performance, paths }` from `IFilmProduction.humanPerformance`, where `paths` maps each performer's subject to its entity path. The capture and the render then add the `HumanVerdicts` report of the whole performance to every sample: one `human-<bound>` finding per performer, or per pair for `partner`, with its worst reading, limit, unit and `seconds`, and one coverage row per bound, `excluded` for the nine floor and support bounds of a performer who swims or climbs a ladder. The report costs seconds to minutes, so it is read once per run and the interactive viewer never asks for it. A confirmed bound violation is an error, so it blocks delivery: repair the motion until `HumanVerdicts.describe(report)` reads `clean` rather than leaving the member out.

The inspector checks each picture under a work budget sized to fit the checks into a 60 Hz frame, and marks a check that would exceed it as `deferred`. Large formations or dense touching surfaces can exceed it. Capture and delivery both complete the checks the interactive preview deferred.

A finding has a stable check, key, code and entity paths, a confidence, and a witness with its film seconds and, on the delivery grid, its output frame. Each check also reports its coverage: `checked`, `excluded` with a reason, or `deferred` or `unsupported` with a reason.

- **Inspector.** A confirmed error draws a red cube at its witness under the `beauty` shade, a possible one an amber cube, and goes to the console once per incident: at its first visit and when its span closes. A span over consecutive frames is frame-exact. A span over uninterrupted playback names only the painted samples, and the film between them is unchecked, so step the frames before trusting its extent. The Diagnostics section lists the incidents. Its buttons pause, move to the first or worst witness and label the finding's drawn entities, so the address and the capture command reproduce it. Unticking "show witnesses" hides the cubes and the status line only. The status line names checks the preview deferred.
- **Capture.** `record.json` holds the episodes and coverage of the drawn stills.
- **Render.** `render-report.json` holds the episodes and coverage of every frame. The render also decodes `film.mp4` and compares its black, frozen and silent intervals with the drawn frames and the padded soundtrack it encoded. An interval the encode introduced blocks publication. One the film itself drew blocks only when the film declares `delivery` intent and none of its `allowances` covers it. A decoded soundtrack outside its loudness targets, a file off its declared picture or AAC profile, and a phoneme-driven line whose sound lands outside -45 to +125 ms of its mouth also block publication. A confirmed error, or a required check still deferred or unsupported, blocks publication: the command exits non-zero naming the first cursor, keeps the report and leaves the previous `film.mp4` in place.

Repair a blocking finding at the source that placed it, then render again.

With `pnpm run dev` running, `pnpm run review --url <inspector-address> --seconds <s>` runs `automovie review`: it presses the inspector's Play button and records real-time playback as a video, with the time readout it showed and the page's errors, into `media/automovie/review/` or `--out <dir>`, for the user to watch. `pnpm run review:setup` installs its recording FFmpeg and headless Chromium.

## Physical performance

[Physical feedback]({{skills}}/motion/physical-feedback.md) defines when to simulate. Read the installed Engine's README and types for its simulation and playback APIs.

`pnpm run physics <input-module.ts> <output.amphys> [maximum-bytes]` computes a simulated performance once from a Node module exporting `createPhysicalInput()` and writes the archive with its JSON manifest, 256 MiB at most by default. Keep the archive as a [stage cache]({{skills}}/production/stage-caches.md) under `.cache/` and regenerate it after changing physical inputs; playback, seeking and capture read it through the Engine's physical playback, which checks it against the current input's identity.

Supply `IFilmProduction.performance` from the displayed state: `src/markFilmProduction.ts` hands it to the inspection in every host, and `marks=joint,bone,contact` draws its skeleton and contact forces. Each contact draws the force each touching body receives, from the solver's world contact point, for the step's mean force; with `ownership: () => playback.ownership`, a dynamic body that received none of a solved force, as an exaggerated mode can round it away, is flagged, while static and kinematic sides never are. An impact can be tens of times a body's weight; set `maximumArrowLength` to keep it in frame, and a longer contact arrow is drawn at that length as `contact/clamped`, labelled with the clamp and the least force it stands for. Supply `supports` from the same playback, `{ wrenches: playback.supportWrenches, interval: 1 / playback.rate }`, and `marks=support/*` draws the support force the controller allocated from each body's centre of mass, with any shortfall from its request flagged at the arrow's tip. Support arrows are motor demand before integration; only contact arrows show transferred force. Marks are opt-in, so delivered frames are unchanged. The starter's empty scene supplies none.

### Save and branch a Human take

Register a take in a project-relative TypeScript module that exports `createMotionTakeSource()`. Return the [source inputs](src/executable/motionTake/IMotionTakeSource.ts), including the normal edit plan and built shots, the Human owner input for the selected shot, and any data files read outside the module graph. Register each callback used by the owner under a stable ID and version with its rebuilt function value. Keep referenced source and data files available when moving the project.

Run these commands from the production directory after choosing unused artifact paths with an existing parent directory.

```sh
pnpm run motion:take save src/takes/rehearsal.ts rehearsal.take.json 0.55
pnpm run motion:take open src/takes/rehearsal.ts rehearsal.take.json
pnpm run motion:take branch src/takes/alternate.ts alternate.take.json
pnpm run motion:take open src/takes/alternate.ts alternate.take.json
```

Save time is in edited-sequence seconds. The artifact carries the exact source-shot second, zero-based edit entry and seam side. Give an explicit entry after the seconds during a transition overlap. At a hard cut the default `after` selects the incoming occurrence. Use `before` after the outgoing entry number to save its exact endpoint. The Human owner uses its normal exact-time evaluation at that source instant.

Open verifies source bytes, data dependencies, provider versions, seeds and placement before returning the saved instant's poses. [The Node API](src/executable/motionTake/openMotionTake.ts) also returns a prepared performance for repeated exact source-time reads. Keep both the prepared replay and the film's editorial mapping for the duration of a preview or render. Start a fresh process after changing source modules or installed packages. Register any runtime-loaded code or data the static import graph cannot discover as project-relative dependencies.

For an alternate, register a separate take and a `branch` with the saved original's artifact and trusted source module, a count of leading outer sequence groups to retain and the new suffix composition. The save point can lie within a group. The supported join is the start of a replaceable later group. The owner preserves the active group through that join and checks the shared prefix. The original source and artifact remain available to reopen both alternatives. Edit placement and event ownership must agree through the join.

To draw an admitted take in the browser, use a trusted project subject module that admits the artifact props with `admitMotionTake` and calls [the replay adapter](src/executable/motionTake/replayMotionTake.ts) with its explicitly imported source recipe and, for a branch, the original recipe. Use the returned `performanceAt(sourceSeconds, entry)` in the draw scene's seek, with the film's normal mapping from edited to source time. Passing the entry keeps occurrences before the save's selected entry on the original take. Run `motion:take open` to verify current files, then capture or render the same verified artifact and source in a separate output directory for each alternative.

```sh
pnpm exec automovie capture --module src/takeSubjects.ts --props rehearsal.take.json --subject rehearsal --from 0.5 --to 0.75 --out media/capture/rehearsal
```

Version 1 reconstructs authored Human performance, including its supported prop, articulation, contact and event evaluation. It refuses opaque owner callbacks or missing inputs. Native solver snapshot restore and partial raster export resume use separate workflows.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm exec ttsc --watch`, run in `test/` | The single compile checker, kept running while you edit; read compile errors from its output |
| `pnpm run lint` | TypeScript and source correctness |
| `pnpm run evidence` | Source and test checklists and the selected path's active evidence obligations |
| `pnpm test` | The exported `test_*` functions under `test/features`; an empty selection fails |
| `pnpm run format` | Source formatting |
| `pnpm run dev` | The inspector page on `127.0.0.1:5173` |
| `pnpm run build` | Bundle the inspector page |
| `pnpm run physics <input-module.ts> <output.amphys> [maximum-bytes]` | Precompute an adopted physical performance outside the browser |
| `pnpm run motion:take save`, `open` or `branch` | Persist, verify or branch a registered Human take |
| `pnpm run render --subject <film>` | Export one film as a video, with its soundtrack when it has one |
| `pnpm run review --url <address> --seconds <s>` | Record real-time playback of the running inspector page |
| `pnpm run capture --subject <film> [request]` | Stills, sheets and a record of a film, with views, passes, marks and round comparison |
| `pnpm exec automovie capture --file <video> [request]` | Stills of an encoded file's own frames, around its cuts |

The project uses ES modules with `verbatimModuleSyntax` and `isolatedModules`: mark type-only imports and exports with `type`, and keep each file transformable on its own.

## Tests

`test/index.ts` discovers pure logic unit tests in `test/features/<source path>/test_<name>.ts` through `test/tsconfig.json`. Export a named `test_<name>(): void` or `Promise<void>` function and assert behavior with `node:assert/strict` or `TestValidator` from `@nestia/e2e`. Select test filenames with `pnpm test --include <substring> --exclude <substring>`; repeated options accumulate. Tests call portable logic directly; the inspector page and media inspection run separately.

## Project files

| Path, when used | Holds |
| --- | --- |
| `.agents/skills`, at this project's root or its workspace root | The task entry points `AGENTS.md` lists, their resources and the contracts |
| `PROJECT.md` | The current scope, choices and constraints [project context]({{skills}}/production/project-context.md) defines |
| `index.html`, `src/main.ts`, `vite.config.ts` | The inspector page, its one-call mount of `@automovie/viewer` and the Vite configuration of both pages |
| `evidence.config.ts` | The duties selected through installed `@automovie/evidence`, which `pnpm run evidence` evaluates as the selected native graph |
| `lint.config.ts` | Generic source lint |
| `tsconfig.json` | Compiler settings |
| `test/tsconfig.json` | The scope of pure TypeScript unit tests |
| `package.json` | Dependencies and commands |

[Document layout]({{skills}}/story/document-layout.md), [source layout]({{skills}}/development/source-layout.md) and [media records]({{skills}}/production/media-records.md) own every other location, such as `docs`, `references`, `src`, `test`, `public`, `.env` and `media`, and source layout also owns the dependency direction between source folders.
