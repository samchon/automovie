import type { IAutoMovieHumanBodyAnatomicalDocument, IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { createConnectedBodyPort } from "./connectedBodyPort";
import { createConnectedBodyViewport } from "./connectedBodyViewport";

/**
 * A body page's viewport on its canvas: a WebGL renderer that keeps its
 * drawing buffer for captures, orbit controls, the numerical body worker,
 * texture loading and resize observation. `serialize` is given for a
 * document other than the body basis document.
 *
 * @author Samchon
 */
export function createConnectedBodyPageViewport<
  Document extends IAutoMovieHumanBodyBasisDocument | IAutoMovieHumanBodyAnatomicalDocument = IAutoMovieHumanBodyBasisDocument,
>(canvas: HTMLCanvasElement, serialize?: (document: Document) => string) {
  return createConnectedBodyViewport<Document>({
    canvas,
    pixelRatio: devicePixelRatio,
    renderer: new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }),
    orbit: (camera) => new OrbitControls(camera, canvas),
    worker: () => createConnectedBodyPort(new Worker(new URL("../../connected-body-worker.ts", import.meta.url), { type: "module" })),
    ...(serialize === undefined ? {} : { serialize }),
    loadTexture: (asset) => new THREE.TextureLoader().loadAsync(asset),
    observeResize: (resize) => {
      new ResizeObserver(resize).observe(canvas);
    },
  });
}
