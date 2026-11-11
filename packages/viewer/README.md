# @automovie/viewer

Displays AutoMovie output interactively: it mounts a canvas, runs the playback loop, saves snapshots, plays audio cues and provides the transport and review controls. Building Three.js objects from `@automovie/interface` models and scenes, applying state at a time, the guide passes, inspection, the polygon man and the CPU rasterizer belong to `@automovie/render`, and the entry points below other than mounting, display and transport are imported from there. `render` and `viewer` are the AutoMovie packages that import `three`.

It has no editor controls and no example content. A host, the program that mounts it, can be a browser page or a headless capture process.

## Use

```bash
npm install @automovie/viewer @automovie/render @automovie/interface three
```

```ts
import { buildModel } from "@automovie/render";
import { mountViewer } from "@automovie/viewer";
import type { IAutoMovieModel } from "@automovie/interface";
import * as THREE from "three";

declare const model: IAutoMovieModel;
declare const canvas: HTMLCanvasElement;

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

`mountViewer` is the only entry point that needs a browser.

The package publishes CommonJS (`lib/*.js`) and ES modules (`lib/*.mjs`), chosen by the `import` condition, and Node hosts need Node.js 22.23.2 or later. Keep the host, the viewer and any Three.js addons on one `three` installation, or constructors and shared uniforms stop matching. A CommonJS host loads `require("three")`, which three.js warns about with `THREE_CJS_DEPRECATED` and which can leave the ES-module addons on a second `three`, so import the package as ESM.

## Entry points

Everything is exported from the package root.

- Build: `buildScene`, `buildModel`, `buildMaterial`, `buildLight`.
- Play: `AutoMoviePlayer`, `applyPose`, `applyExpression`, and `applyAutoMovieRigLocals` for complete rig-evaluator output.
- Passes and transitions: `applyRenderMode`, `applyAutoMovieSemanticMask`, `renderAutoMovieFilmFrame`.
- Mount and capture: `mountViewer`, `captureViewerSnapshot`.
- Draw without a browser: `rasterizeAutoMovieScene`, `AutoMovieRasterSheet`, `compareAutoMovieRasters`, `encodeAutoMovieRasterPng`.
- Inspect: `applyAutoMovieInspection`, `parseAutoMovieInspectionRequest`, `listAutoMovieInspectionPaths`, `autoMovieViewerNamedViewpoints`.

Formations, effects, fluids, soft bodies, section planes and the metric capture helpers are exported the same way. Units and the owner of each returned object are in the JSDoc.

## Inspection

The inspection instrument, its request grammar and its marks belong to `@automovie/render`; its README describes them. The page draws an applied inspection like any other scene.

## Ownership

The viewer releases what it creates and leaves alone what you pass in. A `dispose` function frees viewer-owned geometry, materials, textures and render targets, never your renderer, scene or source data. Parts of one built model that use the same joints share a skeleton, so dispose of a model through `collectAutoMovieOwnedResources`, which lists each shared resource once.

## Polygon man

`buildHumanPolygon` draws the polygon man, the plain-primitive figure a production uses for people, over the joints that `@automovie/human` outputs, and `buildHumanCartoonFace` adds a drawn face to its head. The viewer accepts any object of that shape and does not depend on `@automovie/human`; the [Human README](../human/README.md#polygon-man) shows the two together. The primitives are rigid, so they can overlap or separate at joints and prove nothing about continuous skin or collision clearance.
