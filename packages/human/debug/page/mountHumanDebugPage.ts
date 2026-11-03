import { createAutoMovieResourceRetirement, mountViewer, type IAutoMovieViewerHandle } from "@automovie/viewer";
import * as THREE from "three";

import { HUMAN_DEBUG_ROUTES } from "../contracts/HUMAN_DEBUG_ROUTES";
import { HumanDebugOptions } from "../contracts/HumanDebugOptions";
import type { IHumanDebugAutomation } from "../contracts/IHumanDebugAutomation";
import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";
import type { IHumanDebugSnapshot } from "../contracts/IHumanDebugSnapshot";
import { HumanDebugCompilerPanel } from "./HumanDebugCompilerPanel";
import { HumanDebugControls } from "./HumanDebugControls";
import { HumanDebugStage } from "./HumanDebugStage";
import { HumanDebugView } from "./HumanDebugView";
import { loadHumanDebugSubject } from "./loadHumanDebugSubject";

/**
 * Mount the viewer page on its document: one subject, every option from the URL.
 *
 * The URL is the state. Loading applies `HumanDebugOptions.parse(location.search)`; every control
 * change applies the next options and writes their canonical text back with `history.replaceState`;
 * orbiting writes `az`, `el`, `dist` and `target`. A subject (person and piece) is loaded once and
 * kept while only display options change; changing the person or piece disposes it and loads the
 * next. Rejected values keep their defaults and are listed in the notice box, and a failed load
 * leaves nothing of the previous subject on screen.
 *
 * @returns The automation handle, also published as `window.__humanDebug`.
 */
