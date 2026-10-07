import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import { createHumanWorker } from "../common/createHumanWorker";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { createConnectedBodyPort } from "./connectedBodyPort";
import { createConnectedBodyViewport } from "./connectedBodyViewport";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";

/**
 * A body page's viewport on its canvas: a WebGL renderer that keeps its
 * drawing buffer for captures, orbit controls, the numerical body worker,
 * texture loading and resize observation. `serialize` is given for a
 * document other than the body basis document, and `worker` for a page whose
 * numerical worker is not the body editor's.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Assembles the canvas, orbit, numerical body worker and textures the editor's whole-figure view runs on.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Wires the persistent body worker that compiles the basis once and evaluates each document for the viewport.
 * @author Samchon
 */
export function createConnectedBodyPageViewport<
  Document extends IAutoMovieHumanBodyBasisDocument = IAutoMovieHumanBodyBasisDocument,
>(canvas: HTMLCanvasElement, serialize?: (document: Document) => string, worker?: () => Worker, source?: IAutoMovieHumanBodyAnatomicalAssembly) {
  return createConnectedBodyViewport<Document>({
    source,
    canvas,
    pixelRatio: devicePixelRatio,
    renderer: new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }),
    orbit: (camera) => new OrbitControls(camera, canvas),
    worker: () => createConnectedBodyPort(worker?.() ?? createHumanWorker("worker=body")),
    ...(serialize === undefined ? {} : { serialize }),
    loadTexture: (asset) => new THREE.TextureLoader().loadAsync(asset),
    observeResize: (resize) => {
      new ResizeObserver(resize).observe(canvas);
    },
  });
}
