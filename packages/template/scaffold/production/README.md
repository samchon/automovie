# {{name}}

Use an LLM to author a complete movie screenplay, then program the main scenes' motion, staging and camera and assemble the whole video as a reproducible motion hint. Every person is a polygon man, drawn from the body the installed Human package prepares, and every other subject is the simplest form that identifies it, as [entity work]({{skills}}/development/entities.md#coarse-first) sets; the accuracy goes to motion. Stills and pilot clips alone do not complete a motion hint.

## First run

Use Node.js 22.23.2 or later. A production inside an AutoMovie workspace installs once with `pnpm install` at the workspace root instead, then runs the same scripts here.

```bash
pnpm install
pnpm run lint
pnpm run evidence
pnpm test
```

The project includes instructions, contracts and a working empty inspector page with exact-time video export. Start with [production]({{skills}}/production/SKILL.md) for the requested output and [story]({{skills}}/story/SKILL.md) for creative work. Default lint and evidence check ordinary TypeScript source and tests; [evidence configuration]({{skills}}/evidence/configuration.md) adds narrative scope and stages to that same configuration. The empty scene and checks do not complete a production.

## Inspector and export

Run `pnpm run dev`, then open [the inspector](http://127.0.0.1:5173/). It shows the films of `src/subjects.ts`, the same subjects `pnpm run capture` draws, through one request: every panel (time, selection, marks, shade, view and the request text) edits it, the address carries it with the capture's keys, and the page shows the `automovie capture` command whose options, given to `pnpm run capture`, repeat the picture. Play, pause and seek use the same deterministic performance as export. Each delivered video is one film in `src/composition/films/`, registered in `src/composition/films/index.ts` under its screenplay file's name, with its running time, frame rate and optional `width` × `height` delivery raster (1280 × 720 by default; 720 × 1280 for a vertical short); `?subject=<name>` selects one, and may be omitted while only one exists, and `at` the second shown, for example [the starter at 2 seconds through the front view](http://127.0.0.1:5173/?subject=starter&at=2&views=front). The starter film `src/composition/films/starter.ts` holds an empty scene; each film composes its scenes and sets its own running time.

`pnpm run render --subject <film>` runs `automovie render --module src/subjects.ts`, omitting `--subject` while only one film exists. It builds a draw-only page over `src/subjects.ts` with this production's Vite and draws every frame at `i / fps` through the same draw function `pnpm run capture` uses, with SwiftShader, the software WebGL backend, in the Chromium build Playwright pins (`pnpm run review:setup` installs it; `CHROME_PATH` selects another executable), then encodes them once with FFmpeg from `ffmpeg-static`, or `FFMPEG_PATH`. No server needs to be running.

It writes `media/automovie/<film>/videos/film.mp4`, or into `--out <dir>`, with `render-report.json` beside it, so each film's renders stay apart. Export requires a whole number of frames, followed by one picture-only encode. The report's hashes describe the drawn frames; judge the film on stills of the encoded file under [delivery review]({{skills}}/review/delivery-review.md), and ask the user to watch its playback before accepting it.

## Stills

`pnpm run capture --subject <film> [request]` runs `automovie capture --module src/subjects.ts`: it builds a draw-only page over `src/subjects.ts` with this production's Vite, draws each planned still of the film in headless Chromium with SwiftShader through the same draw function the delivery render uses, and writes the stills, contact sheets laid out for the reader and `record.json` into `media/capture/<film>/`. The record names the source revision, the request, each cell's resolved camera and the backend with the WebGL renderer and the Chromium version, and keeps every cell that could not be drawn with its cause; the command exits non-zero when one was not. Run `pnpm run review:setup` once to install the browser.

The request is the same grammar as the inspector's address, each key written with `--` before it; the [render README](https://github.com/samchon/automovie/tree/master/packages/render#request-keys) lists every key with what it asks for and the requirement it serves. `--marks` draws marks by kind from what the subject supplies, such as its construction curves (`curve`), the measured mesh `edge` and `defect` kinds, or a performance's `joint`, `bone` and `contact`. `--round <name>` keeps a capture under `rounds/<name>`, and `--compare <name>` adds comparison sheets that set each cell beside the same cell of that round and report every cell the two rounds could not pair. `--file <video>` captures an encoded file's own frames around its cuts instead of a film.

```bash
pnpm run capture --subject catalog --from 12 --to 14 --events 13.1 --views "right;three-quarter@ortho"
pnpm run capture --subject catalog --at 0 --parts teapot --views "front@ortho;top@ortho" --passes clay,faces --marks curve,defect
pnpm run capture --subject catalog --from 12 --to 14 --round before
pnpm run capture --subject catalog --from 12 --to 14 --compare before
pnpm run capture --file media/automovie/<film>/videos/film.mp4 --from 60 --to 70
```

## Physical performance review

[Physical feedback]({{skills}}/motion/physical-feedback.md) chooses each scene's physical mode; the installed Engine's README and public declarations own its profiles, simulation, checkpoints, archives and audits. Supply `IFilmProduction.performance` from the displayed state to draw its skeleton and contacts as marks; the starter's empty scene supplies none.

Run `pnpm run review:setup` once to install Playwright's recording FFmpeg and its headless Chromium. With `pnpm run dev` running, `pnpm run review --url <inspector-address> --seconds <s>` runs `automovie review`: it presses the inspector's Play button and records real-time playback as a video, with the time readout it showed and the page's errors, into `media/automovie/review/`, or `--out <dir>`, for the user to watch.

In the inspector, the capture's keys are the address's parameters of the same names, such as `?views=front@ortho&parts=teapot&shade=clay&marks=curve`; `marks=joint,bone,contact` draws the skeleton and contact forces of `IFilmProduction.performance`, which `src/markFilmProduction.ts` hands to the inspection in every host. A request the capture refuses is refused on the page too: the page opens on the empty request and shows the reason. Judge a correction at the same source revision, film seconds and camera.

`pnpm run physics <input-module.ts> <output.amphys> [maximum-bytes]` computes a simulated performance once from a Node module exporting `createPhysicalInput()` and writes the archive with its JSON manifest, limited to 256 MiB by default. Keep the archive as a [stage cache]({{skills}}/production/stage-caches.md) under `.cache/` and regenerate it after changing physical inputs; playback, seeking and capture read it through the installed Engine's physical playback, which checks it against the current input's identity.

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

   Keep the frame/camera mapping aligned for time-matched channels. Use the supplied inspector page and the capture and render commands, or document the production's adopted replacement here.

6. Assemble and encode the complete work through [assembly]({{skills}}/production/assembly.md), then inspect the actual output through [delivery review]({{skills}}/review/delivery-review.md).

   Hand off the fixed inputs, source, commands, observed result and remaining limits.

A separately commissioned screenplay ends with its text duties; a standalone asset needs no invented narrative. A whole motion hint needs no finished diffusion film. A requested direct 3D film finishes through its actual renderer, with sound only as [audio]({{skills}}/audio/SKILL.md) sets; [generated video]({{skills}}/video/generation.md) uses the model, requests and prompts [video]({{skills}}/video/SKILL.md) sets and accepted fixed takes before the final edit. Their delivery boundaries stay explicit in PROJECT.md.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm exec ttsc --watch`, run in `test/` | The single compile checker kept running while you edit; read compile errors from its output |
| `pnpm run lint` | TypeScript and source correctness |
| `pnpm run evidence` | Source/test checklists and the selected path's active evidence obligations |
| `pnpm test` | Run exported `test_*` functions under `test/features` through `tsconfig.test.json`; an empty selection fails |
| `pnpm run format` | Source formatting |
| `pnpm run dev` | The production's inspector page on `127.0.0.1:5173` |
| `pnpm run build` | Bundle the inspector page |
| `pnpm run physics <input-module.ts> <output.amphys> [maximum-bytes]` | Precompute an adopted physical performance outside the browser |
| `pnpm run render --subject <film>` | Export one film drawn through `automovie`'s draw-only page as a picture-only video |
| `pnpm run review --url <address> --seconds <s>` | Record real-time playback of the running inspector page |
| `pnpm run capture --subject <film> [request]` | Stills, sheets and a record of a film drawn through `automovie`'s draw-only page, with inspection views, passes, marks and round comparison |
| `pnpm run capture --file <video> [request]` | Stills of an encoded file's own frames, around its cuts |

The project uses ES modules with `verbatimModuleSyntax` and `isolatedModules`: mark type-only imports and exports with `type`, and keep each file transformable on its own.

`test/index.ts` discovers pure logic unit tests in `test/features/<source path>/test_<name>.ts` through `tsconfig.test.json`. Export a named `test_<name>(): void` or `Promise<void>` function and assert behavior with `node:assert/strict` or `TestValidator` from `@nestia/e2e`. Use `pnpm test --include <substring> --exclude <substring>` to select test filenames; repeated options accumulate. Tests call portable logic directly; the inspector page and media inspection run separately.

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
| `index.html`, `src/main.ts`, `vite.config.ts` | The inspector page, its one-call mount of `@automovie/viewer` and the Vite configuration of both pages |
| `public` | Small fixed browser inputs; audio and video belong in `media/` |
| Runtime README instructions and `.env.example` | Nonsecret setup and variable names; actual secrets stay in ignored local `.env` |
| `evidence.config.ts` | The duties selected through installed `@automovie/evidence`, which `pnpm run evidence` evaluates as the selected native graph |
| `lint.config.ts` | Generic source lint |
| `tsconfig.json` | Compiler settings |
| `tsconfig.test.json` | The scope of pure TypeScript unit tests |
| `package.json` | Dependencies and commands |

`AGENTS.md` groups creation, implementation/evidence, writing and assessment; `story` routes to its planning, layers, naturalness, correction and evidence parts.

[Document layout]({{skills}}/story/document-layout.md), [source layout]({{skills}}/development/source-layout.md) and [media records]({{skills}}/production/media-records.md) explain the owners of the `docs`, `src` and `media` locations. The dependency direction between source folders is the source layout's rule.

Installed package READMEs, public types and JSDoc own API behavior.