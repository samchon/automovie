import type { IHumanViewerReferenceInfo } from "@automovie/viewer/human/inspection/IHumanViewerReferenceInfo";
import type { HumanViewerHandle } from "@automovie/viewer/human/inspection/HumanViewerHandle";
/**
 * Keep the committed viewport visible while a source generation prepares off screen. Interactive swaps require a completed model and GPU finish; the resident service initially publishes a checked empty bridge, then restores only a previously successful display before replacing its source generation. Failed source candidates leave the old frame; a failed selected-document restore publishes a checked empty bridge with that document's cause. The old source digest prevents HTTP capture of it as new work.
 *
 * Iframe removal withdraws that browser realm. Child owners carry worker and WebGL cleanup responsibilities; removal provides no acknowledgment of physical OS/GPU release. The page hash holds the display address, which the controls above the viewport show and change.
 */
import type { HumanViewerAddress } from "@automovie/viewer/human/inspection/HumanViewerAddress";
import type { HumanViewerCatalogue } from "@automovie/viewer/human/inspection/HumanViewerCatalogue";
import type { IHumanViewerCandidateHold } from "./IHumanViewerCandidateHold";
import type { IHumanViewerFrameMessage } from "./IHumanViewerFrameMessage";
import type { IHumanViewerWindow } from "@automovie/viewer/human/inspection/IHumanViewerWindow";
import { createAutoMovieResourceRetirement } from "@automovie/viewer";
import { createHumanViewerGeneration } from "./createHumanViewerGeneration";
import { createHumanViewerHostAdmission } from "./createHumanViewerHostAdmission";
import { createHumanViewerHostHandle } from "./createHumanViewerHostHandle";
import { createHumanViewerHostProgress } from "./createHumanViewerHostProgress";
import { loadHumanViewerReferenceInfo } from "./loadHumanViewerReferenceInfo";
import { mountHumanViewerControls } from "./mountHumanViewerControls";
import { openHumanViewerCandidateHold } from "./openHumanViewerCandidateHold";
import { parseHumanViewerAddress } from "@automovie/viewer/human/inspection/parseHumanViewerAddress";
import { serializeHumanViewerAddress } from "@automovie/viewer/human/inspection/serializeHumanViewerAddress";
import { humanViewerDefaultDocument } from "../examples/humanViewerDefaultDocument.js";

