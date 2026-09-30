/**
 * Keep the committed viewport visible while a source generation prepares off
 * screen. Only a completed numerical build and GPU finish authorize the swap.
 * Failed candidates leave the old frame and an error; the old source digest
 * prevents HTTP capture of it as new work. Iframe removal releases its worker
 * and WebGL context, including all scene residents.
 */
import type { HumanViewerHandle } from "./HumanViewerHandle";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress";

type Child = Window & { __humanViewer: HumanViewerHandle };
let active: HTMLIFrameElement | undefined;
let candidate: HTMLIFrameElement | undefined;
let generation = 0;
const error = document.querySelector<HTMLDivElement>("#error")!;
const showError = (message: string): void => {
  error.textContent = message;
  error.style.display = "block";
};
function prepare(): void {
  const ticket = ++generation;
  candidate?.remove();
  const frame = document.createElement("iframe");
  frame.title = "Human GPU viewport";
  frame.style.position = "absolute";
  frame.style.visibility = "hidden";
  frame.src =
    "/scene.html?generation=" +
    ticket +
    "#" +
    serializeHumanViewerAddress(parseHumanViewerAddress(location.hash));
  candidate = frame;
  document.body.append(frame);
}
addEventListener(
  "message",
  (
    event: MessageEvent<{ type?: string; error?: string; address?: string }>,
  ) => {
    if (event.origin !== location.origin) return;
    if (
      event.source === active?.contentWindow &&
      event.data.type === "human:address" &&
      event.data.address !== undefined
    ) {
      history.replaceState(null, "", "#" + event.data.address);
      return;
    }
    if (candidate === undefined || event.source !== candidate.contentWindow)
      return;
    if (event.data.type === "human:error") {
      showError(event.data.error ?? "Source generation failed");
      candidate.remove();
      candidate = undefined;
      return;
    }
    if (event.data.type !== "human:ready") return;
    active?.remove();
    active = candidate;
    candidate = undefined;
    active.style.position = "";
    active.style.visibility = "visible";
    error.style.display = "none";
    const viewer = (): HumanViewerHandle =>
      (active!.contentWindow as Child).__humanViewer;
    const handle: HumanViewerHandle = {
      show: async (address) => {
        await viewer().show(address);
        history.replaceState(
          null,
          "",
          "#" + serializeHumanViewerAddress(address),
        );
      },
      parts: () => viewer().parts(),
      renderer: () => viewer().renderer(),
      revision: () => viewer().revision(),
      builds: () => viewer().builds(),
      buildMs: () => viewer().buildMs(),
      address: () => viewer().address(),
      png: () => viewer().png(),
    };
    Object.assign(window, { __humanViewer: handle });
    console.log("HUMAN_READY " + handle.revision());
  },
);
addEventListener("hashchange", () => {
  if (active === undefined) return;
  void (active.contentWindow as Child).__humanViewer
    .show(parseHumanViewerAddress(location.hash))
    .catch((failure: unknown) => showError(String(failure)));
});
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.on("human:revision", prepare);
  import.meta.hot.on("vite:error", (failure) => {
    showError(failure.err.message);
  });
}
prepare();
