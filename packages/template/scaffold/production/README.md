# {{name}}

Use an LLM to author a complete movie screenplay, then program the main scenes' motion, staging and camera and assemble the whole video as a reproducible motion hint. Every person is a polygon man, drawn from the body the installed Human package prepares, and every other subject is the simplest form that identifies it, as [entity work]({{skills}}/development/entities.md#coarse-first) sets; the accuracy goes to motion.

## First run

Use Node.js 22.23.2 or later. A production inside an AutoMovie workspace installs once with `pnpm install` at the workspace root instead, then runs the same scripts here.

```bash
pnpm install
pnpm run lint
pnpm run evidence
pnpm test
```

The project includes instructions, contracts and a working empty inspector page with exact-time video export; the empty scene and checks do not complete a production. Start with [production]({{skills}}/production/SKILL.md) for the requested output and [story]({{skills}}/story/SKILL.md) for creative work.

Default lint and evidence check ordinary TypeScript source and tests; [evidence configuration]({{skills}}/evidence/configuration.md) adds narrative scope and stages to that same configuration.

## Inspector and export

Each delivered video is one film in `src/composition/films/`, registered in `src/composition/films/index.ts` under its [film name]({{skills}}/development/source-layout.md#source), derived from its film folder's path, with its running time, frame rate and optional `width` × `height` delivery raster (1280 × 720 by default; 720 × 1280 for a vertical short). Each film composes its own scenes; the starter film `src/composition/films/starter.ts` holds an empty one.

Run `pnpm run dev`, then open [the inspector](http://127.0.0.1:5173/). It shows the films of `src/subjects.ts`, the same subjects `pnpm run capture` draws, through one request in the capture's grammar. Its panels edit the request, its address carries it, such as [the starter at 2 seconds through the front view](http://127.0.0.1:5173/?subject=starter&at=2&views=front), and it shows the `automovie capture` command whose options, given to `pnpm run capture`, repeat the picture. A request the capture refuses is refused on the page too, with the reason. Play, pause and seek use the same deterministic performance as export.

`pnpm run render --subject <film>` runs `automovie render --module src/subjects.ts`, omitting `--subject` while only one film exists. It draws every frame in the browser `pnpm run review:setup` installs, through the same draw function `pnpm run capture` uses, and encodes them once, picture only; no server needs to be running. `CHROME_PATH` selects another browser and `FFMPEG_PATH` another FFmpeg.

It writes `media/automovie/<film>/videos/film.mp4`, or into `--out <dir>`, with `render-report.json` beside it, so each film's renders stay apart. Export requires a whole number of frames. The report's hashes describe the drawn frames; judge the film under [delivery review]({{skills}}/review/delivery-review.md).

## Stills

`pnpm run capture --subject <film> [request]` runs `automovie capture --module src/subjects.ts`: it draws each planned still of the film through the same draw function as the delivery render and writes the stills, contact sheets and a record into `media/capture/<film>/`, as the [render README](https://github.com/samchon/automovie/tree/master/packages/render#capture) describes; the command exits non-zero when a cell could not be drawn. Run `pnpm run review:setup` once to install the browser.

The request is the same grammar as the inspector's address, each key written with `--` before it; the [render README](https://github.com/samchon/automovie/tree/master/packages/render#request-keys) lists every key with what it asks for and the requirement it serves, marks, rounds and comparisons included. `--file <video>` captures an encoded file's own frames around its cuts instead of a film.

```bash
pnpm run capture --subject catalog --from 12 --to 14 --events 13.1 --views "right;three-quarter@ortho"
pnpm run capture --file media/automovie/<film>/videos/film.mp4 --from 60 --to 70
```

## Physical performance review

[Physical feedback]({{skills}}/motion/physical-feedback.md) chooses each scene's physical mode; the installed Engine's README and public declarations own its profiles, simulation, checkpoints, archives and audits.

`pnpm run physics <input-module.ts> <output.amphys> [maximum-bytes]` computes a simulated performance once from a Node module exporting `createPhysicalInput()` and writes the archive with its JSON manifest, limited to 256 MiB by default. Keep the archive as a [stage cache]({{skills}}/production/stage-caches.md) under `.cache/` and regenerate it after changing physical inputs; playback, seeking and capture read it through the installed Engine's physical playback, which checks it against the current input's identity.

Supply `IFilmProduction.performance` from the displayed state; `src/markFilmProduction.ts` hands it to the inspection in every host, and `marks=joint,bone,contact` draws its skeleton and contact forces. The starter's empty scene supplies none.

Run `pnpm run review:setup` once to install Playwright's recording FFmpeg and its headless Chromium. With `pnpm run dev` running, `pnpm run review --url <inspector-address> --seconds <s>` runs `automovie review`: it presses the inspector's Play button and records real-time playback as a video, with the time readout it showed and the page's errors, into `media/automovie/review/`, or `--out <dir>`, for the user to watch.

## Make a motion hint

A motion hint is made in these steps:

1. Adopt the request in [PROJECT.md](PROJECT.md).

   Record there, under [project context]({{skills}}/production/project-context.md), its output boundary and the intended execution and capture path.

2. Write the screenplay.

   Write it as the user's [choice of writer]({{skills}}/story/workflow/SKILL.md#who-writes-the-screenplay) sets. When the agent writes the story, first [ask the user]({{skills}}/story/planning/requirements.md#asking-the-user) about it. When the choice runs the narrative passes, write the [settings]({{skills}}/story/layers/settings.md), or a short's [brief]({{skills}}/story/layers/brief.md), then the complete [screenplay]({{skills}}/story/SKILL.md) along its [writing route]({{skills}}/story/workflow/SKILL.md), which also sets when evidence and independent review run; a short drafts its entities, scenes and film before evidence and review, as its route's film draft step sets.

3. Build and accept the coarse entities.

   Build them under [entity work]({{skills}}/development/entities.md) and accept every module in its [catalog cases]({{skills}}/motion/catalog-cases.md). Take the objects people use from the installed archetypes and compose what people do from the installed motion vocabulary. Write laws, interactions and consequences, with their tests, only for what the packages lack.

4. Compose every required main scene from the accepted modules.

   Compose them under [motion]({{skills}}/motion/SKILL.md) and [staging for the camera]({{skills}}/motion/staging.md), in the folders [source layout]({{skills}}/development/source-layout.md) gives. [Audio]({{skills}}/audio/SKILL.md) describes each shot's sound for the video-diffusion prompt.

5. Prepare the motion hint and its control channels.

   Prepare them under [control channels]({{skills}}/motion/control-channels.md) from the same actual performance, keeping the frame/camera mapping aligned for time-matched channels. Use the supplied inspector page and the capture and render commands, or document the production's adopted replacement here.

6. Assemble, encode and inspect the complete work.

   Assemble and encode it through [assembly]({{skills}}/production/assembly.md), then inspect the actual output through [delivery review]({{skills}}/review/delivery-review.md). Hand off the fixed inputs, source, commands, observed result and remaining limits.

Other outputs complete as [commissioned outputs]({{skills}}/production/SKILL.md#commissioned-outputs) set; their boundaries stay in PROJECT.md.

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
| `PROJECT.md` | The current scope, choices and constraints [project context]({{skills}}/production/project-context.md) defines |
| `index.html`, `src/main.ts`, `vite.config.ts` | The inspector page, its one-call mount of `@automovie/viewer` and the Vite configuration of both pages |
| `evidence.config.ts` | The duties selected through installed `@automovie/evidence`, which `pnpm run evidence` evaluates as the selected native graph |
| `lint.config.ts` | Generic source lint |
| `tsconfig.json` | Compiler settings |
| `tsconfig.test.json` | The scope of pure TypeScript unit tests |
| `package.json` | Dependencies and commands |

[Document layout]({{skills}}/story/document-layout.md), [source layout]({{skills}}/development/source-layout.md) and [media records]({{skills}}/production/media-records.md) own every other location, such as `docs`, `references`, `src`, `test`, `public`, `.env` and `media`, and the source layout also owns the dependency direction between source folders.