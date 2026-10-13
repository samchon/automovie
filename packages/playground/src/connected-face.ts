/**
 * Browser entry for the reusable connected-prior editor. Native browser IO
 * resolves the one basis the caller selects with `faceSource`; the repository
 * bundles none. All editing, history, numerical
 * admission and rendering delegate to the human package and resident viewport.
 * Both face.html and connected-face.html mount this same numerical editor.
 * The selected photo never participates in this replay.
 */
import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";
import { parseHumanFaceBasisDocument } from "@automovie/human/face/document/parseHumanFaceBasisDocument";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import simpleControls from "./human/examples/face-controls.json";
import studyDocuments from "./human/examples/faces.json";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";
import { createHumanWorker } from "./human/common/createHumanWorker";
import { createHumanResidentPort } from "./human/common/residentPort";
import { connectedFaceComponents } from "./human/face/anatomy/connectedFaceComponents";
import { mountConnectedFacePanel } from "./human/face/connectedPanel";
import { readConnectedFaceSourceUrl } from "./human/face/readConnectedFaceSourceUrl";
import { createConnectedFaceViewport } from "@automovie/viewer/human/face/createConnectedFaceViewport";
import { registerPlaygroundEditor } from "./viewer/registerPlaygroundEditor";

async function main(): Promise<void> {
  const source = readConnectedFaceSourceUrl(location.search, location.href);
  const basis = await readConnectedFaceAsset({
    read: () => fetch(source),
  });
  const initial: IAutoMovieHumanFaceBasisDocument = {
    id: "connected-reference",
    name: "Connected reference",
    basis: basis.id,
    shape: {},
    expression: {},
  };
  let viewport!: ReturnType<typeof createConnectedFaceViewport>;
  const panel = mountConnectedFacePanel(
    document.querySelector<HTMLDivElement>("#app")!,
    {
      basis,
      initial,
      controlMap: simpleControls,
      componentTree: connectedFaceComponents,
      studies: studyDocuments.map((document) =>
        parseHumanFaceBasisDocument(JSON.stringify(document)),
      ),
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
        const loader = new THREE.TextureLoader();
        return (viewport = createConnectedFaceViewport({
          canvas,
          pixelRatio: devicePixelRatio,
          renderer: new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            preserveDrawingBuffer: true,
          }),
          orbit: (stageCamera) => new OrbitControls(stageCamera, canvas),
          worker: () =>
            createHumanResidentPort(
              createHumanWorker(
                "worker=face&faceSource=" + encodeURIComponent(source),
              ),
            ),
          loadTexture: (asset) => loader.loadAsync(asset),
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
  registerPlaygroundEditor({ ready: panel.ready,
    document: () => panel.snapshot()?.document,
    load: panel.load, controls: document });
  await panel.ready;
}
void main().catch((error: unknown) => {
  window.__playgroundViewerPage?.fail(error);
  document.querySelector<HTMLDivElement>("#app")!.textContent =
    error instanceof Error ? error.message : String(error);
});
