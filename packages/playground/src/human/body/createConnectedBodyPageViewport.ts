import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { createHumanWorker } from "../common/createHumanWorker";
import { createConnectedBodyPort } from "./connectedBodyPort";
import { createConnectedBodyViewport } from "@automovie/viewer/human/body/createConnectedBodyViewport";

/**
 * A body page's viewport on its canvas: a WebGL renderer that keeps its
 * drawing buffer for captures, orbit controls, the numerical body worker,
 * texture loading and resize observation. `serialize` is given for a
 * document other than the body basis document, and `worker` for a page whose
 * numerical worker is not the body editor's.
 *
 * @author Samchon
 */
export function createConnectedBodyPageViewport<
  Document extends IAutoMovieHumanBodyBasisDocument =
    IAutoMovieHumanBodyBasisDocument,
>(
  canvas: HTMLCanvasElement,
  serialize?: (document: Document) => string,
  worker?: () => Worker,
  source?: IAutoMovieHumanBodyAnatomicalAssembly,
) {
  return createConnectedBodyViewport<Document>({
    source,
    canvas,
    pixelRatio: devicePixelRatio,
    renderer: new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    }),
    orbit: (camera) => new OrbitControls(camera, canvas),
    worker: () =>
      createConnectedBodyPort(worker?.() ?? createHumanWorker("worker=body")),
    ...(serialize === undefined ? {} : { serialize }),
    loadTexture: (asset) => new THREE.TextureLoader().loadAsync(asset),
    observeResize: (resize) => {
      new ResizeObserver(resize).observe(canvas);
    },
  });
}
