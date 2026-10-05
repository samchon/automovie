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
import type { IHumanViewerFrameMessage } from "./IHumanViewerFrameMessage";
import type { IHumanViewerWindow } from "./IHumanViewerWindow";
import { mountHumanViewerControls } from "./mountHumanViewerControls";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress";
import { createHumanViewerGeneration } from "./createHumanViewerGeneration";
import { createHumanViewerHostAdmission } from "./createHumanViewerHostAdmission";
import { createHumanViewerHostHandle } from "./createHumanViewerHostHandle";
import type { IHumanViewerCandidateHold } from "./IHumanViewerCandidateHold";
import { openHumanViewerCandidateHold } from "./openHumanViewerCandidateHold";
import { createHumanViewerHostProgress } from "./createHumanViewerHostProgress";
import { loadHumanViewerReferenceInfo } from "./loadHumanViewerReferenceInfo";

type Child = Window & IHumanViewerWindow;
let active: HTMLIFrameElement | undefined;
let candidate: HTMLIFrameElement | undefined;
/** A source change arrived while a candidate was still preparing. */
let again = false;
let committed: ReturnType<typeof createHumanViewerGeneration> | undefined;
let generation = 0;
// The server's admissions reach the newest loaded viewer frame through this
// bridge, which exists from now on, with or without a committed generation.
Object.assign(window, { __humanViewerAdmission: createHumanViewerHostAdmission(() => [candidate, active]) });
const stage = document.querySelector<HTMLElement>("#stage")!;
const error = document.querySelector<HTMLDivElement>("#error")!;
const progress = document.querySelector<HTMLElement>("#progress")!;
const { begin, settle } = createHumanViewerHostProgress(progress);
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
  controls.photo(await loadHumanViewerReferenceInfo(doc));
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
/**
 * Start a candidate generation. A candidate already preparing is never
 * discarded: it finishes, ready or failed, and one more candidate follows if
 * the source changed meanwhile. Discarding it on every edit meant that edits
 * arriving faster than one compile and build kept the page from ever drawing
 * a generation; now each candidate completes, and one that is already behind
 * the source is published as stale, which the server reports.
 */
function prepare(): void {
  clearTimeout(quiet);
  banner.hidden = true;
  if (candidate !== undefined) {
    again = true;
    return;
  }
  const ticket = ++generation;
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
  begin("the page");
  candidate = frame;
  // The page is opened only once its hold is open, so compile withdrawal is
  // held for every module it and its worker request.
  void openHumanViewerCandidateHold().then((hold) => {
    if (candidate !== frame) {
      void hold.release();
      return;
    }
    holds.set(frame, hold);
    frame.src = "/scene.html?" + new URLSearchParams({ generation: String(ticket), token: hold.token }) + "#" + address;
    stage.append(frame);
  }).catch((failure: unknown) => {
    if (candidate === frame) candidate = undefined;
    showError("The generation hold could not be opened: " + String(failure));
  });
}
/** The hold of each candidate frame, released once it loaded or ended. */
const holds = new Map<HTMLIFrameElement, IHumanViewerCandidateHold>();
/** Release a frame's hold and resolve with the label its window received. */
const releaseHold = (frame: HTMLIFrameElement): Promise<string | null> => {
  const hold = holds.get(frame);
  return hold === undefined ? Promise.resolve(null) : hold.release();
};
/** Start the candidate a source change asked for while another was preparing. */
function followUp(): void {
  if (!again) return;
  again = false;
  prepare();
}
addEventListener(
  "message",
  (
    event: MessageEvent<IHumanViewerFrameMessage>,
  ) => {
    if (event.origin !== location.origin) return;
    if (event.data.type === "human:admission" &&
        (event.source === candidate?.contentWindow || event.source === active?.contentWindow)) {
      // A frame can now judge documents: the server asks again for those waiting.
      console.log("HUMAN_ADMISSION");
      return;
    }
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
    if (event.data.type === "human:loaded") {
      void releaseHold(candidate);
      return;
    }
    if (event.data.type === "human:error") {
      void releaseHold(candidate);
      holds.delete(candidate);
      candidate.remove();
      candidate = undefined;
      if (event.data.restart === true) {
        // Its modules came from two compiles; every module served now comes
        // from the newest one, so a fresh candidate loads a single compile.
        console.log("HUMAN_RESTART " + (event.data.error ?? "").slice(0, 300));
        again = true;
      } else showError(event.data.error ?? "Source generation failed");
      followUp();
      return;
    }
    if (event.data.type !== "human:ready") return;
    const ready = candidate;
    const label = releaseHold(ready);
    if (active !== undefined) holds.delete(active);
    committed?.retire();
    active?.remove();
    active = candidate;
    candidate = undefined;
    followUp();
    active.style.visibility = "visible";
    goodAt = new Date().toLocaleTimeString();
    banner.hidden = true;
    banner.textContent = "The source changed. Click to redraw with the same address.";
    settle();
    error.style.display = "none";
    committed = createHumanViewerGeneration((active.contentWindow as Child).__humanViewer);
    const handle = createHumanViewerHostHandle(committed.handle);
    Object.assign(window, { __humanViewer: handle });
    // The revision this generation's code is, as its window proved it, or
    // "-" when it is not proven (the server then reports its frames stale).
    void label.then((proven) => console.log("HUMAN_READY " + handle.revision() + " " + (proven ?? "-")));
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
