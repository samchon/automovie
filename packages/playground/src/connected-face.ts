/**
 * Browser entry for the reusable connected-prior editor. Native browser IO
 * resolves the one basis the caller selects with `faceSource`; the repository
 * bundles none. All editing, history, numerical
 * admission and rendering delegate to the human package and resident viewport.
 * Both face.html and connected-face.html mount this same numerical editor.
 * The selected photo never participates in this replay.
 */
import type { IAutoMovieHumanFaceBasis, IAutoMovieHumanFaceBasisDocument } from "@automovie/human";
import { parseHumanFaceBasisDocument } from "@automovie/human/face/document/parseHumanFaceBasisDocument";

import simpleControls from "./human/examples/face-controls.json";
import studyDocuments from "./human/examples/faces.json";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";
import { createHumanWorker } from "./human/common/createHumanWorker";
import { createHumanResidentPort } from "./human/common/createHumanResidentPort";
import { downloadConnectedFile } from "./human/common/downloadConnectedFile";
import { connectedFaceComponents } from "./human/face/anatomy/connectedFaceComponents";
import { mountConnectedFacePanel } from "./human/face/mountConnectedFacePanel";
import { readConnectedFaceSourceUrl } from "./human/face/readConnectedFaceSourceUrl";
import { createConnectedFaceBrowserViewport } from "@automovie/viewer/human/face/createConnectedFaceBrowserViewport";
import { registerPlaygroundEditor } from "./viewer/registerPlaygroundEditor";

async function main(): Promise<void> {
  const source: string = readConnectedFaceSourceUrl(location.search, location.href);
  const basis: IAutoMovieHumanFaceBasis = await readConnectedFaceAsset({
    read: (): Promise<Response> => fetch(source),
  });
  const initial: IAutoMovieHumanFaceBasisDocument = {
    id: "connected-reference",
    name: "Connected reference",
    basis: basis.id,
    shape: {},
    expression: {},
  };
  const panel: ReturnType<typeof mountConnectedFacePanel<Awaited<ReturnType<ReturnType<typeof createConnectedFaceBrowserViewport>["build"]>>>> = mountConnectedFacePanel(
    document.querySelector<HTMLDivElement>("#app")!,
    {
      basis,
      initial,
      controlMap: simpleControls,
      componentTree: connectedFaceComponents,
      studies: studyDocuments.map((document: (typeof studyDocuments)[number]): IAutoMovieHumanFaceBasisDocument =>
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
      viewport: (canvas: HTMLCanvasElement): ReturnType<typeof createConnectedFaceBrowserViewport> =>
        createConnectedFaceBrowserViewport({
          canvas,
          pixelRatio: devicePixelRatio,
          worker: (): ReturnType<Parameters<typeof createConnectedFaceBrowserViewport>[0]["worker"]> =>
            createHumanResidentPort(
              createHumanWorker(
                "worker=face&faceSource=" + encodeURIComponent(source),
              ),
            ),
        }),
      download: downloadConnectedFile,
    },
  );
  registerPlaygroundEditor({ ready: panel.ready,
    document: (): IAutoMovieHumanFaceBasisDocument | undefined => panel.snapshot()?.document,
    load: panel.load, controls: document });
  addEventListener("pagehide", (event: PageTransitionEvent): void => {
    if (!event.persisted) void panel.close().catch((error: unknown): void => { console.error(error); });
  });
  await panel.ready;
}
void main().catch((error: unknown): void => {
  window.__playgroundViewerPage?.fail(error);
  document.querySelector<HTMLDivElement>("#app")!.textContent =
    error instanceof Error ? error.message : String(error);
});
