import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import { serializeHumanBodyBasisDocument } from "@automovie/human/body/document/serializeHumanBodyBasisDocument";

import { createConnectedBodyPageViewport } from "./human/body/createConnectedBodyPageViewport";
import { mountBodyAnatomicalRequestPanel } from "./human/body/mountBodyAnatomicalRequestPanel";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { createHumanWorker } from "./human/common/createHumanWorker";
import { downloadConnectedFile } from "./human/common/downloadConnectedFile";
import { registerPlaygroundEditor } from "./viewer/registerPlaygroundEditor";

/** Browser IO for the anatomy inspector; body/worker/viewport owners perform admission and rendering. */
async function main() {
  const app = document.querySelector<HTMLElement>("#app")!;
  const canvas = document.querySelector<HTMLCanvasElement>("#request-canvas")!;
  const basis = (await readConnectedBodyView()).body;
  const viewport =
    createConnectedBodyPageViewport<IAutoMovieHumanBodyBasisDocument>(
      canvas,
      (bodyDocument) =>
        serializeHumanBodyBasisDocument(bodyDocument, basis.anatomicalAssembly),
      () => createHumanWorker("worker=body-anatomy"),
    );
  const panel = mountBodyAnatomicalRequestPanel(app, {
    basis: basis.id,
    source: basis.anatomicalAssembly,
    viewport,
    download: downloadConnectedFile,
  });
  registerPlaygroundEditor({ ready: Promise.resolve(), empty: true,
    document: () => panel.snapshot()?.document,
    load: async (text) => { if (!await panel.apply(text)) throw new Error("The anatomy request transfer was refused."); },
    controls: document });
}
void main().catch((error: unknown) => {
  window.__playgroundViewerPage?.fail(error);
  document.querySelector<HTMLElement>("#request-status")!.textContent =
    error instanceof Error ? error.message : String(error);
});
