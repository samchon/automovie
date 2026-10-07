/**
 * Browser entry for the reusable connected-prior editor. Native browser IO
 * resolves one application-selected CC0 basis; all editing, history, numerical
 * admission and rendering delegate to the human package and resident viewport.
 * Both face.html and connected-face.html mount this same numerical editor.
 * The selected photo never participates in this replay.
 */
import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";
import { createHumanWorker } from "./human/common/createHumanWorker";
import { parseHumanFaceBasisDocument } from "@automovie/human/face/document/parseHumanFaceBasisDocument";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import simpleControls from "../../../test/studies/human-face/connected-basis/global-face/simple-controls.json";
import studyDocuments from "../../../test/studies/human-face/connected-basis/global-face/subjects.json";
import { readConnectedFaceAsset } from "./human/common/connectedAsset";
import { createHumanResidentPort } from "./human/common/residentPort";
import { connectedFaceComponents } from "./human/face/anatomy/connectedFaceComponents";
import { mountConnectedFacePanel } from "./human/face/connectedPanel";
import { createConnectedFaceViewport } from "./human/face/connectedViewport";

async function main(): Promise<void> {
  const basis = await readConnectedFaceAsset({
    read: () =>
      fetch(
        new URL(
          "../../../test/studies/human-face/connected-basis/global-face/basis.json.gz",
          import.meta.url,
        ),
      ),
  });
  const initial: IAutoMovieHumanFaceBasisDocument = {
    id: "connected-reference",
    name: "CC0 connected reference",
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
              createHumanWorker("worker=face"),
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
  await panel.ready;
}
void main().catch((error: unknown) => {
  document.querySelector<HTMLDivElement>("#app")!.textContent =
    error instanceof Error ? error.message : String(error);
});
