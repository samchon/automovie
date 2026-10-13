# @automovie/render

Plans how AutoMovie output becomes frames and video, deterministically: frame schedules, file names, sequence timelines with trims and transitions, encoder arguments, capture and encode orchestration, captions and screenplay text, and a render-budget preflight a job checks before it draws.

It owns no browser, GPU, or encoder. A host injects the capture and encode adapters, and the same inputs always produce the same schedule.

## Use

```bash
npm install @automovie/render
```

| Entry | Purpose |
| --- | --- |
| `@automovie/render` | Frame and sequence planning (`planSequenceRender`, `frameTimes`, `ffmpegArgs`), adapter-driven rendering (`renderVideo`, `renderSequenceVideo`), and the render-budget preflight (`assessAutoMovieRenderBudget`); safe in a browser bundle |
| `@automovie/render/node` | Node-only edges such as `exportModelToGLB` |
