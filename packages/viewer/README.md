# @automovie/viewer

Draws AutoMovie output with Three.js. It builds Three objects from `@automovie/interface` models and scenes, applies poses, expressions and motion on one frame clock, and captures or inspects the result. The engine decides what a frame contains and the viewer only draws it. This is the one AutoMovie library that imports `three`.

It has no editor controls and no example content. A browser page, a headless capture host or the playground mounts it.

## Use

```bash
npm install @automovie/viewer three
```

```ts
import { buildModel, mountViewer } from "@automovie/viewer";
import * as THREE from "three";

const scene = new THREE.Scene();
scene.add(buildModel(model).object);
scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b2, 1.1));

const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);
camera.position.set(0, 1, 3.8);

const viewer = mountViewer(canvas, scene, camera, (elapsedSeconds) => {
  // advance an AutoMoviePlayer or apply a pose here
});
// viewer.stop() ends the loop and releases the renderer.
```

`model` is an `IAutoMovieModel` and `canvas` an `HTMLCanvasElement`. `mountViewer` is the only entry point that needs a browser.

The published JavaScript is ESM only, and Node hosts need Node 22.23.2 or later. Keep the host, the viewer and any Three addons on one `three` installation, or constructors and shared uniforms stop matching. A consumer compiled to CommonJS turns its own `three` import into `require("three")` and gets Three's `THREE_CJS_DEPRECATED` warning, so compile as ESM.

## Entry points

Everything is exported from the package root.

- Build: `buildScene`, `buildModel`, `buildMaterial`, `buildLight`.
- Play: `AutoMoviePlayer`, `applyPose`, `applyExpression`, and `applyAutoMovieRigLocals` for complete rig-evaluator output.
- Passes and transitions: `applyRenderMode`, `applyAutoMovieSemanticMask`, `renderAutoMovieFilmFrame`.
- Mount and capture: `mountViewer`, `captureViewerSnapshot`.

Formations, effects, fluids, soft bodies, section planes and the metric capture helpers follow the same naming, and each JSDoc states its units and who owns the objects it returns. The CPU rasterizer is not in this package; it is Node tooling in a generated production under `src/executable/viewer/node/raster`.

## Ownership

The viewer releases what it creates and leaves alone what you pass in. A `dispose` function frees viewer-owned geometry, materials, textures and render targets, never your renderer, scene or source data. Parts of one built model that use the same joints share a skeleton, so retire a model through `collectAutoMovieOwnedResources`, which lists each shared resource once.

## Polygon mannequin

`buildHumanPolygon` draws a rigid polygon mannequin over the skeleton and exterior that `@automovie/human` outputs, and `buildHumanCartoonFace` adds a drawn face to its head. The viewer accepts that output structurally and does not depend on the Human package. The modules are rigid, so they can overlap or separate at joints and prove nothing about continuous skin or collision clearance. Human's own diagnostic controls are in its [debug viewer](../human/debug/README.md).
