import {
  type IAutoMovieViewerHandle,
  createAutoMovieResourceRetirement,
  mountViewer,
} from "@automovie/viewer";
import * as THREE from "three";

import { HUMAN_DEBUG_ROUTES } from "../contracts/HUMAN_DEBUG_ROUTES";
import { HumanDebugOptions } from "../contracts/HumanDebugOptions";
import type { IHumanDebugAutomation } from "../contracts/IHumanDebugAutomation";
import type { IHumanDebugCompilerState } from "../contracts/IHumanDebugCompilerState";
import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";
import type { IHumanDebugSnapshot } from "../contracts/IHumanDebugSnapshot";
import { HumanDebugCompilerPanel } from "./HumanDebugCompilerPanel";
import { HumanDebugCameraState } from "./HumanDebugCameraState";
import { HumanDebugControls } from "./HumanDebugControls";
import { HumanDebugLegend } from "./HumanDebugLegend";
import { HumanDebugPageWork } from "./HumanDebugPageWork";
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
 * leaves nothing of the previous subject on screen. A subject is generated from the type-stripped source whatever the compile
 * collector reports (`HumanDebugCompilerPanel.read`); a cycle that has not passed is named in the
 * notice box.
 *
 * @returns The automation handle, also published as `window.__humanDebug`.
 *
 * @evidence contracts/common.md#principled-implementation Canonical options select the subject and actual visible ids; comparison identity includes diagnostic part scope while final person/piece paths retain their production checks.
 * @evidence contracts/common.md#clear-and-simple-design One apply path loads/retires subjects, applies visibility, frames the camera and submits the next frame; capture automation uses that same path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Displays compiler state and original failure notices rather than substituting a figure or treating source definition as final realization.
 * @evidence contracts/common.md#meaningful-documentation States URL ownership, subject replacement, source phase and automation lifetime; provenance qualifies diagnostic support and native fallback.
 * @evidence contracts/performance.md#efficient-algorithms Loading follows the chosen producer, then visibility scans curve/part inventory and camera bounds; the ordinary renderer owns draw cost. No constant-time option update is claimed.
 * @evidence contracts/performance.md#reuse-equivalent-work Keeps a subject for equal identity, including comparison part scope, and reuses its existing curve holders for display-only changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retires the previous view before replacement; pagehide disconnects resize observation, stage, renderer loop and view resources through the existing retirement owner.
 */
