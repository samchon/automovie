# @automovie/viewer

Draws AutoMovie output with Three.js. It builds Three.js objects from `@automovie/interface` models and scenes, applies poses, expressions and motion on one frame clock, and captures or inspects the result. The engine decides what a frame contains and the viewer only draws it. This is the one AutoMovie package that imports `three`.

It has no editor controls and no example content. A host, the program that mounts it, can be a browser page or a headless capture process.

## Use

```bash
npm install @automovie/viewer @automovie/interface three
```

```ts
import { buildModel, mountViewer } from "@automovie/viewer";
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

The published JavaScript is ESM only, and Node hosts need Node.js 22.23.2 or later. Keep the host, the viewer and any Three.js addons on one `three` installation, or constructors and shared uniforms stop matching. A host compiled to CommonJS turns its own `three` import into `require("three")` and gets the `THREE_CJS_DEPRECATED` warning, so compile as ESM.

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

`applyAutoMovieInspection` turns a built scene into one inspection picture, in place, and returns a handle whose `restore` puts the scene back. One request states four independent things:

| Question | Request |
| --- | --- |
| Which objects | `parts` and `hide`, patterns over the object paths `listAutoMovieInspectionPaths` prints |
| How surfaces are coloured | `shade`, a guide pass, `clay` for form without colour or `faces` for the side each surface shows; `surface` off leaves the marks alone, and `wire` draws triangle edges |
| What is marked | `curves`, the construction curves the caller supplies, and `defects` and `sliver`, the mesh defects the engine measures on the drawn surfaces |
| Where the scene is cut | `section`, a world-space plane; in the browser a film's own shader material is cut only when its shader includes three.js's clipping chunks |

```ts
import { applyAutoMovieInspection, parseAutoMovieInspectionRequest, rasterizeAutoMovieScene } from "@automovie/viewer";

const request = parseAutoMovieInspectionRequest((key) => url.searchParams.get(key));
const inspection = applyAutoMovieInspection({ scene, request, constructions });
try {
  inspection.update(); // after every seek, before drawing
  const frame = rasterizeAutoMovieScene({ scene, camera, width: 960, height: 960 });
} finally {
  inspection.restore();
}
```

The applied scene is drawn by the browser renderer and by `rasterizeAutoMovieScene` alike, so a page and a still made in Node show the same request. Each kind of mark has one colour, listed in `AUTO_MOVIE_INSPECTION_PALETTE`, and the handle's `legend` counts the marks drawn in each. A pattern that selects nothing throws instead of drawing an empty picture, and the handle's `selected` lists what the request selected.

Construction curves come from the engine's `sampleAutoMovieConstructionCurves`, paired with the scene object the form was built into. They are the form at rest, so read them on the rest pose.

`parseAutoMovieInspectionRequest` reads a request from named text values, so a page address and a command line share one grammar; its JSDoc tabulates the keys. `autoMovieViewerNamedViewpoints` gives the eight views asked for by name, which `frameAutoMovieViewerSubject` frames on the box the handle's `bounds` measures.

WebGL draws every line one pixel wide, so the stroke width applies to stills drawn by the CPU rasterizer.

## Ownership

The viewer releases what it creates and leaves alone what you pass in. A `dispose` function frees viewer-owned geometry, materials, textures and render targets, never your renderer, scene or source data. Parts of one built model that use the same joints share a skeleton, so dispose of a model through `collectAutoMovieOwnedResources`, which lists each shared resource once.

## Polygon man

`buildHumanPolygon` draws the polygon man, the plain-primitive figure a production uses for people, over the joints that `@automovie/human` outputs, and `buildHumanCartoonFace` adds a drawn face to its head. The viewer accepts any object of that shape and does not depend on `@automovie/human`; the [Human README](../human/README.md#polygon-man) shows the two together. The primitives are rigid, so they can overlap or separate at joints and prove nothing about continuous skin or collision clearance.
