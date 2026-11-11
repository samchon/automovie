# @automovie/render

Plans how AutoMovie output becomes frames and a video file: frame schedules and file names, sequence timelines with trims and transitions, encoder arguments, captions, and a render-budget check a job runs before it draws. The plans are deterministic. Pixels and encoded bytes depend on the capture and encoding you supply.

The package launches nothing itself, which keeps it usable in a browser. You pass it adapters that capture a frame and run the encoder.

It also owns everything that turns a film into pixels without user interaction: building Three.js objects from `@automovie/interface` models and scenes, applying poses, expressions and motion at a time, the guide and render passes, compositing, shadows, textures and resource lifetime, the polygon-man figure builders, the inspection core, and the picture utilities (sheets, comparison, label stamps, PNG codec) that work on pixels from any source. Interactive display, the canvas mount, playback loop and transport controls, stays in `@automovie/viewer`.

## Use

```bash
npm install @automovie/render @automovie/interface
```

```ts
import type { IAutoMovieRenderSpec } from "@automovie/interface";
import { type IAutoMovieRenderAdapters, frameTimes, renderVideo } from "@automovie/render";

frameTimes(30, 2); // 60 instants: 0, 1/30, 2/30, ...

declare const spec: IAutoMovieRenderSpec;
declare const adapters: IAutoMovieRenderAdapters;

const result = await renderVideo(spec, 2, "frames", "out.mp4", adapters);
```

