# @automovie/render

Plans how AutoMovie output becomes frames and a video file: frame schedules and file names, sequence timelines with trims and transitions, encoder arguments, captions, and a render-budget check a job runs before it draws. The plans are deterministic. Pixels and encoded bytes depend on the capture and encoding the host supplies.

The package launches nothing itself, which keeps it usable in a browser. You pass it adapters that capture a frame and run the encoder.

```bash
npm install @automovie/render
```

```ts
import type { IAutoMovieRenderSpec } from "@automovie/interface";
import { type IAutoMovieRenderAdapters, frameTimes, renderVideo } from "@automovie/render";

frameTimes(30, 2); // 60 instants: 0, 1/30, 2/30, ...

declare const spec: IAutoMovieRenderSpec;
declare const adapters: IAutoMovieRenderAdapters;

const result = await renderVideo(spec, 2, "frames", "out.mp4", adapters);
```

The two adapters are yours to write. `captureFrame(timeSeconds, index, dir)` draws the scene at that instant, writes the frame into `dir` and returns its path, and `encode(args, outputPath)` runs ffmpeg with the given arguments. Every instant is `index / fps`, never a running sum, so a schedule is identical on every machine.

## Entry points

- `frameTimes`, `ffmpegArgs` and `planSequenceRender` produce plans without doing any I/O.
- `renderVideo` renders one clip and `renderSequenceVideo` an edited sequence, both through your adapters.
- `assessAutoMovieRenderBudget` refuses a job whose memory it cannot bound.
- `planCaptionSidecar` and the delivery profiles cover captions and the delivered video's format.

## Node tooling

A ready host is in every generated production under `src/executable/render`: browser capture, FFmpeg export and MP4 handling. It belongs to the production, so read its source for those APIs. `npm run render` in a production runs it.

Capture and encoding report technical facts only. Watching and listening to the result is still the production's review.
