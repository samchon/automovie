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
import { createHumanViewerGeneration } from "./createHumanViewerGeneration";

type Child = Window & { __humanViewer: HumanViewerHandle };
let active: HTMLIFrameElement | undefined;
let candidate: HTMLIFrameElement | undefined;
let committed: ReturnType<typeof createHumanViewerGeneration> | undefined;
let generation = 0;
const stage = document.querySelector<HTMLElement>("#stage")!;
const error = document.querySelector<HTMLDivElement>("#error")!;
const progress = document.querySelector<HTMLElement>("#progress")!;
let waiting: ReturnType<typeof setInterval> | undefined;
/** Say what is being built, for how long, and how busy the server is. */
const begin = (what: string): void => {
  const started = Date.now();
  clearInterval(waiting);
  const draw = async (): Promise<void> => {
    const seconds = Math.round((Date.now() - started) / 1000);
    let busy = "";
    try {
      const health = (await (await fetch("/health")).json()) as {
        queue: { waiting: Record<string, number> };
      };
      const count = Object.values(health.queue.waiting).reduce((a, b) => a + b, 0);
      busy = count === 0 ? "" : `, server queue ${count}`;
    } catch {
      busy = ", server not answering";
    }
    progress.textContent = `building ${what}... ${seconds} s${busy}`;
  };
  void draw();
  waiting = setInterval(() => void draw(), 1000);
};
const settle = (): void => {
  clearInterval(waiting);
  progress.textContent = "";
};
let goodAt = "";
const showError = (message: string): void => {
  settle();
  console.log("HUMAN_ERROR " + message.slice(0, 500));
  if (active !== undefined) {
    banner.hidden = false;
    banner.textContent =
      `Source error; still showing the last good build${goodAt === "" ? "" : " from " + goodAt}. Click to try again. ` +
      message.slice(0, 300);
  }
  error.textContent = message;
  error.style.display = "block";
};
const controls = mountHumanViewerControls({
  navigate: (address: HumanViewerAddress) => {
    location.hash = serializeHumanViewerAddress(address);
  },
});
/** Ask whether a local photograph exists for the displayed document. */
const loadPhoto = async (doc: string): Promise<void> => {
  try {
    controls.photo(
      (await (
        await fetch("/reference-info?" + new URLSearchParams({ doc }))
      ).json()) as Parameters<typeof controls.photo>[0],
    );
  } catch {
    controls.photo({ available: false, camera: null });
  }
};
const refreshCatalogue = async (): Promise<void> => {
  controls.catalogue(
    (await (await fetch("/docs")).json()) as HumanViewerCatalogue,
  );
};
const banner = document.querySelector<HTMLElement>("#banner")!;
const auto = document.querySelector<HTMLInputElement>("#auto")!;
let quiet: ReturnType<typeof setTimeout> | undefined;
/**
 * The source changed while the page is open. Nothing is reloaded: a banner
 * offers a redraw that keeps the address, and with the option on the redraw
 * happens by itself once edits have been quiet for twenty seconds.
 */
const resident = new URLSearchParams(location.search).has("resident");
function changedSource(): void {
  // The server's own page has no one to ask: it redraws at once.
  if (resident) return prepare();
  banner.hidden = false;
  clearTimeout(quiet);
  if (auto.checked) quiet = setTimeout(prepare, 20000);
}
banner.addEventListener("click", () => prepare());
function prepare(): void {
  clearTimeout(quiet);
  banner.hidden = true;
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
  begin("the page");
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
      settle();
      error.style.display = "none";
      const shown = parseHumanViewerAddress(event.data.address);
      controls.show(shown, event.data.parts ?? []);
      void loadPhoto(shown.doc);
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
    committed?.retire();
    active?.remove();
    active = candidate;
    candidate = undefined;
    active.style.visibility = "visible";
    goodAt = new Date().toLocaleTimeString();
    banner.hidden = true;
    banner.textContent = "The source changed. Click to redraw with the same address.";
    settle();
    error.style.display = "none";
    committed = createHumanViewerGeneration((active.contentWindow as Child).__humanViewer);
    const viewer = committed.handle;
    const handle: HumanViewerHandle = {
      show: async (address) => {
        await viewer.show(address);
        history.replaceState(
          null,
          "",
          "#" + serializeHumanViewerAddress(address),
        );
      },
      parts: () => viewer.parts(),
      renderer: () => viewer.renderer(),
      revision: () => viewer.revision(),
      builds: () => viewer.builds(),
      buildMs: () => viewer.buildMs(),
      spans: () => viewer.spans(),
      address: () => viewer.address(),
      png: () => viewer.png(),
    };
    Object.assign(window, { __humanViewer: handle });
    console.log("HUMAN_READY " + handle.revision());
    void refreshCatalogue()
      .then(() => {
        controls.show(handle.address(), handle.parts());
        return loadPhoto(handle.address().doc);
      })
      .catch((failure: unknown) => showError(String(failure)));
  },
);
addEventListener("hashchange", () => {
  if (active === undefined) return;
  try {
    const address = parseHumanViewerAddress(location.hash);
    begin(address.doc);
    void (active.contentWindow as Child).__humanViewer
      .show(address)
      .catch((failure: unknown) => showError(String(failure)));
  } catch (failure) {
    showError(String(failure));
  }
});
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.on("human:revision", () => changedSource());
  import.meta.hot.on("vite:error", (failure) => {
    showError(failure.err.message);
  });
}
prepare();
