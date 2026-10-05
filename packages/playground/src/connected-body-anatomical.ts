import { type IAutoMovieHumanBodyAnatomicalDocument, serializeHumanBodyAnatomicalDocument } from "@automovie/human";

import { createConnectedBodyPageViewport } from "./human/body/createConnectedBodyPageViewport";
import { mountBodyAnatomicalRequestPanel } from "./human/body/mountBodyAnatomicalRequestPanel";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { downloadConnectedFile } from "./human/common/downloadConnectedFile";

/** Browser IO for the numerical inspector; body/worker/viewport owners perform admission and rendering. */
async function main() {
  const app = document.querySelector<HTMLElement>("#app")!;
  const canvas = document.querySelector<HTMLCanvasElement>("#request-canvas")!;
  const basis = (await readConnectedBodyView()).body;
  const viewport = createConnectedBodyPageViewport<IAutoMovieHumanBodyAnatomicalDocument>(canvas, serializeHumanBodyAnatomicalDocument);
  mountBodyAnatomicalRequestPanel(app, { basis: basis.id, viewport, download: downloadConnectedFile });
}
void main().catch((error: unknown) => {
  document.querySelector<HTMLElement>("#request-status")!.textContent = error instanceof Error ? error.message : String(error);
});
