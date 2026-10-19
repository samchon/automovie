# @automovie/viewer

Displays AutoMovie output through Three.js: it turns `@automovie/interface` models, scenes, poses, expressions and motion into Three objects, plays them on one frame clock, and captures and inspects the result. The engine decides what a frame contains; the viewer only draws it, so the same compiled input always draws the same picture.

Use it in a browser host, a headless capture host, or the playground. It owns no editor controls and no example content.

## Use

```bash
npm install @automovie/viewer three
```

Node hosts require Node 22.23.2 or later. The published JavaScript is ESM, with no separate CommonJS build. In an ESM project, the public entry and Three addons can load concurrently:

```typescript
const [viewer, three, lights] = await Promise.all([
  import("@automovie/viewer"),
  import("three"),
  import("three/examples/jsm/lights/RectAreaLightUniformsLib.js"),
]);
console.log(
  typeof viewer.buildLight,
  three.REVISION,
  typeof lights.RectAreaLightUniformsLib.init,
);
```

Keep the host, viewer and addons on one Three installation so their constructors and shared uniforms retain the same identity.

A source-linked `ttsx -P tsconfig.json` consumer should use an ESM compiler configuration (`module: "ESNext"` or `"NodeNext"`). The repository's CommonJS test configuration was observed to convert the consumer's Three import into `require("three")`, emitting `THREE_CJS_DEPRECATED`; the packed native ESM and source-linked ESM configurations did not emit that warning.

| Entry | Purpose |
| --- | --- |
| `@automovie/viewer` | Scene, model, material and light construction (`buildScene`, `buildModel`, `buildMaterial`), playback (`AutoMoviePlayer`, `applyPose`, `applyExpression`), render passes (`applyRenderMode`, `applyAutoMovieSemanticMask`), transitions (`renderAutoMovieFilmFrame`), instanced formations, effects and fluids, texture-budget facts for `@automovie/render`, subject framing and capture (`mountViewer`, `captureViewerSnapshot`) |
| `@automovie/viewer/node` | Node-only browser capture sessions |
| `@automovie/viewer/process/ProcessOwnership` | Node-only discovery and termination of the services the viewer starts |

## Ownership

The viewer releases what it creates and leaves what the caller passes in. `dispose` functions free viewer-owned geometry, materials, textures and compositor targets, never a caller's renderer, scene or numerical source. Render-budget hosts read texture and render-target facts from the actual objects (`AutoMovieTextureCache.describeSources`, `readAutoMovieRenderTextureTarget`) and pass them to `assessAutoMovieRenderBudget`, which refuses a frame whose memory it cannot bound.

`buildAutoMovieConstruction` displays supplied open or closed generating polylines in metres under an explicit point budget, with one owned disposer. `createAutoMovieMetricOrthographicCamera` maps a supplied horizontal metric pixel chart to a native camera. `captureAutoMovieMetricFrame` captures the current scene in physical pixels as a surface or structural silhouette pass, then restores borrowed renderer and scene state. The host owns subject visibility, admission budgets and redrawing its ordinary camera; these operations perform no reconstruction or camera estimation.
