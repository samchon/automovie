import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import { serializeHumanBodyBasisDocument } from "@automovie/human/body/document/serializeHumanBodyBasisDocument";
import { createAutoMovieResourceRetirement } from "@automovie/viewer";

import { createConnectedBodyPageViewport } from "./human/body/createConnectedBodyPageViewport";
import { mountBodyAnatomicalRequestPanel } from "./human/body/mountBodyAnatomicalRequestPanel";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { createHumanWorker } from "./human/common/createHumanWorker";
import { downloadConnectedFile } from "./human/common/downloadConnectedFile";
import { registerPlaygroundEditor } from "./viewer/registerPlaygroundEditor";
import { readConnectedPersonSourceUrls } from "./human/person/readConnectedPersonSourceUrls";

/** Browser IO for the anatomy inspector; body/worker/viewport owners perform admission and rendering. */
async function main(): Promise<void> {
  const app: HTMLElement = document.querySelector<HTMLElement>("#app")!;
  const canvas: HTMLCanvasElement = document.querySelector<HTMLCanvasElement>("#request-canvas")!;
  const source: ReturnType<typeof readConnectedPersonSourceUrls> = readConnectedPersonSourceUrls(location.search, location.href);
  const basis: Awaited<ReturnType<typeof readConnectedBodyView>>["body"] = (await readConnectedBodyView(source?.body)).body;
  const viewport: ReturnType<typeof createConnectedBodyPageViewport<IAutoMovieHumanBodyBasisDocument>> =
    createConnectedBodyPageViewport<IAutoMovieHumanBodyBasisDocument>(
      canvas,
      (bodyDocument: IAutoMovieHumanBodyBasisDocument): string =>
        serializeHumanBodyBasisDocument(bodyDocument, basis.anatomicalAssembly),
      (): Worker => createHumanWorker("worker=body-anatomy"),
    );
  const panel: ReturnType<typeof mountBodyAnatomicalRequestPanel> = mountBodyAnatomicalRequestPanel(app, {
    basis: basis.id,
    source: basis.anatomicalAssembly,
    viewport,
    download: downloadConnectedFile,
  });
  const close: () => Promise<void> = createAutoMovieResourceRetirement([
    panel.close,
    viewport.close,
  ]);
  window.addEventListener("pagehide", (event: PageTransitionEvent): void => {
    if (!event.persisted)
      void close().catch((error: unknown): void => { console.error(error); });
  });
  registerPlaygroundEditor({ ready: Promise.resolve(), empty: true,
    document: (): IAutoMovieHumanBodyBasisDocument | undefined => panel.snapshot()?.document,
    load: async (text: string): Promise<void> => { if (!await panel.apply(text)) throw new Error("The anatomy request transfer was refused."); },
    controls: document });
}
void main().catch((error: unknown): void => {
  window.__playgroundViewerPage?.fail(error);
  document.querySelector<HTMLElement>("#request-status")!.textContent =
    error instanceof Error ? error.message : String(error);
});
