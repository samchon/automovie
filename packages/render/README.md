# @automovie/render

Plans how AutoMovie output becomes frames and a video file: frame schedules and file names, sequence timelines with trims and transitions, encoder arguments, captions, and a render-budget check a job runs before it draws. The plans are deterministic. Pixels and encoded bytes depend on the capture and encoding you supply.

The package launches nothing itself, which keeps it usable in a browser. You pass it adapters that capture a frame and run the encoder.

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
