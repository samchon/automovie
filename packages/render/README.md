# @automovie/render

Plans how AutoMovie output becomes frames and video, deterministically: frame schedules, file names, sequence timelines with trims and transitions, encoder arguments, capture and encode orchestration, captions and screenplay text, and a render-budget preflight a job checks before it draws.

The package is browser-safe: it accepts capture and encode adapters and owns no process, file or browser launch. The browser capture and FFmpeg export runner, model export, MP4 probing and the directory artifact store are Node tooling that the generated scaffold ships under `src/integrations/render`; a production owns its copy.

## Use

```bash
npm install @automovie/render
```

| Entry | Purpose |
| --- | --- |
| `@automovie/render` | Frame and sequence planning (`planSequenceRender`, `frameTimes`, `ffmpegArgs`), adapter-driven rendering (`renderVideo`, `renderSequenceVideo`), the render-budget preflight (`assessAutoMovieRenderBudget`), captions, the HTTP artifact store (`createAutoMovieHttpArtifactStore`) and production delivery profiles |

## Node tooling

`src/integrations/render` of a production (copied from the scaffold) holds `renderViewerVideo`, the frame cache, `exportModelToGLB`, MP4 probing and muxing, and `DEFAULT_CHROME_EXECUTABLE`. It is the production's code: read its source and JSDoc rather than this package for those APIs.

The generated scaffold's `render.config.ts` and `scripts/render.ts` are the minimal consumer. Capture and encoding report technical observations; actual playback and sound review remain the production's responsibility.