export function mountHumanDebugPage(): IHumanDebugAutomation {
  const element: <T extends HTMLElement>(id: string) => T = <
    T extends HTMLElement,
  >(
    id: string,
  ): T => {
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
  const legend: HTMLDivElement = document.createElement("div");
  viewport.append(legend);
  const first: { options: IHumanDebugOptions; notices: string[] } =
    HumanDebugOptions.parse(new URLSearchParams(location.search));
  if (first.options.ui) HumanDebugCompilerPanel.mount();

  let dirty: boolean = true;
  const stage: HumanDebugStage = new HumanDebugStage(canvas, (): void => {
    dirty = true;
  });
  const work: HumanDebugPageWork = new HumanDebugPageWork((active: boolean): void => { stage.orbit.enabled = !active; });

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
  const size: { width: number; height: number } = { width: 0, height: 0 };

  // Draw on demand; labels follow the camera after every draw.
  const frame: () => boolean = (): boolean => {
    if (work.closed) return true;
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
      ...(view?.labels(options) ?? []).flatMap(
        (label: {
          id: string;
          at: THREE.Vector3;
          colour: string;
        }): HTMLElement[] => {
          const p: THREE.Vector3 = label.at.clone().project(stage.camera);
          if (p.z < -1 || p.z > 1) return [];
          const span: HTMLSpanElement = document.createElement("span");
          span.textContent = label.id;
          span.style.left = ((p.x + 1) / 2) * width + "px";
          span.style.top = ((1 - p.y) / 2) * height + "px";
          span.style.color = label.colour;
          return [span];
        },
      ),
    );
    work.drawn();
    return true;
  };
  viewer.mount = mountViewer(
    canvas,
    stage.scene,
    stage.camera as THREE.PerspectiveCamera,
    frame,
    {
      preserveDrawingBuffer: true,
    },
  );
  const nextFrame = (): Promise<void> => {
    const completed: Promise<void> = work.nextFrame();
    dirty = true;
    return completed;
  };

  const snapshot: () => IHumanDebugSnapshot = (): IHumanDebugSnapshot => {
    work.checkOpen();
    const context: WebGLRenderingContext | WebGL2RenderingContext =
      viewer.mount!.renderer.getContext();
    const debug: WEBGL_debug_renderer_info | null = context.getExtension(
      "WEBGL_debug_renderer_info",
    );
    return {
      query: HumanDebugOptions.write(options),
      notices: [...notices],
      subject: view === undefined ? null : { ...view.subject.key },
      provenance: view?.subject.provenance ?? null,
      shown: view?.visible() ?? { parts: [], curves: [] },
      inventory: view?.inventory() ?? { parts: [], curves: [] },
      camera: placement === null ? null : { ...placement, ...HumanDebugCameraState(stage.camera, stage.orbit.target).placement },
      section,
      canvas: {
        width: canvas.width,
        height: canvas.height,
        gpu: String(
          context.getParameter(
            debug?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER,
          ),
        ),
      },
      loadMilliseconds: loaded,
      source,
    };
  };

  /** Apply one options record: subject, display, framing, section, URL, controls and notices. */
  const update: (
    next: IHumanDebugOptions,
    messages: string[],
    revision: number,
  ) => Promise<IHumanDebugSnapshot> = async (
    next: IHumanDebugOptions,
    messages: string[],
    revision: number,
  ): Promise<IHumanDebugSnapshot> => {
    work.checkOpen();
    options = next;
    loaded = null;
    element<HTMLElement>("app").classList.toggle("bare", !options.ui);
    try {
      // A piece has no pose, so its key ignores the pose variable; a comparison is keyed by its
      // person (the reference when unset), reference, style and drawn pieces.
      const pose: string | null = options.piece === null ? options.pose : null;
      const reference: {
        id: string;
        style: "clay" | "loft";
        parts: string[];
        comparedParts: string[];
      } | null =
        options.reference === null
          ? null
          : {
              id: options.reference,
              style: options.referenceStyle,
              parts: options.referencePart,
              comparedParts: options.part,
            };
      const key: string = JSON.stringify(
        reference === null
          ? [options.person, options.piece, pose]
          : [
              options.person ?? reference.id,
              "reference:" +
                reference.id +
                ":" +
                reference.style +
                ":" +
                reference.parts.join(",") +
                ":view:" +
                reference.comparedParts.join(","),
              null,
            ],
      );
      if (
        view === undefined ||
        JSON.stringify([
          view.subject.key.person,
          view.subject.key.piece,
          view.subject.key.pose,
        ]) !== key
      ) {
        const previous: HumanDebugView | undefined = view;
        view = undefined;
        await previous?.dispose();
        work.checkOpen();
        labels.replaceChildren();
        legend.replaceChildren();

        // The subject is generated from the type-stripped source whatever the compile collector
        // reports; its state is shown beside the frame as information.
        const compile: IHumanDebugCompilerState =
          await HumanDebugCompilerPanel.read();
        work.checkOpen();
        if (compile.phase !== "passed")
          messages.push(
            "Compile " +
              compile.phase +
              " (" +
              (compile.cycle ?? "no cycle") +
              "); drawn from the type-stripped source.",
          );
        status.textContent =
          "불러오는 중: " +
          (options.person ?? "(첫 사람)") +
          " " +
          (options.piece ?? "전신 " + options.pose);
        const started: number = performance.now();
        const received: HumanDebugView = await work.adopt(
          loadHumanDebugSubject(
            options.person,
            options.piece,
            options.pose,
            reference,
          ),
          (subject: ConstructorParameters<typeof HumanDebugView>[0]): HumanDebugView => {
            const current: HumanDebugView = new HumanDebugView(subject);
            view = current;
            return current;
          },
        );
        work.checkOpen();
        view = received;
        loaded = performance.now() - started;
        stage.content.add(view.object, view.overlays);
        const inventory: { parts: string[]; curves: string[] } =
          view.inventory();
        controls.list(inventory.parts, inventory.curves);
        framed = "";
      }
      const referenceDisplay: unknown = view.subject.provenance.referenceDisplay;
      if (referenceDisplay !== null && typeof referenceDisplay === "object" && "diagnostic" in referenceDisplay && typeof referenceDisplay.diagnostic === "string")
        messages.push(referenceDisplay.diagnostic);
      const shown: { parts: string[]; curves: string[] } = view.apply(options);
      HumanDebugLegend(legend, view.subject.legend, options);
      const focus: THREE.Box3 = view.focus(options);
      if (focus.isEmpty())
        messages = [
          ...messages,
          "Nothing is shown; the camera keeps its place",
        ];
      else {
        // Reframe only when what decides the framing changed, so a toggle keeps the orbit.
        const key: string = JSON.stringify([
          options.camera,
          options.az,
          options.el,
          options.dist,
          options.target,
          options.fov,
          options.ortho,
          options.focus,
          focus.min.toArray(),
          focus.max.toArray(),
          size.width,
          size.height,
          options.w,
          options.h,
        ]);
        const aspect: number =
          options.w > 0 && options.h > 0
            ? options.w / options.h
            : (viewport.clientWidth || 1) / (viewport.clientHeight || 1);
        if (key !== framed) {
          placement = stage.frame(options, focus, aspect);
          framed = key;
        } else stage.style(options, focus);
        section = stage.section(options, focus, viewer.mount!.renderer);
      }
      status.textContent =
        (view.subject.model.id === "human.debug.compare"
          ? "원본 곡선 정의 관측 · 최종 3D 접합 미계산\n"
          : "") +
        JSON.stringify(
          {
            shown: { parts: shown.parts.length, curves: shown.curves.length },
            provenance: view.subject.provenance,
          },
          null,
          2,
        );
    } catch (error) {
      if (work.closed) throw error;
      // The stack names the failing site; the notice carries it whole, so a capture's failure, its
      // server log line and the status route's last failures name the file and line.
      const text: string =
        error instanceof Error ? (error.stack ?? error.message) : String(error);
      console.error(text);
      messages = [...messages, text];
    }
    const query: string = HumanDebugOptions.write(options);
    history.replaceState(
      null,
      "",
      location.pathname + (query === "" ? "" : "?" + query) + location.hash,
    );
    address.value = location.href;
    noticeBox.textContent = messages.join("\n");
    controls.show(options, revision);
    notices = messages;
    await nextFrame();
    return snapshot();
  };
  const apply = (next: IHumanDebugOptions, messages: string[]): Promise<IHumanDebugSnapshot> => {
    if (work.closed) return Promise.reject(new Error("Human debug page closed"));
    const revision: number = controls.request(next);
    return work.apply(next, messages, (request: IHumanDebugOptions, notices: string[]): Promise<IHumanDebugSnapshot> => update(request, notices, revision));
  };

  const controls: HumanDebugControls = new HumanDebugControls(
    element("controls"),
    (next: IHumanDebugOptions, messages: string[]): void =>
      void apply(next, messages).catch(console.error),
  );

  // Orbiting is a control too: the camera is written back as az, el, dist and target.
  stage.orbit.addEventListener("end", (): void => {
    if (work.closed) return;
    const requested: IHumanDebugOptions = { ...controls.requested(), ...HumanDebugCameraState(stage.camera, stage.orbit.target).options };
    const revision: number = controls.request(requested);
    void work.run(async (): Promise<void> => {
      options = { ...options, ...HumanDebugCameraState(stage.camera, stage.orbit.target).options };
      framed = "";
      history.replaceState(null, "", location.pathname + "?" + HumanDebugOptions.write(options) + location.hash);
      address.value = location.href;
      controls.show(options, revision);

      // Recording the camera requests no draw; release input before the next pointer/wheel event.
    }).catch(console.error);
  });
  element<HTMLButtonElement>("capture").addEventListener("click", (): void => {
    void work.run(async (): Promise<void> => {
      await nextFrame();
      work.checkOpen();
      const link: HTMLAnchorElement = document.createElement("a");
      link.download = "human-debug.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }).catch(console.error);
  });
  const resize: ResizeObserver = new ResizeObserver((): void => {
    dirty = true;
  });
  resize.observe(viewport);

  // Request the server's disk inventory during mounting, before the first subject is generated.
  // The capture checks disk stability; served-transform freshness is a separate boundary.
  const initial: typeof first = structuredClone(first);
  const initialRevision: number = controls.request(initial.options);
  const ready: Promise<IHumanDebugSnapshot> = work.run(async (): Promise<IHumanDebugSnapshot> => {
    await fetch(HUMAN_DEBUG_ROUTES.source, { cache: "no-store" })
    .then(
      (response: Response): Promise<{ sourceSha256: string }> =>
        response.json(),
    )
    .then((value: { sourceSha256: string }): void => {
      work.checkOpen();
      source = value.sourceSha256;
    })
    .catch((error: unknown): void =>
      console.error("Source hash unavailable", error),
    );
    work.checkOpen();
    return update(initial.options, initial.notices, initialRevision);
  });
  const automation: IHumanDebugAutomation = {
    ready,
    apply: (search: string): Promise<IHumanDebugSnapshot> => {
      const parsed: { options: IHumanDebugOptions; notices: string[] } =
        HumanDebugOptions.parse(new URLSearchParams(search));
      return apply(parsed.options, parsed.notices);
    },
    snapshot,
  };
  const retire: () => Promise<void> = createAutoMovieResourceRetirement([
    (): void => resize.disconnect(),
    (): void => stage.dispose(),
    (): void => viewer.mount?.stop(),
    async (): Promise<void> => {
      const previous: HumanDebugView | undefined = view;
      view = undefined;
      await previous?.dispose();
    },
  ]);
  window.addEventListener(
    "pagehide",
    (): void => { work.close(); void retire().catch(console.error); },
    { once: true },
  );
  return automation;
}
