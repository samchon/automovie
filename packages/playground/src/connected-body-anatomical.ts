import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import { serializeHumanBodyBasisDocument } from "@automovie/human/body/document/serializeHumanBodyBasisDocument";

import { createConnectedBodyPageViewport } from "./human/body/createConnectedBodyPageViewport";
import { mountBodyAnatomicalRequestPanel } from "./human/body/mountBodyAnatomicalRequestPanel";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { createHumanWorker } from "./human/common/createHumanWorker";
import { downloadConnectedFile } from "./human/common/downloadConnectedFile";

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
  mountBodyAnatomicalRequestPanel(app, {
    basis: basis.id,
    source: basis.anatomicalAssembly,
    viewport,
    download: downloadConnectedFile,
  });
}
void main().catch((error: unknown) => {
  document.querySelector<HTMLElement>("#request-status")!.textContent =
    error instanceof Error ? error.message : String(error);
});
