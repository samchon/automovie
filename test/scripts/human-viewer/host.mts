/**
 * Keep the committed viewport visible while a source generation prepares off
 * screen. Only a completed numerical build and GPU finish authorize the swap.
 * Failed candidates leave the old frame and an error; the old source digest
 * prevents HTTP capture of it as new work. Iframe removal releases its worker
 * and WebGL context, including all scene residents. The page hash holds the
 * display address; the controls above the viewport show it and change it.
 */
import type { HumanViewerAddress } from "./HumanViewerAddress";
import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import type { HumanViewerHandle } from "./HumanViewerHandle";
import { mountHumanViewerControls } from "./mountHumanViewerControls";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress";

type Child = Window & { __humanViewer: HumanViewerHandle };
let active: HTMLIFrameElement | undefined;
let candidate: HTMLIFrameElement | undefined;
let generation = 0;
const stage = document.querySelector<HTMLElement>("#stage")!;
const error = document.querySelector<HTMLDivElement>("#error")!;
const showError = (message: string): void => {
  error.textContent = message;
  error.style.display = "block";
};
const controls = mountHumanViewerControls({
  navigate: (address: HumanViewerAddress) => {
    location.hash = serializeHumanViewerAddress(address);
  },
});
const refreshCatalogue = async (): Promise<void> => {
  controls.catalogue(
    (await (await fetch("/docs")).json()) as HumanViewerCatalogue,
  );
};
function prepare(): void {
  const ticket = ++generation;
  candidate?.remove();
  const frame = document.createElement("iframe");
  frame.title = "Human GPU viewport";
  frame.style.visibility = "hidden";
  let address = "";
  try {
    address = serializeHumanViewerAddress(parseHumanViewerAddress(location.hash));
  } catch (failure) {
    showError(String(failure));
    return;
  }
  frame.src = "/scene.html?generation=" + ticket + "#" + address;
  candidate = frame;
  stage.append(frame);
}
addEventListener(
  "message",
  (
    event: MessageEvent<{
      type?: string;
      error?: string;
      address?: string;
      parts?: string[];
    }>,
  ) => {
    if (event.origin !== location.origin) return;
    if (
      event.source === active?.contentWindow &&
      event.data.type === "human:address" &&
      event.data.address !== undefined
    ) {
      history.replaceState(null, "", "#" + event.data.address);
      error.style.display = "none";
      controls.show(
        parseHumanViewerAddress(event.data.address),
        event.data.parts ?? [],
      );
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
    void refreshCatalogue()
      .then(() => controls.show(handle.address(), handle.parts()))
      .catch((failure: unknown) => showError(String(failure)));
  },
);
addEventListener("hashchange", () => {
  if (active === undefined) return;
  try {
    void (active.contentWindow as Child).__humanViewer
      .show(parseHumanViewerAddress(location.hash))
      .catch((failure: unknown) => showError(String(failure)));
  } catch (failure) {
    showError(String(failure));
  }
});
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.on("human:revision", prepare);
  import.meta.hot.on("vite:error", (failure) => {
    showError(failure.err.message);
  });
}
prepare();
