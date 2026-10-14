import {
  type IAutoMovieViewerCompletedFrame,
  createViewerDisplaySave,
  reportAutoMovieResourceRetirement,
} from "@automovie/viewer";
import { createHumanViewerGpuDisplay } from "@automovie/viewer/human/inspection/createHumanViewerGpuDisplay";
import { judgeViewerRenderer } from "@automovie/viewer/human/inspection/judgeViewerRenderer";
import type { Object3D } from "three";

import type { IPlaygroundViewerApplication } from "./IPlaygroundViewerApplication";
import type { IPlaygroundViewerPage } from "./IPlaygroundViewerPage";

/**
 * Observe original completed WebGL draws and restore application-owned input/viewport before offering a candidate to the same-origin host. Candidate source revision and token must match, supplied input/view must survive restoration, and a nonempty model (or explicitly empty editor) must complete on an admitted hardware renderer. These checks do not judge anatomy or visual beauty.
 *
 * Hidden candidates do not save before publication. The host makes the candidate visible, its original producer redraws and copies that actual frame, and activation commits the existing display saver. Synchronous copy success is not PNG/network/disk-save completion. Standalone, capture-only and unhosted pages return no bridge.
 *
 * @evidence contracts/common.md#principled-implementation Original capture/restore/freeze/redraw seams supply actual application/view state and completed-frame provenance; same-origin token/revision checks, real-renderer judgment and native WebGL errors refuse unsupported candidate publication.
 * @evidence contracts/common.md#clear-and-simple-design The bridge coordinates existing application, frame producer, GPU recovery display and snapshot saver while the parent retains final source-replacement authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No model health is inferred from readiness or renderer identity, no synthetic frame is saved and failure leaves the prior host page authoritative. Snapshot copying does not certify asynchronous encoding/upload.
 * @evidence contracts/common.md#meaningful-documentation The comment separates restoration/admission, visible original redraw, activation and unverified appearance/IO.
 * @evidence contracts/performance.md#efficient-algorithms Each completion traverses visible scene objects and clones/serializes captured facts/state; bitmap copy/encoding scales with canvas pixels. The original rendering and saver upload remain real costs, and no frame-time improvement is measured.
 * @evidence contracts/performance.md#reuse-equivalent-work One latest completed frame/state and identity gate avoid unchanged saves, staged original pixels are reused for commitment and GPU recovery retains the actual completed bitmap rather than constructing another model.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One initialization, frame waiter, latest frame/state and saver/display pair are owned by this page. Its subscribed-canvas set can grow with every discovered canvas until pagehide; close aborts listeners/source fetch, rejects the waiter, releases candidate suspension and independently disposes both display owners. Saver encode/upload waits retain their documented noncancellable lifetime.
 *
 * @author Samchon
 */
