import { type IAutoMovieHumanBodyAnatomicalDocument, type IAutoMovieHumanBodyBasis, serializeHumanBodyAnatomicalDocument } from "@automovie/human";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { createConnectedBodyPort } from "./human/body/connectedBodyPort";
import { createConnectedBodyViewport } from "./human/body/connectedBodyViewport";
import { mountBodyAnatomicalRequestPanel } from "./human/body/mountBodyAnatomicalRequestPanel";
import { readConnectedFaceAsset } from "./human/common/connectedAsset";

/** Browser IO for the numerical inspector; body/worker/viewport owners perform admission and rendering. */
async function main() {
  const app = document.querySelector<HTMLElement>("#app")!;
  const canvas = document.querySelector<HTMLCanvasElement>("#request-canvas")!;
  const basis = await readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({ read: () => fetch(new URL("../../../test/studies/human-body/connected-basis/basis.json.gz", import.meta.url)) });
  const viewport = createConnectedBodyViewport<IAutoMovieHumanBodyAnatomicalDocument>({
    canvas,
    pixelRatio: devicePixelRatio,
    renderer: new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }),
    orbit: (camera) => new OrbitControls(camera, canvas),
    worker: () => createConnectedBodyPort(new Worker(new URL("./connected-body-worker.ts", import.meta.url), { type: "module" })),
    serialize: serializeHumanBodyAnatomicalDocument,
    loadTexture: (asset) => new THREE.TextureLoader().loadAsync(asset),
    observeResize: (resize) => { new ResizeObserver(resize).observe(canvas); },
  });
  mountBodyAnatomicalRequestPanel(app, {
    basis: basis.id,
    viewport,
    download: (name, bytes, mime) => {
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = name;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });
}
void main().catch((error: unknown) => {
  document.querySelector<HTMLElement>("#request-status")!.textContent = error instanceof Error ? error.message : String(error);
});
