# @automovie/viewer

Displays AutoMovie output through Three.js: it turns `@automovie/interface` models, scenes, poses, expressions and motion into Three objects, plays them on one frame clock, and captures and inspects the result. The engine decides what a frame contains; the viewer only draws it, so the same compiled input always draws the same picture.

Use it in a browser host, a headless capture host, or the playground. It owns no editor controls and no example content.

## Use

```bash
npm install @automovie/viewer three
```

| Entry | Purpose |
| --- | --- |
| `@automovie/viewer` | Scene, model, material and light construction (`buildScene`, `buildModel`, `buildMaterial`), playback (`AutoMoviePlayer`, `applyPose`, `applyExpression`), render passes (`applyRenderMode`, `applyAutoMovieSemanticMask`), transitions (`renderAutoMovieFilmFrame`), instanced formations, effects and fluids, texture-budget facts for `@automovie/render`, subject framing and capture (`mountViewer`, `captureViewerSnapshot`) |
| `@automovie/viewer/human/*` | Face and body viewports over `@automovie/human` runtimes, observation and asset decoding |
| `@automovie/viewer/human/inspection/*` | The Human inspection server, its numerical source and capture publication |
| `@automovie/viewer/process/ProcessOwnership` | Node-only discovery and termination of the services the viewer starts |

## Ownership

The viewer releases what it creates and leaves what the caller passes in. `dispose` functions free viewer-owned geometry, materials, textures and compositor targets, never a caller's renderer, scene or numerical source. Render-budget hosts read texture and render-target facts from the actual objects (`AutoMovieTextureCache.describeSources`, `readAutoMovieRenderTextureTarget`) and pass them to `assessAutoMovieRenderBudget`, which refuses a frame whose memory it cannot bound.
