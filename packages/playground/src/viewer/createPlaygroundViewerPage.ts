import { createViewerDisplaySave, type IAutoMovieViewerCompletedFrame } from "@automovie/viewer";
import { judgeViewerRenderer } from "@automovie/viewer/human/inspection/judgeViewerRenderer";
import { createHumanViewerGpuDisplay } from "@automovie/viewer/human/inspection/createHumanViewerGpuDisplay";
import type { IPlaygroundViewerApplication } from "./IPlaygroundViewerApplication";
import type { IPlaygroundViewerPage } from "./IPlaygroundViewerPage";

/**
 * Observe original product draw completions, restore application-owned typed
 * inputs, and offer a checked candidate to its same-origin parent. Hidden
 * candidates observe but never save before commitment. Only a visible hosted
 * interactive page receives a session; standalone/offline pages are untouched.
 *
 * @evidence contracts/common.md#principled-implementation Actual native frames and a post-load source check precede candidate publication.
 * @evidence contracts/common.md#clear-and-simple-design One page owner joins application transfer, product completion and the shared bounded saver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No DOM event replay, fabricated ready camera, SDK replacement or elapsed-time retry supplies authority.
 * @evidence contracts/common.md#meaningful-documentation Defines restore, publication, source and bitmap commitment boundaries.
 */
