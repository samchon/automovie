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
| `@automovie/viewer/human/*` | Face and body viewports over `@automovie/human` runtimes, observation and asset decoding |
| `@automovie/viewer/human/inspection/*` | The Human inspection server, its numerical source and capture publication |
| `@automovie/viewer/node` | Node-only browser capture sessions |
| `@automovie/viewer/process/ProcessOwnership` | Node-only discovery and termination of the services the viewer starts |

## Ownership

The Human inspection command loads the application's HTML directory and example factories from the module selected by `HUMAN_VIEWER_APPLICATION`; `HUMAN_VIEWER_ROOT` selects its working directory. Checkout execution uses the checked source compiler. Installed execution runs published JavaScript directly and records its byte witnesses without loading a source compiler. Playground supplies its existing application binding through `pnpm --filter @automovie/playground human:viewer`.

The viewer releases what it creates and leaves what the caller passes in. `dispose` functions free viewer-owned geometry, materials, textures and compositor targets, never a caller's renderer, scene or numerical source. Render-budget hosts read texture and render-target facts from the actual objects (`AutoMovieTextureCache.describeSources`, `readAutoMovieRenderTextureTarget`) and pass them to `assessAutoMovieRenderBudget`, which refuses a frame whose memory it cannot bound.
