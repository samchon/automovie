/**
 * Browser entry for the reusable connected-prior editor. Native browser IO
 * resolves one application-selected CC0 basis; all editing, history, numerical
 * admission and rendering delegate to the same package/viewport owners as the
 * ordinary face page. The selected photo never participates in this replay.
 */
import {
  type IAutoMovieHumanFaceBasisDocument,
  serializeHumanFaceBasisDocument,
} from "@automovie/human";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { readConnectedFaceAsset } from "./human/connectedAsset";
import { mountConnectedFacePanel } from "./human/connectedPanel";
import { createHumanViewport } from "./human/viewport";
import { createHumanPreviewWorkerPort } from "./human/workerPort";

async function main(): Promise<void> {
  const basis = await readConnectedFaceAsset({
    read: () =>
      fetch(
        new URL(
          "../../../test/studies/human-face/connected-basis/basis.json.gz",
          import.meta.url,
        ),
      ),
    decode: (bytes) =>
      new Response(
        new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
      ).text(),
  });
  const initial: IAutoMovieHumanFaceBasisDocument = {
    version: "human-face-basis-document/1",
    id: "connected-reference",
    name: "CC0 connected reference",
    basis: basis.id,
    shape: {},
    expression: {},
  };
  let viewport!: ReturnType<
    typeof createHumanViewport<IAutoMovieHumanFaceBasisDocument>
  >;
  const panel = mountConnectedFacePanel(
    document.querySelector<HTMLDivElement>("#app")!,
    {
      channels: basis.channels,
      initial,
      presets: [
        { name: "Neutral", expression: {} },
        {
          name: "Smile",
          expression: { mouthSmileLeft: 0.5, mouthSmileRight: 0.5 },
        },
        { name: "Open jaw", expression: { jawOpen: 0.5 } },
        { name: "Wink", expression: { eyeBlinkRight: 1 } },
        { name: "Pucker", expression: { mouthPucker: 0.5 } },
      ],
      viewport: (canvas) => {
        const loader = new GLTFLoader();
        return (viewport = createHumanViewport({
          serialize: serializeHumanFaceBasisDocument,
          canvas,
          pixelRatio: devicePixelRatio,
          renderer: new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            preserveDrawingBuffer: true,
          }),
          orbit: (camera) => new OrbitControls(camera, canvas),
          worker: () =>
            createHumanPreviewWorkerPort(
              new Worker(
                new URL("./connected-face-worker.ts", import.meta.url),
                { type: "module" },
              ),
            ),
          decode: async (bytes) => (await loader.parseAsync(bytes, "")).scene,
          observeResize: (resize) => {
            new ResizeObserver(resize).observe(canvas);
          },
        }));
      },
      download: (filename, bytes, mime) => {
        const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
    },
  );
  Object.assign(window, {
    __connectedFace: {
      snapshot: panel.snapshot,
      document: () => panel.snapshot()?.document,
      camera: viewport.cameraView,
      finish: viewport.finish,
      renderer: viewport.renderer,
    },
  });
  await panel.ready;
}
void main().catch((error: unknown) => {
  document.querySelector<HTMLDivElement>("#app")!.textContent =
    error instanceof Error ? error.message : String(error);
});
