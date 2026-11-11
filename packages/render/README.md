# @automovie/render

Plans how AutoMovie output becomes frames and a video file: frame schedules and file names, sequence timelines with trims and transitions, encoder arguments, captions, and a render-budget check a job runs before it draws. The plans are deterministic. Pixels and encoded bytes depend on the capture and encoding you supply.

The package launches nothing itself, which keeps it usable in a browser. You pass it adapters that capture a frame and run the encoder.

It also owns everything that turns a film into pixels without user interaction: building Three.js objects from `@automovie/interface` models and scenes, applying poses, expressions and motion at a time, the guide and render passes, compositing, shadows, textures and resource lifetime, the polygon-man figure builders, the inspection core and the CPU rasterizer. Interactive display, the canvas mount, playback loop and transport controls, stays in `@automovie/viewer`.

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

You write the two adapters, or take them from a generated production (see [Node tooling](#node-tooling)). `captureFrame(timeSeconds, index, dir)` draws the scene at that instant, writes the frame into `dir` and returns its path, and `encode(args, outputPath)` runs FFmpeg with the given arguments. Every instant is `index / fps`, never a running sum, so a schedule is identical on every machine.

## Entry points

- `frameTimes`, `ffmpegArgs` and `planSequenceRender` produce plans without doing any I/O.
- `renderVideo` renders one clip and `renderSequenceVideo` an edited sequence, both through your adapters.
- `assessAutoMovieRenderBudget` refuses a job whose memory it cannot bound.
- `planCaptionSidecar` and the delivery profiles cover captions and the delivered video's format.
- `AUTOMOVIE_GUIDE_PASSES` names the passes a motion hint is captured in, `beauty`, `depth`, `mask`, `normal`, `outline` and `pose`, and `planGuidePassOutputs` plans each pass's frame paths; `planPoseKeypointSidecar` and `renderPoseKeypointSidecar` write the pose keypoints beside them.

## Node tooling

A ready-made host, a program that supplies both adapters, is in every generated production under `src/executable/render`: browser capture, FFmpeg export and MP4 handling. It belongs to the production, so read its source for those APIs. `npm run render` in a production runs it.

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

A page passes its address's `searchParams` to the same reader, so one request text gives one picture in every host, and `formatAutoMovieCapturePlanRequest` writes a request back as the values that repeat it. `planAutoMovieCapture` refuses a view, time, mark kind or sweep the subject cannot give before anything is drawn. The capture's own keys join the inspection keys above:

| Key | Asks for | Serves |
| --- | --- | --- |
| `subject` | The subject the host loads | Capturing the actual consumer (capture, Conditions) |
| `from`, `to`, `rate`, `at` | An even sampling on the subject's frames, five per second by default, or exact seconds | Five to ten stills per second (capture, Times) |
| `events`, `window` | Every frame within `window` frames, three by default, of each instant | The output's own consecutive frames around a contact, cut or join (capture, Times) |
| `threshold` | The `scdet` score, 10 by default, at which a video file's frame starts a new scene, whose frames are planned like an event's | Consecutive frames around every cut (capture, Times) |
| `views` | View texts separated by `;`, `film` by default | Naming views that repeat (capture, Views) |
| `passes` | Several shades sharing each view's camera | Choosing passes by the question (passes) |
| `sweep`, `margin` | Each matched unit alone and with the neighbours within `margin` metres | Each unit alone and with its neighbours (capture, Subject) |
| `longest`, `smallest`, `reduction` | The reader budget, 1568 and 200 px by default, and `area` or `nearest` reduction into cells | Reading the sheet first, at a size the reader takes in (capture, Stills and sheets) |
| `round`, `compare`, `tolerance` | Keeping the capture as a named round, comparing it cell by cell with an earlier one, and the byte difference counted as unchanged | Rounds kept apart and compared (capture, Rounds; comparison) |

A capture writes `<cell>.png` stills, `sheet-001.png` onwards and `record.json` into its root, or into `rounds/<round>` beneath it, and refuses a folder holding a file no record of its own lists. The record keeps the revision, the request as text, the budget, one row per planned cell with its hash, backend and resolved camera or the cause it was not drawn, and the comparison's pairs and unmatched cells.

`runAutoMovieVideoCapture` samples an encoded or generated video file from the file itself. It plans FFmpeg runs, `scdet` to find the cuts and one frame-exact `select` with `-fps_mode passthrough`, and hands them to a host's process runner, so the stills are the file's own frames around every cut and event, captioned by frame and second. Compared against the source's round, its cells pair by second; pixels are compared only between stills of one backend, and a second the file lacks stays as an unmatched cell with its cause.