type Child = Window & IHumanViewerWindow;
let closed: boolean = false;
const listeners: AbortController = new AbortController();
const pendingHolds: Set<Promise<void>> = new Set();
let active: HTMLIFrameElement | undefined;
let candidate: HTMLIFrameElement | undefined;
/** A source change arrived while a candidate was still preparing. */
let again: boolean = false;
let committed: ReturnType<typeof createHumanViewerGeneration> | undefined;
let generation: number = 0;
/** Only an address whose display completed; failed hash navigation is not replayed. */
let displayedAddress: string | undefined;
/** Each browser tab owns one latest-image slot across its source generations. */
const displaySession: `${string}-${string}-${string}-${string}-${string}` = crypto.randomUUID();
// The server's admissions reach the newest loaded viewer frame through this
// bridge, which exists from now on, with or without a committed generation.
Object.assign(window, {
  __humanViewerAdmission: createHumanViewerHostAdmission((): (HTMLIFrameElement | undefined)[] => [
    candidate,
    active,
  ]),
});
const stage: HTMLElement = document.querySelector<HTMLElement>("#stage")!;
const error: HTMLDivElement = document.querySelector<HTMLDivElement>("#error")!;
const progress: HTMLElement = document.querySelector<HTMLElement>("#progress")!;
const { begin, settle }: ReturnType<typeof createHumanViewerHostProgress> = createHumanViewerHostProgress(progress);
let goodAt: string = "";
/** Source failures survive a successful display from the retained generation. */
let sourceError: string | undefined;
let displayError: string | undefined;
let sourceNotice: boolean = false;
const renderMessages: () => void = (): void => {
  if (closed) return;
  const message: string | undefined = displayError ?? sourceError;
  error.textContent = message ?? "";
  error.style.display = message === undefined ? "none" : "block";
  banner.hidden = sourceError === undefined && displayError === undefined && !sourceNotice;
  if (sourceError !== undefined)
    banner.textContent = (active === undefined
      ? "Source error; no model has completed. Click to try again. "
      : `Source error; still showing the last good build${goodAt === "" ? "" : " from " + goodAt}. Click to try again. `) + sourceError.slice(0, 300);
  else if (displayError !== undefined)
    banner.textContent = "Display error; the last completed model is retained. " + displayError.slice(0, 300);
  else banner.textContent = "The source changed. Click to redraw with the same address.";
};
const showError: (message: string, scope?: "source" | "display") => void = (message: string, scope: "source" | "display" = "source"): void => {
  settle();
  if (scope === "source") sourceError = message;
  else displayError = message;
  console.log((scope === "source" ? "HUMAN_ERROR " : "HUMAN_DISPLAY_ERROR ") + message.slice(0, 500));
  renderMessages();
};
const recoveredDisplay: () => void = (): void => {
  if (displayError === undefined) return;
  displayError = undefined;
  console.log("HUMAN_DISPLAY_RECOVERED");
  renderMessages();
};
let navigationVersion: number = 0;
const controls: { navigate: (address: HumanViewerAddress) => void; catalogue: (catalogue: HumanViewerCatalogue) => void; show: (address: HumanViewerAddress, parts: readonly string[]) => void; photo: (info: Pick<IHumanViewerReferenceInfo, "available" | "camera">) => void; close: () => void; } = mountHumanViewerControls({
  navigate: async (address: HumanViewerAddress): Promise<void> => {
    if (closed) throw new Error("The viewer host is closed.");
    const version: number = ++navigationVersion;
    const owner: { handle: HumanViewerHandle; retire: () => void; } | undefined = committed;
    if (owner === undefined) throw new Error("No completed viewport can accept navigation.");
    begin(address.doc);
    try {
      await owner.handle.show(address);
      if (version !== navigationVersion || owner !== committed) return;
      const observed: HumanViewerAddress = owner.handle.address();
      displayedAddress = serializeHumanViewerAddress(observed);
      history.replaceState(null, "", "#" + displayedAddress);
      controls.show(observed, owner.handle.parts());
      settle();
      recoveredDisplay();
    } catch (failure) {
      if (version === navigationVersion && owner === committed) {
        controls.show(owner.handle.address(), owner.handle.parts());
        showError(String(failure), "display");
      }
      throw failure;
    }
  },
});
/** Withdraw old photo authority, then apply metadata only to the same displayed generation/document. */
const loadPhoto: (doc: string) => Promise<void> = async (doc: string): Promise<void> => {
  const owner: ReturnType<typeof createHumanViewerGeneration> | undefined = committed;
  const frame: HTMLIFrameElement | undefined = active;
  if (closed || owner === undefined || owner.handle.address().doc !== doc) return;
  controls.photo({ available: false, camera: null });
  const info: IHumanViewerReferenceInfo = await loadHumanViewerReferenceInfo(doc);
  if (closed || owner !== committed || frame !== active || owner.handle.address().doc !== doc) return;
  controls.photo(info);
};
/** An uncancelled catalogue fetch may settle late but cannot repaint a retired generation. */
const refreshCatalogue: (owner: ReturnType<typeof createHumanViewerGeneration>) => Promise<void> = async (owner: ReturnType<typeof createHumanViewerGeneration>): Promise<void> => {
  const catalogue: HumanViewerCatalogue = (await (await fetch("/docs")).json()) as HumanViewerCatalogue;
  if (!closed && owner === committed) controls.catalogue(catalogue);
};
const banner: HTMLElement = document.querySelector<HTMLElement>("#banner")!;
const auto: HTMLInputElement = document.querySelector<HTMLInputElement>("#auto")!;
let quiet: ReturnType<typeof setTimeout> | undefined;
/**
 * The source changed while the page is open. Nothing is reloaded: a banner
 * offers a redraw that keeps the address, and with the option on the redraw
 * happens by itself once edits have been quiet for twenty seconds.
 */
const resident: boolean = new URLSearchParams(location.search).has("resident");
function changedSource(): void {
  if (closed) return;
  sourceNotice = true;
  sourceError = undefined;
  // The server's own page has no one to ask: it redraws at once.
  if (resident) return prepare();
  renderMessages();
  clearTimeout(quiet);
  if (auto.checked) quiet = setTimeout(prepare, 20000);
}
banner.addEventListener("click", (): void => prepare(), { signal: listeners.signal });
/**
 * Start a candidate generation. A candidate already preparing is never
 * discarded: it finishes, ready or failed, and one more candidate follows if
 * the source changed meanwhile. Discarding it on every edit meant that edits
 * arriving faster than one compile and build kept the page from ever drawing
 * a generation; now each candidate completes, and one that is already behind
 * the source is published as stale, which the server reports.
 */
