/**
 * Browser entry for the connected body editor. The body edited here is the
 * body partition view of the published person generation
 * (the Human package's person body asset); editing, history,
 * numerical admission and rendering delegate to the same package/viewport
 * owners as the connected face page. The head shown on the neck is that
 * generation's head view with the default face, evaluated with each body
 * document by the product person runtime in its own worker
 * (`createConnectedBodyHeadSeat`). The companion uses that generation's numerical
 * head/body seam; this wiring alone does not establish observed neck continuity
 * or healthy displayed geometry. The head stays outside the body document and export.
 */
import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import { serializeHumanBodyBasisDocument } from "@automovie/human/body/document/serializeHumanBodyBasisDocument";
import { createAutoMovieResourceRetirement } from "@automovie/viewer";

import { connectedBodyEditorPoses } from "./human/body/connectedBodyEditorPoses";
import { createConnectedBodyHeadSeat } from "@automovie/viewer/human/body/createConnectedBodyHeadSeat";
import { createConnectedBodyInitialDocument } from "./human/body/createConnectedBodyInitialDocument";
import { createConnectedBodyPageViewport } from "./human/body/createConnectedBodyPageViewport";
import { createConnectedBodySimpleSolvers } from "./human/body/createConnectedBodySimpleSolvers";
import { mountConnectedBodyPanel } from "./human/body/mountConnectedBodyPanel";
import { readConnectedBodyView } from "@automovie/viewer/human/body/readConnectedBodyView";
import { setConnectedBodyPreparing } from "./human/body/setConnectedBodyPreparing";
import { downloadConnectedFile } from "./human/common/downloadConnectedFile";
import { readConnectedPersonSourceUrls } from "@automovie/viewer/human/person/readConnectedPersonSourceUrls";
import { registerPlaygroundEditor } from "./viewer/registerPlaygroundEditor";

async function main(): Promise<void> {
  const source: ReturnType<typeof readConnectedPersonSourceUrls> =
    readConnectedPersonSourceUrls(location.search, location.href);
  const basis: Awaited<ReturnType<typeof readConnectedBodyView>>["body"] = (
    await readConnectedBodyView(source?.body)
  ).body;
  let viewport!: ReturnType<typeof createConnectedBodyPageViewport>;
  const simple: ReturnType<typeof createConnectedBodySimpleSolvers> =
    createConnectedBodySimpleSolvers();
  const seat: ReturnType<typeof createConnectedBodyHeadSeat> =
    createConnectedBodyHeadSeat({
      source: basis.anatomicalAssembly,
      viewport: (): ReturnType<typeof createConnectedBodyPageViewport> =>
        viewport,
      status: (text: string): void => {
        document.querySelector<HTMLDivElement>("#body-status")!.textContent +=
          "\n" + text;
      },
      preparing: (active: boolean): void =>
        setConnectedBodyPreparing(
          document,
          "the head view on this body",
          active,
        ),
    });
  const panel: ReturnType<typeof mountConnectedBodyPanel> =
    mountConnectedBodyPanel(document.querySelector<HTMLDivElement>("#app")!, {
      basis,
      initial: createConnectedBodyInitialDocument(basis.id),
      simple,
      poses: [...connectedBodyEditorPoses],
      viewport: (
        canvas: HTMLCanvasElement,
      ): ReturnType<typeof createConnectedBodyPageViewport> =>
        (viewport = createConnectedBodyPageViewport(
          canvas,
          (bodyDocument: IAutoMovieHumanBodyBasisDocument): string =>
            serializeHumanBodyBasisDocument(
              bodyDocument,
              basis.anatomicalAssembly,
            ),
          undefined,
          basis.anatomicalAssembly,
        )),
      seat,
      download: downloadConnectedFile,
    });
  const close: () => Promise<void> = createAutoMovieResourceRetirement([
    panel.close,
    seat.close,
    simple.close,
  ]);
  window.addEventListener("pagehide", (event: PageTransitionEvent): void => {
    if (!event.persisted)
      void close().catch((error: unknown): void => {
        console.error(error);
      });
  });
  registerPlaygroundEditor({
    ready: panel.ready,
    document: (): IAutoMovieHumanBodyBasisDocument | undefined =>
      panel.snapshot()?.document,
    load: panel.load,
    controls: document,
  });
  await panel.ready;
}
void main().catch((error: unknown): void => {
  window.__playgroundViewerPage?.fail(error);
  document.querySelector<HTMLDivElement>("#app")!.textContent =
    error instanceof Error ? error.message : String(error);
});
