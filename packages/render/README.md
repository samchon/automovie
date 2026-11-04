# @automovie/render

Plans how AutoMovie output becomes frames and video, deterministically: frame schedules, file names, sequence timelines with trims and transitions, encoder arguments, capture and encode orchestration, captions and screenplay text, and a render-budget preflight a job checks before it draws.

The browser-safe entry accepts capture and encode adapters. The Node entry also owns a ready-to-use browser capture and FFmpeg export runner. Both use the same deterministic frame schedule; captured pixels depend on the supplied viewer.

## Use

```bash
npm install @automovie/render
```

| Entry | Purpose |
| --- | --- |
| `@automovie/render` | Frame and sequence planning (`planSequenceRender`, `frameTimes`, `ffmpegArgs`), adapter-driven rendering (`renderVideo`, `renderSequenceVideo`), and the render-budget preflight (`assessAutoMovieRenderBudget`); safe in a browser bundle |
| `@automovie/render/node` | `renderViewerVideo` exports a running Viewer through its completed seek hook and an installed FFmpeg executable; also provides model export and media orchestration |
| `@automovie/render/node/chrome` | `DEFAULT_CHROME_EXECUTABLE`, the `CHROME` environment override or platform preference, without loading model export and media orchestration |

## Export a running Viewer

`renderViewerVideo(options)` takes the viewer URL, render spec, duration in seconds, frame scratch parent, MP4 destination and Chrome/FFmpeg executable paths. The viewer exposes `__afSeek(seconds)` and finishes placement and drawing before that hook returns or resolves. Its `#view` element must match the requested raster; `viewSelector`, `hideSelector` and `seekFunction` select another host surface or hook.

The runner captures exactly `durationSeconds * fps` frames at `i / fps`, refusing fractional frame counts. Optional `audioMix` supplies a complete soundtrack whose first audio stream is padded or trimmed to the film duration. An `AbortSignal` cancels capture and encoding; PNG scratch, page, browser and encoder are released on completion or failure. Frame count, retained bytes, browser-operation and encoder-time limits are configurable. The result retains frame hashes and timings, plus the final 64 KiB of encoder diagnostics.

Optional `prepare(page)` runs once on the already loaded capture page before frame zero, exposing its public evaluation transport and accepting a prepared `audioMix` path. Preparation failure prevents capture and encoding; the result reports its wall time separately as `prepareMs`.

The generated scaffold's `render.config.ts` and `scripts/render.ts` are the minimal consumer. Capture and encoding report technical observations; actual playback and sound review remain the production's responsibility.