You write the two adapters, or use the `automovie` command (see [Node tooling](#node-tooling)). `captureFrame(timeSeconds, index, dir)` draws the scene at that instant, writes the frame into `dir` and returns its path, and `encode(args, outputPath)` runs FFmpeg with the given arguments. Every instant is `index / fps`, never a running sum, so a schedule is identical on every machine.

## Entry points

- `frameTimes`, `ffmpegArgs` and `planSequenceRender` produce plans without doing any I/O.
- `renderVideo` renders one clip and `renderSequenceVideo` an edited sequence, both through your adapters.
- `assessAutoMovieRenderBudget` refuses a job whose memory it cannot bound.
- `planCaptionSidecar` and the delivery profiles cover captions and the delivered video's format.
- `AUTOMOVIE_GUIDE_PASSES` names the passes a motion hint is captured in, `beauty`, `depth`, `mask`, `normal`, `outline` and `pose`, and `planGuidePassOutputs` plans each pass's frame paths; `planPoseKeypointSidecar` and `renderPoseKeypointSidecar` write the pose keypoints beside them.

## Inspection

`applyAutoMovieInspection` turns a built scene into one inspection picture, in place, and returns a handle whose `restore` puts the scene back. `parseAutoMovieInspectionRequest` reads the request from named text values, so a page address and a command line share one grammar, and `formatAutoMovieInspectionRequest` writes it back. [Request keys](#request-keys) lists every key with the requirement it serves.

A mark is plain data, `IAutoMovieMark` from `@automovie/engine`: a path, a kind with its legend label and colour, one of four shapes (points, a polyline, segments, arrows), a flag for an anomaly, and the scene object it follows. Any owner hands its located findings to the inspection as marks, such as construction curves through `markAutoMovieConstructionCurves`; the inspection measures mesh defects itself. Two kinds never share a colour in one picture, a flagged mark takes the flag colour, and the handle's `legend` counts the marks of each kind.

```ts
import { applyAutoMovieInspection, parseAutoMovieInspectionRequest } from "@automovie/render";

const request = parseAutoMovieInspectionRequest((key) => url.searchParams.get(key));
const inspection = applyAutoMovieInspection({ scene, request, marks: production.marks?.(seconds) });
try {
  production.seek(seconds);
  inspection.update(production.marks?.(seconds)); // after every seek, before drawing
  renderer.render(scene, camera);
} finally {
  inspection.restore();
}
```

Marks are drawn as three.js screen-space lines and points, so a stroke has the requested width in output pixels. A mark's path extends its object's, so `parts=hero/torso/section/3` draws one curve. A pattern that selects nothing throws instead of drawing an empty picture, and the handle's `selected` lists what the request selected.

A view is text that `parseAutoMovieInspectionView` reads and `resolveAutoMovieInspectionView` turns into a camera and the record of it: `film`, a fixed `x,y,z:tx,ty,tz`, a subject's own view, or a named viewpoint such as `front` fitted to what is drawn, with `@ortho` for a scale-true orthographic camera, `@focus=<pattern>` to frame a part and `@flagged` to frame what a measurement flagged. It serves naming views that repeat and framing a close-up on the affected region (capture, Views).

Motion is read from stills through marks a subject hands over for each drawn second, passed to the handle's `update`. The engine turns its measurements into marks for any articulated body: `markAutoMovieSkeleton` (bones and joints), `markAutoMovieContacts` (contact forces as arrows), `markAutoMovieBalance` (centre of mass against the base of support), `markAutoMovieRomOvershoot` and `markAutoMovieSlip` (flagged where a joint or a planted contact breaks its bound) and `markAutoMovieMeshClearance` (clearance witnesses). `sampleAutoMovieInspectionTrails` samples where the objects a pattern selects travel over a window of seconds, and `markAutoMovieInspectionTrails` draws that path with a tick per sample and the drawn second emphasised; a host draws the request's `trail` at the times `planAutoMovieInspectionTrailTimes` gives. They serve effector paths, contacts, balance, slip and range overshoot read from stills (motion verification; passes, an overlay of joints, contacts, targets and paths).

`expandAutoMovieInspectionSweep` expands a sweep pattern into units, each alone and with the neighbours whose boxes lie within a margin, which `measureAutoMovieInspectionPaths` measures on any scene; it serves the whole, each unit alone and each unit with its neighbours (capture, Subject).

## Node tooling

The ready-made host is the `automovie` command. `automovie render` draws every frame of a subject through the draw page's function with `renderAutoMovieDrawnVideo` and encodes them once on the vector `planAutoMovieVideoEncoding` admits; `automovie review` records real-time playback of the running inspector page. `npm run render` and `npm run review` in a production run them.

A finished render says only that capture and encoding ran, so watch and listen to the video before accepting it.

## Capture

A capture is the stills, contact sheets and record of one planned request, as the [visual-debugging capture guide](../../.agents/skills/visual-debugging/capture.md) defines it. `render` plans and writes it and launches nothing: the host injects a draw function that draws one cell, a storage with the shape of `node:fs/promises`, and its source revision.

```ts
import * as fs from "node:fs/promises";
import {
  AutoMovieCaptureFolder,
  type IAutoMovieCaptureCell,
  type IAutoMovieCaptureDrawing,
  type IAutoMovieCaptureSubject,
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
  readAutoMovieCaptureArguments,
  runAutoMovieCapture,
} from "@automovie/render";

declare const subject: IAutoMovieCaptureSubject; // what the host learned from the page
declare function draw(cell: IAutoMovieCaptureCell): Promise<IAutoMovieCaptureDrawing>;
declare const root: string, revision: string;

const request = parseAutoMovieCapturePlanRequest(readAutoMovieCaptureArguments(process.argv.slice(2)));
const plan = planAutoMovieCapture({ request, subject, cuts: [] });
const folder = await AutoMovieCaptureFolder.open({ storage: fs, root, round: request.round, compare: request.compare });
const record = await runAutoMovieCapture({ plan, draw, folder, revision, match: "cell" });
```

A page passes its address's `searchParams` to the same reader, so one request text gives one picture in every host, and `formatAutoMovieCapturePlanRequest` writes a request back as the values that repeat it. `planAutoMovieCapture` refuses a view, time, mark kind or sweep the subject cannot give before anything is drawn. [Request keys](#request-keys) lists the capture's own keys beside the inspection keys.

A capture writes `<cell>.png` stills, `sheet-001.png` onwards and `record.json` into its root, or into `rounds/<round>` beneath it, and refuses a folder holding a file no record of its own lists. The record keeps the revision, the request as text, the budget, one row per planned cell with its hash, backend and resolved camera or the cause it was not drawn, and the comparison's pairs and unmatched cells.

### The draw-only page

Every picture a host saves comes from one function that runs in the browser. A page with no interface calls `installAutoMovieDraw(subjects)`, where `subjects` maps the props a host injected before the page loaded to the subjects the page offers, each an `IAutoMovieDrawSubject` whose `create()` returns the scene, the delivery camera, the clock, the raster, `seek`, the subject's views and its marks per second. `AutoMovieDrawSession` drives that page from a host through any driver shaped like Playwright's page: `describe` gives the `IAutoMovieCaptureSubject` to plan against, `drawing(cell, plan)` is the capture run's draw function, and `frame(seconds, passes)` draws one delivered frame per pass. Each draw applies the cell's inspection, frames a fitted view over every planned second, seeks and waits for the subject to report ready, draws through the resolved camera on the renderer's own canvas (the `beauty` pass at twice each side, averaged down), and returns the pixels with the label anchors and the resolved camera; the record's backend names the browser's backend, its Chromium version and the WebGL renderer string. The `automovie capture` and `automovie render` commands of the `automovie` package are its Node hosts: they generate this page over a subject module named by `--module`, so a production or a package keeps only the module that exports `subjects`, never a page of its own.

`runAutoMovieVideoCapture` samples an encoded or generated video file from the file itself. It plans FFmpeg runs, `scdet` to find the cuts and one frame-exact `select` with `-fps_mode passthrough`, and hands them to a host's process runner, so the stills are the file's own frames around every cut and event, captioned by frame and second. Compared against the source's round, its cells pair by second; pixels are compared only between stills of one backend, and a second the file lacks stays as an unmatched cell with its cause.

## Request keys

Each key a request reader accepts, and each option the `automovie capture`, `inspect`, `render` and `review` commands of the `automovie` package take for themselves, serves a requirement of the [visual-debugging](../../.agents/skills/visual-debugging/SKILL.md), [3d-modeling](../../.agents/skills/3d-modeling/inspection.md) or [motion](../../.agents/skills/motion/verification.md) skill. A page's address and the command line carry the same keys; the command line writes each as `--<key>`, and the options written below with their dashes belong to the commands alone.

| Key | Asks for | Serves |
| --- | --- | --- |
| `parts`, `hide` | The objects and marks whose paths the patterns select | Selecting the whole, each unit and its neighbours (capture, Subject) |
| `shade`, `surface` | A guide pass, `clay` for form without colour or `faces` for the side each surface shows; surfaces off leave the marks alone | Choosing a pass by the question (passes) |
| `marks`, `sliver` | The marks whose kinds the patterns select, `edge` for triangle sides over or without the surface | Marking what a measurement found (passes), the construction over the surface and the surface alone (inspection, Construction) |
| `section` | A world-space cut | Cutaways as an inspection control |
| `xray`, `stroke` | Marks through surfaces, and their width in output pixels | Reading marks in a reduced still |
| `label` | The names of the matched objects and marks, placed by the handle's `labels` with overlapping ones dropped and reported | Showing labels to establish identity (passes) |
| `color` | `pattern=rrggbb` colours for matched objects and mark kinds in one picture | Each kind of thing in one colour throughout a capture (passes) |
| `trail`, `reach`, `ticks` | The travel of the matched objects, sampled `ticks` times a second for `reach` seconds either side of the drawn second, as the `trail` and `trail/now` kinds | An overlay of paths, so a still shows a movement (passes; motion verification) |
| `subject` | The subject the host loads | Capturing the actual consumer (capture, Conditions) |
| `from`, `to`, `rate`, `at` | An even sampling on the subject's frames, five per second by default, or exact seconds | Five to ten stills per second (capture, Times) |
| `events`, `window` | Every frame within `window` frames, three by default, of each instant | The output's own consecutive frames around a contact, cut or join (capture, Times) |
| `threshold` | The `scdet` score, 10 by default, at which a video file's frame starts a new scene, whose frames are planned like an event's | Consecutive frames around every cut (capture, Times) |
| `views` | View texts separated by `;`, `film` by default | Naming views that repeat (capture, Views) |
| `passes` | Several shades sharing each view's camera | Choosing passes by the question (passes) |
| `sweep`, `margin` | Each matched unit alone and with the neighbours within `margin` metres | Each unit alone and with its neighbours (capture, Subject) |
| `longest`, `smallest`, `reduction` | The reader budget, 1568 and 200 px by default, and `area` or `nearest` reduction into cells | Reading the sheet first, at a size the reader takes in (capture, Stills and sheets) |
| `round`, `compare`, `tolerance` | Keeping the capture as a named round, comparing it cell by cell with an earlier one, and the byte difference counted as unchanged | Rounds kept apart and compared (capture, Rounds; comparison) |
| `--module` | The subject module whose subjects the draw page, or with `inspect` the inspector page, offers; required unless `capture` is given `--file` | Capturing the actual consumer (capture, Conditions) |
| `--file` | An encoded or generated video file captured from its own frames instead of a drawn subject | Sampling an encoded file from the file itself (capture, Times) |
| `--out` | The capture's root folder, `media/capture/<subject>` by default; for `render` the video's folder, `media/automovie/<subject>/videos`, and for `review` the recording's, `media/automovie/review` | Keeping each round's capture apart (capture, Rounds) |
| `--backend` | `capture` and `render`: `software`, SwiftShader through ANGLE and the default, or `gpu` | The renderer as a condition every still records (capture, Conditions) |
| `--port` | `inspect`: the port the inspector page is served on, a free one by default; the printed address's query is the request | Restoring the instrument for a subject a package offers, and a view that repeats from its text (capture) |
| `--props` | `capture`, `inspect` and `render`: a JSON file the module's `subjects` is called with, for subjects built from data a host computes, `null` by default | Inspecting the actual consumer, such as a motion case (capture, Conditions) |
| `--url` | `review`: the running inspector page whose playback is recorded | Telling how a moving picture plays, which stills cannot show (capture, Times) |
| `--seconds` | `review`: wall-clock seconds of playback recorded after Play is pressed | Telling how a moving picture plays, which stills cannot show (capture, Times) |