export function mountHumanDebugPage(): IHumanDebugAutomation {
  const element: <T extends HTMLElement>(id: string) => T = <T extends HTMLElement>(id: string): T => {
    const found: HTMLElement | null = document.getElementById(id);
    if (found === null) throw new Error("Missing page element " + id);
    return found as T;
  };
  const canvas: HTMLCanvasElement = element("canvas");
  const viewport: HTMLDivElement = element("viewport");
  const labels: HTMLDivElement = element("labels");
  const noticeBox: HTMLDivElement = element("notices");
  const status: HTMLPreElement = element("status");
  const address: HTMLInputElement = element("url");
  const first: { options: IHumanDebugOptions; notices: string[] } = HumanDebugOptions.parse(
    new URLSearchParams(location.search),
  );
  if (first.options.ui) HumanDebugCompilerPanel.mount();

  let dirty: boolean = true;
  const stage: HumanDebugStage = new HumanDebugStage(canvas, (): void => {
    dirty = true;
  });

  // Filled once mountViewer returns; the frame callback may run before that.
  const viewer: { mount?: IAutoMovieViewerHandle } = {};
  let options: IHumanDebugOptions = first.options;
  let notices: string[] = first.notices;
  let view: HumanDebugView | undefined;
  let placement: Record<string, unknown> | null = null;
  let section: number | null = null;
  let framed: string = "";
  let loaded: number | null = null;
  let source: string | null = null;
  let drawn: () => void = (): void => {};
  const size: { width: number; height: number } = { width: 0, height: 0 };

  // Draw on demand; labels follow the camera after every draw.
  const frame: () => boolean = (): boolean => {
    const renderer: THREE.WebGLRenderer | undefined = viewer.mount?.renderer;
    if (renderer === undefined) return true;
    const fixed: boolean = options.w > 0 && options.h > 0;
    const width: number = fixed ? options.w : viewport.clientWidth || 1;
    const height: number = fixed ? options.h : viewport.clientHeight || 1;
    if (width !== size.width || height !== size.height) {
      Object.assign(size, { width, height });
      for (const target of [canvas, viewport]) {
        target.style.width = fixed ? width + "px" : "";
        target.style.height = fixed ? height + "px" : "";
      }
      renderer.setPixelRatio(fixed ? 1 : window.devicePixelRatio || 1);
      renderer.setSize(width, height, false);
      stage.resize(width / height);
      dirty = true;
    }
    if (!dirty) return true;
    dirty = false;
    stage.follow();
    renderer.render(stage.scene, stage.camera);
    labels.replaceChildren(
      ...(view?.labels(options) ?? []).flatMap((label: { id: string; at: THREE.Vector3; colour: string }): HTMLElement[] => {
        const p: THREE.Vector3 = label.at.clone().project(stage.camera);
        if (p.z < -1 || p.z > 1) return [];
        const span: HTMLSpanElement = document.createElement("span");
        span.textContent = label.id;
        span.style.left = ((p.x + 1) / 2) * width + "px";
        span.style.top = ((1 - p.y) / 2) * height + "px";
        span.style.color = label.colour;
        return [span];
      }),
    );
    drawn();
    drawn = (): void => {};
    return true;
  };
  viewer.mount = mountViewer(canvas, stage.scene, stage.camera as THREE.PerspectiveCamera, frame, {
    preserveDrawingBuffer: true,
  });
  const nextFrame: () => Promise<undefined> = (): Promise<undefined> =>
    new Promise<undefined>((resolve: (value: undefined) => void): void => {
      drawn = (): void => resolve(undefined);
      dirty = true;
    });

  const snapshot: () => IHumanDebugSnapshot = (): IHumanDebugSnapshot => {
    const context: WebGLRenderingContext | WebGL2RenderingContext = viewer.mount!.renderer.getContext();
    const debug: WEBGL_debug_renderer_info | null = context.getExtension("WEBGL_debug_renderer_info");
    return {
      query: HumanDebugOptions.write(options),
      notices: [...notices],
      subject: view === undefined ? null : { ...view.subject.key },
      provenance: view?.subject.provenance ?? null,
      shown: view?.visible() ?? { parts: [], curves: [] },
      inventory: view?.inventory() ?? { parts: [], curves: [] },
      camera: placement,
      section,
      canvas: {
        width: canvas.width,
        height: canvas.height,
        gpu: String(context.getParameter(debug?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER)),
      },
      loadMilliseconds: loaded,
      source,
    };
  };

  /** Apply one options record: subject, display, framing, section, URL, controls and notices. */
  const apply: (next: IHumanDebugOptions, messages: string[]) => Promise<IHumanDebugSnapshot> = async (
    next: IHumanDebugOptions,
    messages: string[],
  ): Promise<IHumanDebugSnapshot> => {
    options = next;
    loaded = null;
    element<HTMLElement>("app").classList.toggle("bare", !options.ui);
    try {
      // A piece has no pose, so its key ignores the pose variable.
      const pose: string | null = options.piece === null ? options.pose : null;
      const key: string = JSON.stringify([options.person, options.piece, pose]);
      if (
        view === undefined ||
        JSON.stringify([view.subject.key.person, view.subject.key.piece, view.subject.key.pose]) !== key
      ) {
        const previous: HumanDebugView | undefined = view;
        view = undefined;
        await previous?.dispose();
        labels.replaceChildren();
        status.textContent =
          "불러오는 중: " + (options.person ?? "(첫 사람)") + " " + (options.piece ?? "전신 " + options.pose);
        const started: number = performance.now();
        view = new HumanDebugView(await loadHumanDebugSubject(options.person, options.piece, options.pose));
        loaded = performance.now() - started;
        stage.content.add(view.object, view.overlays);
        const inventory: { parts: string[]; curves: string[] } = view.inventory();
        controls.list(inventory.parts, inventory.curves);
        framed = "";
      }
      const shown: { parts: string[]; curves: string[] } = view.apply(options);
      const focus: THREE.Box3 = view.focus(options);
      if (focus.isEmpty()) messages = [...messages, "Nothing is shown; the camera keeps its place"];
      else {
        // Reframe only when what decides the framing changed, so a toggle keeps the orbit.
        const key: string = JSON.stringify([
          options.camera, options.az, options.el, options.dist, options.target, options.fov, options.ortho,
          options.focus, focus.min.toArray(), focus.max.toArray(), size.width, size.height, options.w, options.h,
        ]);
        const aspect: number =
          options.w > 0 && options.h > 0 ? options.w / options.h : (viewport.clientWidth || 1) / (viewport.clientHeight || 1);
        if (key !== framed) {
          placement = stage.frame(options, focus, aspect);
          framed = key;
        } else stage.style(options, focus);
        section = stage.section(options, focus, viewer.mount!.renderer);
      }
      status.textContent = JSON.stringify(
        { shown: { parts: shown.parts.length, curves: shown.curves.length }, provenance: view.subject.provenance },
        null,
        2,
      );
    } catch (error) {
      // The stack names the failing site; a capture's server log receives this text.
      console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
      messages = [...messages, error instanceof Error ? error.message : String(error)];
    }
    const query: string = HumanDebugOptions.write(options);
    history.replaceState(null, "", location.pathname + (query === "" ? "" : "?" + query) + location.hash);
    address.value = location.href;
    noticeBox.textContent = messages.join("\n");
    controls.show(options);
    notices = messages;
    await nextFrame();
    return snapshot();
  };

  const controls: HumanDebugControls = new HumanDebugControls(
    element("controls"),
    (next: IHumanDebugOptions, messages: string[]): void => void apply(next, messages),
  );

  // Orbiting is a control too: the camera is written back as az, el, dist and target.
  stage.orbit.addEventListener("end", (): void => {
    const offset: THREE.Vector3 = stage.camera.position.clone().sub(stage.orbit.target);
    const round: (n: number) => number = (n: number): number => Math.round(n * 10) / 10;
    options = {
      ...options,
      az: round(THREE.MathUtils.radToDeg(Math.atan2(offset.z, offset.x))),
      el: round(THREE.MathUtils.radToDeg(Math.asin(Math.max(-1, Math.min(1, offset.y / offset.length()))))),
      dist: round(offset.length() * 1000),
      target: stage.orbit.target.toArray().map((n: number): number => round(n * 1000)) as [number, number, number],
    };
    framed = "";
    history.replaceState(null, "", location.pathname + "?" + HumanDebugOptions.write(options) + location.hash);
    address.value = location.href;
    controls.show(options);
  });
  element<HTMLButtonElement>("capture").addEventListener("click", (): void => {
    void nextFrame().then((): void => {
      const link: HTMLAnchorElement = document.createElement("a");
      link.download = "human-debug.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  });
  const resize: ResizeObserver = new ResizeObserver((): void => {
    dirty = true;
  });
  resize.observe(viewport);

  // The source hash is read once every module has evaluated and before the first subject is
  // generated, so it names the bytes this page runs on however long the generation takes.
  const ready: Promise<IHumanDebugSnapshot> = fetch(HUMAN_DEBUG_ROUTES.source, { cache: "no-store" })
    .then((response: Response): Promise<{ sourceSha256: string }> => response.json())
    .then((value: { sourceSha256: string }): void => {
      source = value.sourceSha256;
    })
    .catch((error: unknown): void => console.error("Source hash unavailable", error))
    .then((): Promise<IHumanDebugSnapshot> => apply(first.options, first.notices));
  const automation: IHumanDebugAutomation = {
    ready,
    apply: (search: string): Promise<IHumanDebugSnapshot> => {
      const parsed: { options: IHumanDebugOptions; notices: string[] } = HumanDebugOptions.parse(new URLSearchParams(search));
      return apply(parsed.options, parsed.notices);
    },
    snapshot,
  };
  const retire: () => Promise<void> = createAutoMovieResourceRetirement([
    (): void => resize.disconnect(),
    (): void => stage.dispose(),
    (): void => viewer.mount?.stop(),
    async (): Promise<void> => {
      await view?.dispose();
    },
  ]);
  window.addEventListener("pagehide", (): void => void retire().catch(console.error), { once: true });
  return automation;
}