export function createPlaygroundViewerPage(): IPlaygroundViewerPage | undefined {
  const parameters = new URLSearchParams(location.search);
  const token = parameters.get("__viewer_page");
  const revision = document.querySelector<HTMLMetaElement>('meta[name="automovie-viewer-source"]')?.content;
  if (token === null || parameters.get("cap") === "1" || parent === window) return undefined;
  const bootstrap: unknown = Reflect.get(window, "__playgroundViewerBootstrap");
  if (bootstrap !== null && typeof bootstrap === "object" && Reflect.get(bootstrap, "failed") === true) return undefined;
  if (!/^[0-9a-f-]{36}$/.test(token) || revision === undefined || parameters.get("__viewer_revision") !== revision)
    throw new Error("The hosted page has no admitted source/token.");
  let application: IPlaygroundViewerApplication | undefined;
  let frame: IAutoMovieViewerCompletedFrame | undefined;
  let canvas: HTMLCanvasElement | undefined;
  let admitted = false;
  let initializing = false;
  let committed = false;
  let publishing = false;
  let publicationCopied = false;
  let commitIdentity: { session: string; generation: number } | undefined;
  let saverCommitted = false;
  let facts: { revision: string; renderer: string; address: object; camera: object } | undefined;
  let saver: ReturnType<typeof createViewerDisplaySave> | undefined;
  let gpuDisplay: ReturnType<typeof createHumanViewerGpuDisplay> | undefined;
  let completedState: { application: unknown; viewport: unknown } | undefined;
  let frameSequence = 0;
  let requiredFrameSequence = 0;
  let lastIdentity = "";
  let lastSavedApplication: string | undefined;
  let transfer: unknown;
  let initialized = false;
  let terminal = false;
  let resumeCandidate: (() => void) | undefined;
  let frameWaiter: { resolve: () => void; reject: (cause: unknown) => void } | undefined;
  const announce = (type: string, extra: object = {}): void =>
    parent.postMessage({ type, token, revision, ...extra }, location.origin);
  const capture = () => ({
    application: application?.capture(), viewport: frame?.control?.capture(),
  });
  const readTransfer = (name: string): unknown => transfer !== null && typeof transfer === "object"
    ? Reflect.get(transfer, name) : undefined;
  const hasFrame = (): boolean => {
    const models: unknown = facts === undefined ? undefined : Reflect.get(facts.address, "models");
    return facts !== undefined && (application === undefined ||
      JSON.stringify(Reflect.get(facts.address, "document")) === JSON.stringify(application.capture())) &&
      frameSequence >= requiredFrameSequence &&
      JSON.stringify(completedState?.viewport) === JSON.stringify(frame?.control?.capture()) &&
      (application?.empty === true || (Array.isArray(models) && models.length > 0));
  };
  const fail = (cause: unknown): void => {
    if (terminal) return;
    terminal = true;
    frameWaiter?.reject(cause);
    frameWaiter = undefined;
    announce("automovie:error", { error: cause instanceof Error ? cause.message : String(cause) });
  };
  const initialize = async (): Promise<void> => {
    if (!initialized || initializing || admitted || terminal || frame === undefined || canvas === undefined) return;
    if (frame.requiresApplication === true && application === undefined) return;
    if (application === undefined && frame.control === undefined) return;
    initializing = true;
    try {
      if (application !== undefined) {
        await application.ready;
        const input = readTransfer("application");
        if (input !== undefined) await application.restore(input);
        if (application.capture() === undefined && !application.empty)
          throw new Error("No validated application document completed.");
      }
      const viewport = readTransfer("viewport");
      resumeCandidate = frame.control?.freeze?.();
      requiredFrameSequence = frameSequence + 1;
      if (viewport !== undefined) {
        if (frame.control === undefined) throw new Error("The product has no viewport transfer capability.");
        frame.control.restore(viewport);
        application?.reflectView?.(viewport);
      } else {
        if (frame.control?.redraw === undefined) throw new Error("The product has no original completed-frame redraw capability.");
        frame.control.redraw();
      }
      if (!hasFrame()) await new Promise<undefined>((resolve, reject) => { frameWaiter = { resolve: () => resolve(undefined), reject }; });
      if (terminal) return;
      if (viewport !== undefined && JSON.stringify(completedState?.viewport) !== JSON.stringify(viewport))
        throw new Error("The completed producer did not preserve the transferred viewport; the prior display must be retained.");
      const current: unknown = await (await fetch("/viewer/source", { cache: "no-store" })).json();
      if (current === null || typeof current !== "object" || Reflect.get(current, "revision") !== revision || (Reflect.get(current, "error") !== null && Reflect.get(current, "error") !== undefined))
        throw new Error("The candidate source changed or failed while its modules loaded.");
      if (bootstrap !== null && typeof bootstrap === "object" && Reflect.get(bootstrap, "failed") === true)
        throw new Error("The original HTML module boundary reported a failure.");
      admitted = true;
      announce("automovie:ready", { facts, state: capture(), empty: application?.empty === true });
    } catch (cause) {
      fail(cause);
    } finally { initializing = false; }
  };
  const observe = (target: HTMLCanvasElement, actual: IAutoMovieViewerCompletedFrame): void => {
    if (terminal) return;
    frame = actual;
    canvas = target;
    void initialize();
    const gl = target.getContext("webgl2") ?? target.getContext("webgl");
    if (gl === null) { fail(new Error("The completed producer has no native WebGL context.")); return; }
    if (gl.isContextLost()) return;
    const nativeError = gl.getError();
    if (nativeError !== gl.NO_ERROR) { fail(new Error("The completed native frame reports WebGL error " + nativeError + ".")); return; }
    const device = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(gl.getParameter(device?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER));
    if (!judgeViewerRenderer(renderer).real) { fail(new Error("The completed frame has no admitted hardware renderer: " + renderer)); return; }
    const models: { id: string; name: string; kind: string }[] = [];
    actual.scene.traverseVisible((object) => {
      if ("isMesh" in object && object.isMesh === true) models.push({ id: object.uuid, name: object.name, kind: object.type });
    });
    const state = capture();
    completedState = structuredClone(state);
    ++frameSequence;
    facts = {
      revision, renderer,
      address: { entry: location.pathname, pass: actual.pass, elapsedSeconds: actual.elapsedSeconds,
        models, document: application?.capture(), frame: actual.facts },
      camera: { type: actual.camera.type, position: actual.camera.position.toArray(),
        quaternion: actual.camera.quaternion.toArray(), worldMatrix: actual.camera.matrixWorld.toArray(),
        projectionMatrix: actual.camera.projectionMatrix.toArray() },
    };
    if (saver === undefined) {
      gpuDisplay = createHumanViewerGpuDisplay({ canvas: target, display: document.body, alignToCanvas: true,
        freeze: () => {
          const wasInert = document.body.inert;
          document.body.inert = true;
          const resume = frame?.control?.freeze?.();
          return () => { resume?.(); document.body.inert = wasInert; };
        },
        failed: (error) => announce("automovie:display-error", { error }),
        recovered: () => announce("automovie:display-restored"),
        redraw: () => {
          const before = frameSequence;
          if (frame?.control === undefined || completedState?.viewport === undefined)
            throw new Error("The producer has no completed viewport to restore.");
          frame.control.restore(completedState.viewport);
          if (frameSequence <= before) throw new Error("The original producer did not complete a hardware frame.");
        } });
      saver = createViewerDisplaySave({ canvas: target, observe: () => facts, retain: gpuDisplay.retain });
    }
    if (hasFrame()) { frameWaiter?.resolve(); frameWaiter = undefined; }
    void initialize();
    const identity = JSON.stringify({ facts, width: target.width, height: target.height, state });
    const applicationIdentity = JSON.stringify(state.application);
    const applicationChanged = applicationIdentity !== lastSavedApplication;
    if (publishing && !document.hidden && target.isConnected && (models.length !== 0 || application?.empty === true)) {
      publicationCopied = saver.prepare();
      if (publicationCopied) {
        lastIdentity = identity;
        lastSavedApplication = applicationIdentity;
      }
    }
    if (committed && !document.hidden && target.isConnected && (models.length !== 0 || application?.empty === true) &&
        (!saverCommitted || applicationChanged || actual.changed !== false) &&
        (actual.changed === true || applicationChanged || identity !== lastIdentity)) {
      let copied = false;
      if (!saverCommitted && commitIdentity !== undefined) {
        saverCommitted = saver.commit(commitIdentity.session, commitIdentity.generation);
        copied = saverCommitted;
      } else copied = saver.changed();
      if (copied) {
        lastIdentity = identity;
        lastSavedApplication = applicationIdentity;
      }
    }
  };
  const subscribed = new Set<HTMLCanvasElement>();
  const subscribe = (): void => {
    for (const target of document.querySelectorAll("canvas")) {
      if (subscribed.has(target)) continue;
      subscribed.add(target);
      target.setAttribute("data-automovie-frame-observer", "on");
      target.addEventListener("automovie:completed-frame", (event) => {
        observe(target, (event as CustomEvent<IAutoMovieViewerCompletedFrame>).detail);
      });
    }
  };
  const mutations = new MutationObserver(subscribe);
  mutations.observe(document.documentElement, { childList: true, subtree: true });
  subscribe();
  addEventListener("message", (event: MessageEvent<unknown>) => {
    if (event.origin !== location.origin || event.source !== parent || event.data === null || typeof event.data !== "object") return;
    const data = event.data;
    if (Reflect.get(data, "token") !== token) return;
    if (Reflect.get(data, "type") === "automovie:state") {
      transfer = Reflect.get(data, "state");
      initialized = true;
      void initialize();
    } else if (Reflect.get(data, "type") === "automovie:committed" && admitted) {
      if (bootstrap !== null && typeof bootstrap === "object" && Reflect.get(bootstrap, "failed") === true) return;
      const session: unknown = Reflect.get(data, "session");
      const generation: unknown = Reflect.get(data, "generation");
      if (typeof session === "string" && typeof generation === "number" && Number.isSafeInteger(generation) && generation > 0) {
        publishing = true;
        commitIdentity = { session, generation };
        // A hidden candidate's native buffer can clear before publication.
        // Reproduce it now that it is visible, through its original owner,
        // so even an idle handled frame snapshots pixels before they clear.
        const before = frameSequence;
        try {
          if (frame?.control?.redraw === undefined) throw new Error("The committed product has no original redraw capability.");
          frame.control.redraw();
          if (frameSequence <= before) throw new Error("The committed producer did not complete its visible redraw.");
          if (!document.hidden && !publicationCopied) throw new Error("The visible completed frame could not be copied for automatic saving.");
          announce("automovie:published");
        } catch (cause) { fail(cause); }
      }
    } else if (Reflect.get(data, "type") === "automovie:activated" && publishing && !terminal) {
      publishing = false;
      committed = true;
      if (publicationCopied && commitIdentity !== undefined && saver !== undefined)
        saverCommitted = saver.commit(commitIdentity.session, commitIdentity.generation);
      resumeCandidate?.(); resumeCandidate = undefined;
    }
  });
  addEventListener("pagehide", () => { mutations.disconnect(); saver?.dispose(); gpuDisplay?.dispose(); }, { once: true });
  announce("automovie:initialize");
  return {
    capture,
    freeze: () => frame?.control?.freeze?.() ?? (() => {}),
    fail,
    navigate: (address) => announce("automovie:navigate", { address }),
    register: (value) => { application = value; void value.ready.catch(fail); void initialize(); },
  };
}