function prepare(): void {
  if (closed) return;
  clearTimeout(quiet);
  banner.hidden = true;
  if (candidate !== undefined) {
    again = true;
    return;
  }
  const ticket: number = ++generation;
  const frame: HTMLIFrameElement = document.createElement("iframe");
  frame.title = "Human GPU viewport";
  frame.style.visibility = "hidden";
  let address: string = "";
  const restore: boolean = displayedAddress !== undefined;
  try {
    address = serializeHumanViewerAddress(
      parseHumanViewerAddress(restore ? displayedAddress! : location.hash, humanViewerDefaultDocument),
    );
  } catch (failure) {
    showError(String(failure));
    return;
  }
  begin("the page");
  candidate = frame;
  // The page is opened only once its hold is open, so compile withdrawal is
  // held for every module it and its worker request.
  const opening: Promise<void> = openHumanViewerCandidateHold()
    .then(async (hold: IHumanViewerCandidateHold): Promise<void> => {
      if (closed || candidate !== frame) {
        await hold.release();
        return;
      }
      holds.set(frame, hold);
      frame.src =
        "/scene.html?" +
        new URLSearchParams({ generation: String(ticket), token: hold.token }) +
        (restore ? "&restore=1" : "") +
        "#" +
        address;
      stage.append(frame);
    })
    .catch((failure: unknown): void => {
      if (closed) throw failure;
      if (candidate === frame) candidate = undefined;
      showError("The generation hold could not be opened: " + String(failure));
      followUp();
    });
  pendingHolds.add(opening);
  void opening.finally((): void => { pendingHolds.delete(opening); }).catch((failure: unknown): void => {
    console.error("HUMAN_RETIREMENT_ERROR", failure);
  });
}
/** The hold of each candidate frame, released once it loaded or ended. */
const holds: Map<HTMLIFrameElement, IHumanViewerCandidateHold> = new Map<HTMLIFrameElement, IHumanViewerCandidateHold>();
/** Release a frame's hold and resolve with the label its window received. */
const releaseHold: (frame: HTMLIFrameElement) => Promise<string | null> = (frame: HTMLIFrameElement): Promise<string | null> => {
  const hold: IHumanViewerCandidateHold | undefined = holds.get(frame);
  return hold === undefined ? Promise.resolve(null) : hold.release();
};
/** Start the candidate a source change asked for while another was preparing. */
function followUp(): void {
  if (closed) return;
  if (!again) return;
  again = false;
  prepare();
}
addEventListener("message", (event: MessageEvent<IHumanViewerFrameMessage>): void => {
  if (closed) return;
  if (event.origin !== location.origin) return;
  if (event.source === active?.contentWindow && event.data.type === "human:error") {
    showError(event.data.error ?? "The active viewport failed.", "display");
    return;
  }
  if (
    event.data.type === "human:admission" &&
    (event.source === candidate?.contentWindow ||
      event.source === active?.contentWindow)
  ) {
    // A frame can now judge documents: the server asks again for those waiting.
    console.log("HUMAN_ADMISSION");
    return;
  }
  if (
    event.source === active?.contentWindow &&
    event.data.type === "human:address" &&
    event.data.address !== undefined
  ) {
    // The message can arrive after a newer queued show finished. Read the
    // committed viewport's actual state instead of replaying an older notice.
    const handle: HumanViewerHandle = (active!.contentWindow as Child).__humanViewer;
    const shown: HumanViewerAddress = handle.address();
    const observed: string = serializeHumanViewerAddress(shown);
    if (candidate !== undefined && displayedAddress !== observed)
      again = true;
    displayedAddress = observed;
    history.replaceState(null, "", "#" + observed);
    settle();
    recoveredDisplay();
    controls.show(shown, handle.parts());
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
      // The candidate observed mixed compiles or its checked Node inputs
      // changed during loading. A fresh candidate reads the current source;
      // an unchanged source failure never requests this replacement.
      console.log("HUMAN_RESTART " + (event.data.error ?? "").slice(0, 300));
      again = true;
    } else showError(event.data.error ?? "Source generation failed");
    followUp();
    return;
  }
  if (event.data.type !== "human:ready") return;
  const ready: HTMLIFrameElement = candidate;
  if (event.data.restoreError !== undefined && active !== undefined) {
    void releaseHold(ready);
    holds.delete(ready);
    ready.remove();
    candidate = undefined;
    showError(event.data.restoreError);
    followUp();
    return;
  }
  const restored: boolean = new URLSearchParams(ready.contentWindow!.location.search).get("restore") === "1";
  const attempted: string = serializeHumanViewerAddress(
    parseHumanViewerAddress(ready.contentWindow!.location.hash),
  );
  // A successful selection made while this candidate prepared owns the
  // screen. Keep that committed frame until its replacement finishes.
  if (restored && displayedAddress !== attempted) {
    void releaseHold(ready);
    holds.delete(ready);
    ready.remove();
    candidate = undefined;
    again = true;
    followUp();
    return;
  }
  if (event.data.restoreError !== undefined) {
    if (displayedAddress === attempted) displayedAddress = undefined;
  } else if (event.data.address !== undefined &&
      (!restored || displayedAddress === attempted)) {
    displayedAddress = event.data.address;
    history.replaceState(null, "", "#" + event.data.address);
  }
  const label: Promise<string | null> = releaseHold(ready);
  if (active !== undefined) holds.delete(active);
  committed?.retire();
  active?.remove();
  active = candidate;
  candidate = undefined;
  active.style.visibility = "visible";
  if (!resident) active.contentWindow!.postMessage({ type: "human:committed", session: displaySession, generation }, location.origin);
  goodAt = new Date().toLocaleTimeString();
  sourceNotice = false;
  sourceError = undefined;
  recoveredDisplay();
  renderMessages();
  settle();
  committed = createHumanViewerGeneration(
    (active.contentWindow as Child).__humanViewer,
  );
  const owner: ReturnType<typeof createHumanViewerGeneration> = committed;
  const handle: HumanViewerHandle = createHumanViewerHostHandle(committed.handle);
  Object.assign(window, { __humanViewer: handle });
  // The revision this generation's code is, as its window proved it, or
  // "-" when it is not proven (the server then reports its frames stale).
  void label.then((proven: string | null): void =>
    console.log("HUMAN_READY " + handle.revision() + " " + (proven ?? "-")),
  );
  if (event.data.restoreError !== undefined) {
    settle();
    error.textContent = event.data.restoreError;
    error.style.display = "block";
    console.log("HUMAN_RESTORE_FAILED " + event.data.restoreError);
  }
  followUp();
  void refreshCatalogue(owner)
    .then((): Promise<void> | undefined => {
      if (closed || owner !== committed || resident) return;
      controls.show(handle.address(), handle.parts());
      return loadPhoto(handle.address().doc);
    })
    .catch((failure: unknown): void => { if (!closed && owner === committed) showError(String(failure)); });
}, { signal: listeners.signal });
addEventListener("hashchange", (event: HashChangeEvent): void => {
  if (active === undefined) return;
  try {
    // Consecutive hash events each retain their own requested address.
    const address: HumanViewerAddress = parseHumanViewerAddress(new URL(event.newURL).hash);
    controls.navigate(address);
  } catch (failure) {
    showError(String(failure), "display");
  }
}, { signal: listeners.signal });
const sourceEvents: EventSource = new EventSource("/source-events");
let sourceRevision: string | undefined;
sourceEvents.addEventListener("message", (event: MessageEvent<string>): void => {
  if (closed) return;
  const current: string = (JSON.parse(event.data) as { revision: string }).revision;
  if (current === sourceRevision) return;
  const changed: boolean = sourceRevision !== undefined;
  sourceRevision = current;
  if ((active !== undefined && committed?.handle.revision() !== current) ||
      (active === undefined && changed))
    changedSource();
}, { signal: listeners.signal });
addEventListener("pagehide", (event: PageTransitionEvent): void => {
  if (event.persisted || closed) return;
  closed = true;
  ++navigationVersion;
  ++generation;
  again = false;
  clearTimeout(quiet);
  const frames: HTMLIFrameElement[] = [active, candidate].filter((frame: HTMLIFrameElement | undefined): frame is HTMLIFrameElement => frame !== undefined);
  const owner: ReturnType<typeof createHumanViewerGeneration> | undefined = committed;
  active = undefined;
  candidate = undefined;
  committed = undefined;
  const close: () => Promise<void> = createAutoMovieResourceRetirement([
    (): void => listeners.abort(),
    (): void => controls.close(),
    (): void => settle(),
    (): void => sourceEvents.close(),
    (): void => owner?.retire(),
    ...frames.map((frame: HTMLIFrameElement): () => void => (): void => frame.remove()),
    ...[...holds.values()].map((hold: IHumanViewerCandidateHold): () => Promise<void> => async (): Promise<void> => { await hold.release(); }),
    ...[...pendingHolds].map((opening: Promise<void>): () => Promise<void> => (): Promise<void> => opening),
  ]);
  void close().finally((): void => { holds.clear(); }).catch((failure: unknown): void => {
    console.error("HUMAN_RETIREMENT_ERROR", failure);
  });
});
prepare();