export function createPlaygroundViewerPage():
  | IPlaygroundViewerPage
  | undefined {
  const parameters: URLSearchParams = new URLSearchParams(location.search);
  const token: string | null = parameters.get("__viewer_page");
  const revision: string | undefined = document.querySelector<HTMLMetaElement>(
    'meta[name="automovie-viewer-source"]',
  )?.content;
  if (token === null || parameters.get("cap") === "1" || parent === window)
    return undefined;
  const bootstrap: unknown = Reflect.get(window, "__playgroundViewerBootstrap");
  if (
    bootstrap !== null &&
    typeof bootstrap === "object" &&
    Reflect.get(bootstrap, "failed") === true
  )
    return undefined;
  if (
    !/^[0-9a-f-]{36}$/.test(token) ||
    revision === undefined ||
    parameters.get("__viewer_revision") !== revision
  )
    throw new Error("The hosted page has no admitted source/token.");
  let application: IPlaygroundViewerApplication | undefined;
  let frame: IAutoMovieViewerCompletedFrame | undefined;
  let canvas: HTMLCanvasElement | undefined;
  let admitted: boolean = false;
  let initializing: boolean = false;
  let committed: boolean = false;
  let publishing: boolean = false;
  let publicationCopied: boolean = false;
  let commitIdentity: { session: string; generation: number } | undefined;
  let saverCommitted: boolean = false;
  let facts:
    | { revision: string; renderer: string; address: object; camera: object }
    | undefined;
  let saver: ReturnType<typeof createViewerDisplaySave> | undefined;
  let gpuDisplay: ReturnType<typeof createHumanViewerGpuDisplay> | undefined;
  let completedState: { application: unknown; viewport: unknown } | undefined;
  let frameSequence: number = 0;
  let requiredFrameSequence: number = 0;
  let lastIdentity: string = "";
  let lastSavedApplication: string | undefined;
  let transfer: unknown;
  let initialized: boolean = false;
  let terminal: boolean = false;
  let closed: boolean = false;
  const listeners: AbortController = new AbortController();
  const sourceRead: AbortController = new AbortController();
  let resumeCandidate: (() => void) | undefined;
  let frameWaiter:
    | { resolve: () => void; reject: (cause: unknown) => void }
    | undefined;
  const announce: (type: string, extra?: object) => void = (
    type: string,
    extra: object = {},
  ): void =>
    parent.postMessage({ type, token, revision, ...extra }, location.origin);
  const capture: () => { application: unknown; viewport: unknown } = (): {
    application: unknown;
    viewport: unknown;
  } => ({
    application: application?.capture(),
    viewport: frame?.control?.capture(),
  });
  const readTransfer: (name: string) => unknown = (name: string): unknown =>
    transfer !== null && typeof transfer === "object"
      ? Reflect.get(transfer, name)
      : undefined;
  const hasFrame: () => boolean = (): boolean => {
    const models: unknown =
      facts === undefined ? undefined : Reflect.get(facts.address, "models");
    return (
      facts !== undefined &&
      (application === undefined ||
        JSON.stringify(Reflect.get(facts.address, "document")) ===
          JSON.stringify(application.capture())) &&
      frameSequence >= requiredFrameSequence &&
      JSON.stringify(completedState?.viewport) ===
        JSON.stringify(frame?.control?.capture()) &&
      (application?.empty === true ||
        (Array.isArray(models) && models.length > 0))
    );
  };
  const fail: (cause: unknown) => void = (cause: unknown): void => {
    if (terminal) return;
    terminal = true;
    frameWaiter?.reject(cause);
    frameWaiter = undefined;
    announce("automovie:error", {
      error: cause instanceof Error ? cause.message : String(cause),
    });
  };
  const initialize: () => Promise<void> = async (): Promise<void> => {
    if (
      !initialized ||
      initializing ||
      admitted ||
      terminal ||
      frame === undefined ||
      canvas === undefined
    )
      return;
    if (frame.requiresApplication === true && application === undefined) return;
    if (application === undefined && frame.control === undefined) return;
    initializing = true;
    try {
      if (application !== undefined) {
        await application.ready;
        if (terminal) return;
        const input: unknown = readTransfer("application");
        if (input !== undefined) await application.restore(input);
        if (terminal) return;
        if (application.capture() === undefined && !application.empty)
          throw new Error("No validated application document completed.");
      }
      const viewport: unknown = readTransfer("viewport");
      resumeCandidate = frame.control?.freeze?.();
      requiredFrameSequence = frameSequence + 1;
      if (viewport !== undefined) {
        if (frame.control === undefined)
          throw new Error("The product has no viewport transfer capability.");
        frame.control.restore(viewport);
        application?.reflectView?.(viewport);
      } else {
        if (frame.control?.redraw === undefined)
          throw new Error(
            "The product has no original completed-frame redraw capability.",
          );
        frame.control.redraw();
      }
      if (!hasFrame())
        await new Promise<undefined>(
          (
            resolve: (value: undefined | PromiseLike<undefined>) => void,
            reject: (reason?: unknown) => void,
          ): void => {
            frameWaiter = { resolve: (): void => resolve(undefined), reject };
          },
        );
      if (terminal) return;
      if (
        viewport !== undefined &&
        JSON.stringify(completedState?.viewport) !== JSON.stringify(viewport)
      )
        throw new Error(
          "The completed producer did not preserve the transferred viewport; the prior display must be retained.",
        );
      const current: unknown = await (
        await fetch("/viewer/source", {
          cache: "no-store",
          signal: sourceRead.signal,
        })
      ).json();
      if (terminal) return;
      if (
        current === null ||
        typeof current !== "object" ||
        Reflect.get(current, "revision") !== revision ||
        (Reflect.get(current, "error") !== null &&
          Reflect.get(current, "error") !== undefined)
      )
        throw new Error(
          "The candidate source changed or failed while its modules loaded.",
        );
      if (
        bootstrap !== null &&
        typeof bootstrap === "object" &&
        Reflect.get(bootstrap, "failed") === true
      )
        throw new Error(
          "The original HTML module boundary reported a failure.",
        );
      admitted = true;
      announce("automovie:ready", {
        facts,
        state: capture(),
        empty: application?.empty === true,
      });
    } catch (cause) {
      fail(cause);
    } finally {
      initializing = false;
    }
  };
  const observe: (
    target: HTMLCanvasElement,
    actual: IAutoMovieViewerCompletedFrame,
  ) => void = (
    target: HTMLCanvasElement,
    actual: IAutoMovieViewerCompletedFrame,
  ): void => {
    if (terminal) return;
    frame = actual;
    canvas = target;
    void initialize();
    const gl: WebGL2RenderingContext | WebGLRenderingContext | null =
      target.getContext("webgl2") ?? target.getContext("webgl");
    if (gl === null) {
      fail(new Error("The completed producer has no native WebGL context."));
      return;
    }
    if (gl.isContextLost()) return;
    const nativeError: number = gl.getError();
    if (nativeError !== gl.NO_ERROR) {
      fail(
        new Error(
          "The completed native frame reports WebGL error " + nativeError + ".",
        ),
      );
      return;
    }
    const device: WEBGL_debug_renderer_info | null = gl.getExtension(
      "WEBGL_debug_renderer_info",
    );
    const renderer: string = String(
      gl.getParameter(device?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER),
    );
    if (!judgeViewerRenderer(renderer).real) {
      fail(
        new Error(
          "The completed frame has no admitted hardware renderer: " + renderer,
        ),
      );
      return;
    }
    const models: { id: string; name: string; kind: string }[] = [];
    actual.scene.traverseVisible((object: Object3D): void => {
      if ("isMesh" in object && object.isMesh === true)
        models.push({ id: object.uuid, name: object.name, kind: object.type });
    });
    const state: ReturnType<typeof capture> = capture();
    completedState = structuredClone(state);
    ++frameSequence;
    facts = {
      revision,
      renderer,
      address: {
        entry: location.pathname,
        pass: actual.pass,
        elapsedSeconds: actual.elapsedSeconds,
        models,
        document: application?.capture(),
        frame: actual.facts,
      },
      camera: {
        type: actual.camera.type,
        position: actual.camera.position.toArray(),
        quaternion: actual.camera.quaternion.toArray(),
        worldMatrix: actual.camera.matrixWorld.toArray(),
        projectionMatrix: actual.camera.projectionMatrix.toArray(),
      },
    };
    if (saver === undefined) {
      gpuDisplay = createHumanViewerGpuDisplay({
        canvas: target,
        display: document.body,
        alignToCanvas: true,
        freeze: (): (() => void) => {
          const wasInert: boolean = document.body.inert;
          document.body.inert = true;
          const resume: (() => void) | undefined = frame?.control?.freeze?.();
          return (): void =>
            reportAutoMovieResourceRetirement([
              (): void => resume?.(),
              (): void => {
                document.body.inert = wasInert;
              },
            ]);
        },
        failed: (error: string): void =>
          announce("automovie:display-error", { error }),
        recovered: (): void => announce("automovie:display-restored"),
        redraw: (): void => {
          const before: number = frameSequence;
          if (
            frame?.control === undefined ||
            completedState?.viewport === undefined
          )
            throw new Error(
              "The producer has no completed viewport to restore.",
            );
          frame.control.restore(completedState.viewport);
          if (frameSequence <= before)
            throw new Error(
              "The original producer did not complete a hardware frame.",
            );
        },
      });
      saver = createViewerDisplaySave({
        canvas: target,
        observe: (): typeof facts => facts,
        retain: gpuDisplay.retain,
      });
    }
    if (hasFrame()) {
      frameWaiter?.resolve();
      frameWaiter = undefined;
    }
    void initialize();
    const identity: string = JSON.stringify({
      facts,
      width: target.width,
      height: target.height,
      state,
    });
    const applicationIdentity: string | undefined = JSON.stringify(
      state.application,
    );
    const applicationChanged: boolean =
      applicationIdentity !== lastSavedApplication;
    if (
      publishing &&
      !document.hidden &&
      target.isConnected &&
      (models.length !== 0 || application?.empty === true)
    ) {
      publicationCopied = saver.prepare();
      if (publicationCopied) {
        lastIdentity = identity;
        lastSavedApplication = applicationIdentity;
      }
    }
    if (
      committed &&
      !document.hidden &&
      target.isConnected &&
      (models.length !== 0 || application?.empty === true) &&
      (!saverCommitted || applicationChanged || actual.changed !== false) &&
      (actual.changed === true ||
        applicationChanged ||
        identity !== lastIdentity)
    ) {
      let copied: boolean = false;
      if (!saverCommitted && commitIdentity !== undefined) {
        saverCommitted = saver.commit(
          commitIdentity.session,
          commitIdentity.generation,
        );
        copied = saverCommitted;
      } else copied = saver.changed();
      if (copied) {
        lastIdentity = identity;
        lastSavedApplication = applicationIdentity;
      }
    }
  };
  const subscribed: Set<HTMLCanvasElement> = new Set();
  const subscribe: () => void = (): void => {
    if (closed) return;
    for (const target of document.querySelectorAll("canvas")) {
      if (subscribed.has(target)) continue;
      subscribed.add(target);
      target.setAttribute("data-automovie-frame-observer", "on");
      target.addEventListener(
        "automovie:completed-frame",
        (event: Event): void => {
          observe(
            target,
            (event as CustomEvent<IAutoMovieViewerCompletedFrame>).detail,
          );
        },
        { signal: listeners.signal },
      );
    }
  };
  const mutations: MutationObserver = new MutationObserver(subscribe);
  mutations.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  subscribe();
  addEventListener(
    "message",
    (event: MessageEvent<unknown>): void => {
      if (
        event.origin !== location.origin ||
        event.source !== parent ||
        event.data === null ||
        typeof event.data !== "object"
      )
        return;
      const data: object = event.data;
      if (Reflect.get(data, "token") !== token) return;
      if (Reflect.get(data, "type") === "automovie:state") {
        transfer = Reflect.get(data, "state");
        initialized = true;
        void initialize();
      } else if (
        Reflect.get(data, "type") === "automovie:committed" &&
        admitted
      ) {
        if (
          bootstrap !== null &&
          typeof bootstrap === "object" &&
          Reflect.get(bootstrap, "failed") === true
        )
          return;
        const session: unknown = Reflect.get(data, "session");
        const generation: unknown = Reflect.get(data, "generation");
        if (
          typeof session === "string" &&
          typeof generation === "number" &&
          Number.isSafeInteger(generation) &&
          generation > 0
        ) {
          publishing = true;
          commitIdentity = { session, generation };
          // A hidden candidate's native buffer can clear before publication.
          // Reproduce it now that it is visible, through its original owner,
          // so even an idle handled frame snapshots pixels before they clear.
          const before: number = frameSequence;
          try {
            if (frame?.control?.redraw === undefined)
              throw new Error(
                "The committed product has no original redraw capability.",
              );
            frame.control.redraw();
            if (frameSequence <= before)
              throw new Error(
                "The committed producer did not complete its visible redraw.",
              );
            if (!document.hidden && !publicationCopied)
              throw new Error(
                "The visible completed frame could not be copied for automatic saving.",
              );
            announce("automovie:published");
          } catch (cause) {
            fail(cause);
          }
        }
      } else if (
        Reflect.get(data, "type") === "automovie:activated" &&
        publishing &&
        !terminal
      ) {
        publishing = false;
        committed = true;
        if (
          publicationCopied &&
          commitIdentity !== undefined &&
          saver !== undefined
        )
          saverCommitted = saver.commit(
            commitIdentity.session,
            commitIdentity.generation,
          );
        resumeCandidate?.();
        resumeCandidate = undefined;
      }
    },
    { signal: listeners.signal },
  );
  addEventListener(
    "pagehide",
    (): void => {
      if (closed) return;
      closed = true;
      terminal = true;
      const waiter: typeof frameWaiter = frameWaiter;
      const resume: (() => void) | undefined = resumeCandidate;
      const saved: typeof saver = saver;
      const display: typeof gpuDisplay = gpuDisplay;
      const targets: HTMLCanvasElement[] = [...subscribed];
      frameWaiter = undefined;
      resumeCandidate = undefined;
      saver = undefined;
      gpuDisplay = undefined;
      frame = undefined;
      canvas = undefined;
      application = undefined;
      facts = undefined;
      completedState = undefined;
      transfer = undefined;
      subscribed.clear();
      reportAutoMovieResourceRetirement([
        (): void => listeners.abort(),
        (): void => sourceRead.abort(),
        (): void => mutations.disconnect(),
        (): void =>
          waiter?.reject(
            new Error("The hosted page closed before frame admission."),
          ),
        (): void => resume?.(),
        (): void => saved?.dispose(),
        (): void => display?.dispose(),
        ...targets.map(
          (target: HTMLCanvasElement): (() => void) =>
            (): void =>
              target.removeAttribute("data-automovie-frame-observer"),
        ),
      ]);
    },
    { once: true },
  );
  announce("automovie:initialize");
  return {
    capture,
    freeze: (): (() => void) => frame?.control?.freeze?.() ?? ((): void => {}),
    fail,
    navigate: (address: string): void => {
      if (!closed) announce("automovie:navigate", { address });
    },
    register: (value: IPlaygroundViewerApplication): void => {
      if (closed) return;
      application = value;
      void value.ready.catch(fail);
      void initialize();
    },
  };
}
