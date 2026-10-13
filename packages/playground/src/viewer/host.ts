import type {} from "./IPlaygroundViewerPage";

/** Normal same-origin source replacement retains the live page until admission. */
const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML = '<style>html,body{margin:0;height:100%;background:#18212a;color:#eee;font:13px system-ui}#viewer-notice{position:absolute;z-index:5;top:0;padding:8px;background:#675a20;cursor:pointer}iframe{border:0;width:100%;height:100%;position:absolute;inset:0}</style><button id="viewer-notice" hidden>Source changed. Update with the current document and camera.</button>';
const notice = document.querySelector<HTMLButtonElement>("#viewer-notice")!;
const session = crypto.randomUUID();
let generation = 0;
let active: HTMLIFrameElement | undefined;
let activeToken: string | undefined;
let preparing = false;
let candidateAddress: URL | undefined;
let candidate: HTMLIFrameElement | undefined;
let candidateToken: string | undefined;
let publishing = false;
let actualRevision: string | undefined;
let sourceError: string | undefined;
let displayError: string | undefined;
let transferredState: unknown;
let release: (() => void) | undefined;
let sourceRevision = document.querySelector<HTMLMetaElement>('meta[name="automovie-viewer-source"]')?.content;
let noticeKind: "display" | "other" = "other";
const message = (text: string, kind: "display" | "other" = "other"): void => {
  noticeKind = kind;
  notice.textContent = text;
  notice.hidden = false;
};
const retain = (text: string): void => {
  candidate?.remove();
  candidate = undefined;
  publishing = false;
  const resume = release;
  release = undefined;
  try { resume?.(); }
  finally {
    if (active !== undefined) { active.inert = false; active.style.pointerEvents = ""; }
    message(text);
  }
};
const prepare = async (requested = location.href): Promise<void> => {
  if (candidate !== undefined || preparing) return;
  preparing = true;
  try {
  const current: unknown = await (await fetch("/viewer/source", { cache: "no-store" })).json();
  if (current === null || typeof current !== "object" || typeof Reflect.get(current, "revision") !== "string" ||
      (Reflect.get(current, "error") !== null && Reflect.get(current, "error") !== undefined)) {
    message("Source unavailable; the current page is retained. " + String(current !== null && typeof current === "object" ? Reflect.get(current, "error") : current));
    return;
  }
  sourceRevision = Reflect.get(current, "revision");
  sourceError = undefined;
  if (active !== undefined) {
    release = active.contentWindow?.__playgroundViewerPage?.freeze();
    active.inert = true;
    active.style.pointerEvents = "none";
  }
  candidateToken = crypto.randomUUID();
  const next = document.createElement("iframe");
  next.title = "Interactive viewer";
  next.style.visibility = "hidden";
  const token = candidateToken;
  const expectedRevision = sourceRevision;
  next.addEventListener("error", () => {
    if (candidate === next) retain("The candidate document could not load; the current page is retained.");
  });
  next.addEventListener("load", () => {
    if (candidate !== next || candidateToken !== token) return;
    try {
      const document = next.contentDocument;
      const loadedRevision = document?.querySelector<HTMLMetaElement>('meta[name="automovie-viewer-source"]')?.content;
      if (document === null || document === undefined || document.contentType !== "text/html" || loadedRevision !== expectedRevision)
        retain("The candidate document was refused or has no admitted HTML/source; the current page is retained.");
    } catch (cause) { retain("The candidate document could not be observed: " + String(cause)); }
  });
  const address = new URL(requested, location.href);
  if (address.origin !== location.origin) throw new Error("A source candidate must remain on the owned origin.");
  for (const key of ["__viewer_page", "__viewer_revision", "__viewer_generation"]) address.searchParams.delete(key);
  candidateAddress = new URL(address);
  address.searchParams.set("__viewer_page", candidateToken);
  address.searchParams.set("__viewer_revision", sourceRevision!);
  address.searchParams.set("__viewer_generation", String(++generation));
  next.src = address.href;
  candidate = next;
  app.append(next);
  } finally { preparing = false; }
};
notice.addEventListener("click", () => { void prepare().catch((error: unknown) => retain(String(error))); });
addEventListener("message", (event: MessageEvent<unknown>) => {
  if (event.origin === location.origin && event.source === active?.contentWindow && event.data !== null && typeof event.data === "object" &&
      Reflect.get(event.data, "token") === activeToken && Reflect.get(event.data, "type") === "automovie:display-error") {
    displayError = String(Reflect.get(event.data, "error"));
    message(displayError, "display"); return;
  }
  if (event.origin === location.origin && event.source === active?.contentWindow && event.data !== null && typeof event.data === "object" &&
      Reflect.get(event.data, "token") === activeToken && Reflect.get(event.data, "type") === "automovie:display-restored") {
    displayError = undefined;
    if (sourceError !== undefined) message("Source unavailable; the current page is retained. " + sourceError);
    else if (actualRevision !== sourceRevision) message("Source changed. Update with the current document and camera.");
    else if (noticeKind === "display") notice.hidden = true;
    return;
  }
  if (event.origin === location.origin && event.source === active?.contentWindow && event.data !== null && typeof event.data === "object" &&
      Reflect.get(event.data, "token") === activeToken && Reflect.get(event.data, "type") === "automovie:navigate") {
    const address: unknown = Reflect.get(event.data, "address");
    if (typeof address === "string") void prepare(address).catch((cause: unknown) => retain(String(cause)));
    return;
  }
  if (event.origin !== location.origin || event.source !== candidate?.contentWindow || event.data === null || typeof event.data !== "object") return;
  const data = event.data;
  if (Reflect.get(data, "token") !== candidateToken) return;
  const type = Reflect.get(data, "type");
  if (type === "automovie:initialize") {
    try {
      const state = active?.contentWindow?.__playgroundViewerPage?.capture();
      transferredState = structuredClone(state);
      candidate!.contentWindow!.postMessage({ type: "automovie:state", token: candidateToken, state }, location.origin);
    }
    catch (cause) { retain("The current page could not transfer its validated state: " + String(cause)); return; }
  } else if (type === "automovie:error") {
    retain("The source candidate failed; the current page is retained. " + String(Reflect.get(data, "error")));
  } else if (type === "automovie:ready" && !publishing) {
    if (Reflect.get(data, "revision") !== sourceRevision || sourceError !== undefined) {
      retain("Source changed during preparation; the current page is retained."); return;
    }
    try {
      if (active !== undefined && JSON.stringify(active.contentWindow?.__playgroundViewerPage?.capture()) !== JSON.stringify(transferredState)) {
        retain("The validated input/view changed during preparation; the current page is retained. Update again when it settles.");
        return;
      }
    } catch (cause) { retain("The current page could not confirm its state: " + String(cause)); return; }
    // Keep the previous live frame until the visible candidate completes its
    // original draw. A failed publication removes only that candidate.
    publishing = true;
    candidate!.style.visibility = "visible";
    candidate!.contentWindow!.postMessage({ type: "automovie:committed", token: candidateToken, session, generation }, location.origin);
  } else if (type === "automovie:published" && publishing) {
    if (Reflect.get(data, "revision") !== sourceRevision || sourceError !== undefined) {
      retain("Source changed during publication; the current page is retained."); return;
    }
    const previous = active;
    active = candidate!;
    activeToken = candidateToken;
    candidate = undefined;
    publishing = false;
    actualRevision = Reflect.get(data, "revision");
    active.contentWindow!.postMessage({ type: "automovie:activated", token: activeToken }, location.origin);
    previous?.remove();
    release = undefined;
    if (candidateAddress !== undefined) history.replaceState(null, "", candidateAddress.href);
    displayError = undefined;
    notice.hidden = true;
  }
});
const events = new EventSource("/viewer/source-events");
events.addEventListener("message", () => {
  void fetch("/viewer/source", { cache: "no-store" }).then((response) => response.json()).then((current: unknown) => {
    if (current === null || typeof current !== "object") throw new Error("No current source receipt.");
    if (Reflect.get(current, "error") !== null && Reflect.get(current, "error") !== undefined) {
      sourceError = String(Reflect.get(current, "error"));
      message("Source unavailable; the current page is retained. " + sourceError); return;
    }
    sourceError = undefined;
    sourceRevision = Reflect.get(current, "revision");
    if (active !== undefined && actualRevision !== sourceRevision) message("Source changed. Update with the current document and camera.");
    else if (displayError !== undefined) message(displayError, "display");
  }).catch((error: unknown) => message(String(error)));
});
addEventListener("pagehide", () => events.close(), { once: true });
void prepare().catch((error: unknown) => retain(String(error)));
