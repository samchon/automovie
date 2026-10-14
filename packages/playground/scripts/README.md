# Regenerating model and demonstration outputs

The model and demonstration outputs listed here are ignored derivatives of Playground's TypeScript models and view pages. These scripts regenerate their own outputs. The repository's `.shots` also holds required Human inputs, reference photographs and resident viewer runtime files; the [Human skill's visual debugging files](../../../.agents/skills/human/SKILL.md#visual-debugging-files) define their preservation boundary.

All commands run from `packages/playground` or through `pnpm --filter @automovie/playground <script>`.

## Type-check boundary

[`tsconfig.json`](../tsconfig.json) checks browser `src`, Node/DOM entries under `scripts/*.ts`, and their shared support. The package's `build` runs that check, then checks the separate [`src/human/inspection/tsconfig.json`](../src/human/inspection/tsconfig.json) program, then runs Vite for the editor pages. Workspace API drift in maintained scripts therefore fails the normal package and repository build.

## Models (`.glb`)

Each character is exported straight from its `build*` AST through
`@automovie/render/node`'s `exportModelToGLB`:

```bash
pnpm build:models      # stickman, cat, horse, knight (all of the below)
# or individually:
pnpm build:stickman    # → .shots/human/stickman.glb
pnpm build:cat         # → .shots/cat/cat.glb
pnpm build:horse       # → .shots/knight/horse.glb
pnpm build:knight      # → .shots/knight/knight.glb
```

No browser needed: these run headless in Node.

## Demo clips (`.mp4`)

The clip script uses one persistent headless Chromium process and opens one page per selected clip, loading that clip's route once. Clips that share an HTML entry still acquire separate pages. The page's `window.__afSeek(t)` hook steps and draws each sample, then the canvas screenshot is decoded and supplied to the in-process H.264 encoder. Capture work grows with frame count, pixel dimensions and the host's drawing/encoding costs; deterministic engine sampling alone does not establish identical GPU pixels across hosts.

Needs:

1. **The dev server running** (separate terminal): `pnpm dev` (serves
   `http://localhost:5173`).
2. **Google Chrome** installed (driven via `executablePath`).

Then:

```bash
pnpm shots             # capture every clip in the manifest
pnpm shots shadowbox   # only shots whose output path matches "shadowbox"
```

Overrides via env: `CHROME=/path/to/chrome` (binary), `BASE=http://host:port`
(server). The shot list lives at the top of `capture-shots.ts`. Add a row
`[page, query, durationSeconds, frameCount, width, height, outPath, fps]` to
capture a new clip. Encoding uses `h264-mp4-encoder` (wasm) + `pngjs`.

## Capture smoke (`smoke:capture`, #1170)

Chrome renders the served stickman page and the existing adapter captures beauty, mask and pose in two sessions. The script compares their bytes on that host, checks the declared mask/pose color-population thresholds and requires beauty to differ from mask. These checks do not prove anatomical or visual quality or cross-host GPU equivalence. It reuses a responding server at `--base` (default `http://127.0.0.1:5173`) or acquires and terminates its own Vite process. Google Chrome is required (`--chrome` or `CHROME` selects its executable); a failed check exits nonzero.

```bash
pnpm smoke:capture
```

## Render-and-see artifact (`.mp4` + `.json` + frames)

`render:see` is the render seam smoke path: it drives one playground route
through `@automovie/render`'s `createHeadlessCaptureAdapter` and `renderAndSee`,
then writes PNG frames, an MP4, and a JSON artifact describing frame paths,
sample times, Render's planned argument vector, route, and encoder.

The existing encoder sets width, height, frame rate and HME quantization parameter 20. The recorded Render spec and argument vector are planning metadata; they do not equate that parameter with ffmpeg CRF or independently observe encoded chroma and page tone mapping. Encoding uses the headless adapter's returned primary image: beauty when included, otherwise the first requested guide.

```bash
pnpm render:see
pnpm render:see -- --page stickman.html --query "char=human&clip=walk&az=80"
```

The same `CHROME` and `BASE` environment overrides apply. The default `BASE` is
`http://127.0.0.1:5173`. Defaults write under `.shots/_render-see/` and capture
the human walk route from `stickman.html`.

`render:sequence` does the same for the `film.html` sequence path. The page
exposes its committed `sequence` and `shots`, the script builds a
`planSequenceRender` manifest, then captures each manifest frame through the
page's sequence-frame hook. The JSON artifact includes the sequence timeline,
frame paths, encoded MP4 path, and a pixel probe for sampled dissolve frames.

```bash
pnpm render:sequence
pnpm render:sequence -- --fps 12 --out .shots/_render-see/film-sequence.mp4
```

## Observing the connected person editor

`observe:person` drives the real `connected-person.html` page through a list of user actions and records status/state, disabled buttons, document textarea text and its unapplied indicator, displayed admission JSON, saved downloads with SHA-256 and step elapsed time. The textarea may contain unapplied edits, and the renderer string comes from a separate WebGL2 context in that page; neither establishes current application-model provenance. It asserts nothing; a person reads the record. Serve the page first and set `CHROME` to the Chromium executable to use.

```bash
pnpm observe:person -- record.json base=http://127.0.0.1:4173 load=person.json set=face/shape/noseWidth:0.3 click=undo click=glb
```

The header of `scripts/observe-connected-person.ts` lists every step and option, including `head=` and `body=` for a caller-owned typed source pair.
