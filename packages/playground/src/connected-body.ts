/**
 * Browser entry for the connected body editor. The body edited here is the
 * body partition view of the published person generation
 * (`test/studies/human-person/generation/body.json.gz`); editing, history,
 * numerical admission and rendering delegate to the same package/viewport
 * owners as the connected face page. The head shown on the neck is that
 * generation's head view with the default face, evaluated with each body
 * document by the product person runtime in its own worker
 * (`createConnectedBodyHeadSeat`), so the neck meets the head exactly as the
 * one-skin person carries it. The head never enters the body document or its
 * export.
 */
import { mountConnectedBodyPanel } from "./human/body/connectedBodyPanel";
import { connectedBodyEditorPoses } from "./human/body/connectedBodyEditorPoses";
import { createConnectedBodyHeadSeat } from "./human/body/createConnectedBodyHeadSeat";
import { createConnectedBodyInitialDocument } from "./human/body/createConnectedBodyInitialDocument";
import { createConnectedBodyPageViewport } from "./human/body/createConnectedBodyPageViewport";
import { createConnectedBodySimpleSolvers } from "./human/body/createConnectedBodySimpleSolvers";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { downloadConnectedFile } from "./human/common/downloadConnectedFile";

async function main(): Promise<void> {
  const basis = (await readConnectedBodyView()).body;
  let viewport!: ReturnType<typeof createConnectedBodyPageViewport>;
  const panel = mountConnectedBodyPanel(document.querySelector<HTMLDivElement>("#app")!, {
    basis,
    initial: createConnectedBodyInitialDocument(basis.id),
    simple: createConnectedBodySimpleSolvers(),
    poses: [...connectedBodyEditorPoses],
    viewport: (canvas) => (viewport = createConnectedBodyPageViewport(canvas)),
    seat: createConnectedBodyHeadSeat({
      viewport: () => viewport,
      status: (text) => {
        document.querySelector<HTMLDivElement>("#body-status")!.textContent += "\n" + text;
      },
    }),
    download: downloadConnectedFile,
  });
  await panel.ready;
}
void main().catch((error: unknown) => {
  document.querySelector<HTMLDivElement>("#app")!.textContent = error instanceof Error ? error.message : String(error);
});
