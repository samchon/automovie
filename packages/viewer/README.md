# @automovie/viewer

Displays AutoMovie output interactively. It gives the inspection page as a React component, mounted in one call, and an imperative canvas mount with its playback loop, snapshots, audio cues and review transport for hosts without React. Building Three.js scenes, applying state at a time, the guide passes, the inspection instrument and the capture core belong to [`@automovie/render`](../render/README.md); `render` and `viewer` are the AutoMovie packages that import `three`.

It has no editor controls and no example content.

## Use

```bash
npm install @automovie/viewer @automovie/render @automovie/interface three react react-dom
```

`react` and `react-dom` 19 are peer dependencies, needed only by a host that renders the inspector. Both the inspector and `mountViewer` need a browser.

The package publishes CommonJS (`lib/*.js`) and ES modules (`lib/*.mjs`), chosen by the `import` condition, and Node hosts need Node.js 22.23.2 or later. Keep the host, the viewer and any Three.js addons on one `three` installation, or constructors and shared uniforms stop matching. A CommonJS host loads `require("three")`, which three.js warns about with `THREE_CJS_DEPRECATED` and which can leave the ES-module addons on a second `three`, so import the package as ESM.

## Inspector page

A page mounts the inspector in one call:

```ts
import type { IAutoMovieDrawSubject } from "@automovie/render";
import { mountAutoMovieInspectorPage } from "@automovie/viewer";

declare const subjects: Readonly<Record<string, IAutoMovieDrawSubject>>;

mountAutoMovieInspectorPage({ root: document.getElementById("root")!, subjects, location, history });
```

`subjects` is the record of subjects by name that a draw page's subject module gives, described in render's [draw-only page](../render/README.md#the-draw-only-page), so the page that inspects and the page that draws offer the same subjects. Create the record once: the canvas mount is keyed on the chosen subject object, and a new object for the same name builds the scene again.

The page's state is one capture request. Every panel (time, selection, marks, shade, view and the request text) edits it, the canvas draws it through render's three.js scene, and the request panel shows the `automovie capture` command that repeats the picture. The address's query is that request, written with the request keys of render's [inspection](../render/README.md#inspection) and [capture](../render/README.md#capture) grammar, so a link reopens the same picture and the same text works on the command line. An address the grammar refuses, such as one with an unknown key, opens the request that asks for nothing and shows the refusal.

`location` and `history` are passed in, and the viewer reads no other global: the query is read once at mount, and each change of the request replaces the current history entry. `unmount` on the returned handle releases the scene, its renderer and its frame loop.

### The component

A host that builds its own page renders `AutoMovieInspector` directly:

```tsx
import type { IAutoMovieDrawSubject } from "@automovie/render";
import { AutoMovieInspector, createAutoMovieInspectorAddressWriter } from "@automovie/viewer";
import { createRoot } from "react-dom/client";

declare const subjects: Readonly<Record<string, IAutoMovieDrawSubject>>;

createRoot(document.getElementById("root")!).render(
  <AutoMovieInspector
    subjects={subjects}
    initialText={location.search}
    onRequestChange={createAutoMovieInspectorAddressWriter({ location, history })}
  />,
);
```

`initialText` is read once. `onRequestChange` receives the request's address text after every change; `createAutoMovieInspectorAddressWriter` gives the listener that writes it into the query through the injected `history`, keeping the path and fragment and adding no history entry. Without a listener the inspector leaves the address alone.

## Imperative mount

`mountViewer` stays for hosts without React: it drives a render loop over a scene and camera you build.

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

## Entry points

- Inspector: `mountAutoMovieInspectorPage`, `AutoMovieInspector`, `createAutoMovieInspectorAddressWriter`.
- Imperative display: `mountViewer`, `releaseMountedViewer`, `createViewerDisplaySave`.
- Audio and transport: `playAutoMovieAudioCues`, `AutoMovieViewerTransport`.

Units and the owner of each returned object are in the JSDoc.

## Ownership

The viewer releases what it creates and leaves alone what you pass in. Render's `dispose` functions free the geometry, materials, textures and render targets they built, never your renderer, scene or source data. Parts of one built model that use the same joints share a skeleton, so dispose of a model through render's `collectAutoMovieOwnedResources`, which lists each shared resource once.

## Polygon man

Render's `buildHumanPolygon` draws the polygon man, the plain-primitive figure a production uses for people, over the joints that `@automovie/human` outputs, and `buildHumanCartoonFace` adds a drawn face to its head. It accepts any object of that shape and does not depend on `@automovie/human`; the [Human README](../human/README.md#polygon-man) shows the two together. The primitives are rigid, so they can overlap or separate at joints and prove nothing about continuous skin or collision clearance.
