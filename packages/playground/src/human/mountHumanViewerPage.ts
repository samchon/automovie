import { type IAutoMovieViewerHandle, mountViewer } from "@automovie/viewer";
import * as THREE from "three";

import { AutoMovieHuman } from "../../../human/src/AutoMovieHuman";
import type { IAutoMovieHumanGenerated } from "../../../human/src/structures/IAutoMovieHumanGenerated";
import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { HumanCaptureCamera } from "./HumanCaptureCamera";
import { HumanViewerCamera } from "./HumanViewerCamera";
import { HumanViewerModel } from "./HumanViewerModel";
import type { IHumanViewerPage } from "./IHumanViewerPage";
import { admitHumanParameters } from "./admitHumanParameters";
import { captureHumanPageFrame } from "./captureHumanPageFrame";
import { drawHumanPageCurveDiagram } from "./drawHumanPageCurveDiagram";
import { layoutHumanViewerPage } from "./layoutHumanViewerPage";
import { mountHumanViewControls } from "./mountHumanViewControls";
import { normalizeHumanCurves } from "./normalizeHumanCurves";
import { normalizeHumanView } from "./normalizeHumanView";
import { readHumanLegend } from "./readHumanLegend";
import { resolveHumanCurves } from "./resolveHumanCurves";
import { syncHumanViewerUrl } from "./syncHumanViewerUrl";

/** What a load produces before display. */
interface IProduced {
  result: IAutoMovieHumanGenerated;
  alias: string | null;
  milliseconds: number | null;
}

/**
 * Mount the single Human page: generate, display, select and isolate curves, and capture `AutoMovieHuman` results.
 *
 * One scene, renderer and key light serve the interactive view and every PNG. The default profile retains reference background, hemisphere 0.6, key 2.2 and fov 30; clay and raking are explicit development inspection conditions. Captures pin the buffer to 1200 x 1200 at DPR 1 with the shared camera framing rule.
 *
 * Free-view variables include camera overrides, isolation, garments, hair, skin material and lighting. The page draws only when visible state changes. A load prepares its replacement while keeping the displayed model; failed preparation reports the request without discarding that generation. Typed inputs, the current pass, camera, curves and canonical view stay bound to the page URL and PNG link.
 *
 * @param root Element whose children this page replaces and owns until dispose.
 * @returns The page control surface, also published as `window.__automovieHuman` by the entry.
 *
 * @evidence contracts/common.md#principled-implementation Existing buildModel and mountViewer display the public generator's exact model under the reference scene conditions; captures read the preserved 1200 x 1200 buffer with the reference framing rule and explicit inspection lighting, and the page renders its active perspective or orthographic camera itself.
 * @evidence contracts/common.md#clear-and-simple-design The page owns scene, renderer and load serialization; display state is HumanViewerModel, cameras HumanViewerCamera, Human display rules createHumanPartStyle, framing HumanCaptureCamera, frame application captureHumanPageFrame, diagram encoding drawHumanPageCurveDiagram and DOM layoutHumanViewerPage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Loads validate a private input snapshot and prepare a replacement before retiring the displayed generation; failed requests reject rather than returning that generation as a replacement.
 * @evidence contracts/common.md#meaningful-documentation States the shared scene, capture conditions, free view, on-demand drawing, failure rule and URL mirroring.
 * @evidence contracts/performance.md#efficient-algorithms Draws only when visible state changes; a load costs one generation and model build, a capture up to nine restyles including restoration, one draw and one PNG encode.
 * @evidence contracts/performance.md#reuse-equivalent-work One scene, renderer and model serve interaction and every capture of a generation; display changes restyle instead of regenerating.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds one displayed model and at most one prepared replacement; commit joins previous disposal, failed preparation releases its candidate, and dispose releases model, controls, render loop and DOM. A busy flag serializes loads.
 */
export function mountHumanViewerPage(root: HTMLElement): IHumanViewerPage {
  const dom: ReturnType<typeof layoutHumanViewerPage> = layoutHumanViewerPage(
    root,
    HumanCaptureCamera.names,
  );

  // Scene conditions shared by interaction and capture; see HumanCaptureCamera.
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(HumanCaptureCamera.background);
  const hemisphere: THREE.HemisphereLight = new THREE.HemisphereLight(
    0xffffff,
    0x9aa3b2,
    0.6,
  );
  const key: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 2.2);
  scene.add(hemisphere, key, key.target);
  const shots: {
    perspective: THREE.PerspectiveCamera;
    orthographic: THREE.OrthographicCamera;
  } = {
    perspective: new THREE.PerspectiveCamera(HumanCaptureCamera.fov, 1),
    orthographic: new THREE.OrthographicCamera(),
  };

  let dirty: boolean = true;
  const camera: HumanViewerCamera = new HumanViewerCamera(
    dom.canvas,
    (): void => {
      dirty = true;
    },
  );

  let current: HumanViewerModel | undefined;
  let generation: number = 0;
  let pass: IHumanViewerPage.Pass = "surface";
  let view: string = "whole-oblique-front";
  let curves: string = "";
  let free: ReturnType<typeof normalizeHumanView> = normalizeHumanView(
    (): null => null,
  );
  let busy: boolean = false;
  let closed: boolean = false;
  let closing: Promise<void> | undefined;
  let failed: boolean = false;
  const size: { width: number; height: number; ratio: number } = {
    width: 0,
    height: 0,
    ratio: 0,
  };

  // Draw on demand and render the active camera ourselves, since mountViewer
  // was given only one camera; returning true marks the frame handled.
  let mount: IAutoMovieViewerHandle | undefined;
  const frame: () => boolean = (): boolean => {
    const renderer: THREE.WebGLRenderer | undefined = mount?.renderer;
    if (renderer === undefined) return true;
    const ratio: number = window.devicePixelRatio || 1;
    const width: number = dom.canvas.clientWidth || 1;
    const height: number = dom.canvas.clientHeight || 1;
    if (
      width !== size.width ||
      height !== size.height ||
      ratio !== size.ratio
    ) {
      Object.assign(size, { width, height, ratio });
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      camera.resize(width / height);
      dirty = true;
    }
    if (!dirty) return true;
    dirty = false;
    camera.follow(
      key,
      current?.bounds.getSize(new THREE.Vector3()).length() ?? 2,
      hemisphere,
      free.value.light,
    );
    renderer.render(scene, camera.active);
    return true;
  };
  try {
    mount = mountViewer(dom.canvas, scene, shots.perspective, frame, {
      preserveDrawingBuffer: true,
    });
  } catch (error) {
    camera.dispose();
    throw error;
  }

  /** Show a status line; an error also fills the empty-viewport message. */
  const report: (kind: "ok" | "busy" | "error", message: string) => void = (
    kind: "ok" | "busy" | "error",
    message: string,
  ): void => {
    failed = kind === "error";
    dom.status.textContent = message;
    dom.status.dataset.kind = kind;
    if (kind === "error") dom.emptyDetail.textContent = message;
  };
  const describe: (error: unknown) => string = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

  /** Mirror the view into the URL and the links, so it can be fetched as a PNG. */
  const sync: () => void = (): void => {
    const alias: string | null = current?.loaded.alias ?? null;
    syncHumanViewerUrl(alias, pass, view, curves, free.text);
    const selection: IHumanViewerPage.ISelection | undefined =
      current?.selection();
    dom.setLinks(
      alias,
      view,
      pass,
      normalizeHumanCurves.query(curves),
      free.text,
      selection?.selected[0] ?? null,
    );
    if (current !== undefined)
      dom.setLegend(
        readHumanLegend(current.result.model),
        selection!.selected.map(
          (id: string, index: number): { id: string; colour: string } => ({
            id,
            colour: selection!.colours[index]!,
          }),
        ),
      );
    dom.setCurves(current?.curveIds() ?? [], curves);
    dom.setPassAvailability(current?.loaded.construction ?? false, pass);
    dom.camera.value = view;
    showView(free.value);
    dirty = true;
  };

  /** Remove and dispose the displayed model, leaving the empty viewport. */
  const retire: () => Promise<void> = async (): Promise<void> => {
    const previous: HumanViewerModel | undefined = current;
    current = undefined;
    dom.empty.hidden = false;
    for (const node of [dom.emptyDetail, dom.state, dom.parameters])
      node.textContent = "";
    dirty = true;
    await previous?.dispose();
  };

  /** Prepare a replacement before releasing the displayed model; failed admission keeps it. */
  const replace: (produce: () => IProduced) => Promise<IHumanViewerPage.ILoaded> =
  async (produce: () => IProduced): Promise<IHumanViewerPage.ILoaded> => {
    if (closed || busy) throw new Error("Human viewer is closed or busy");
    busy = true;
    let prepared: HumanViewerModel | undefined;
    let committed: boolean = false;
    try {
      report("busy", "Human 모델을 생성하고 있습니다.");

      // Yield once so the busy status paints before the synchronous generator.
      await new Promise<undefined>(
        (resolve: (value: undefined) => void): void => {
          setTimeout(resolve, 0, undefined);
        },
      );
      if (closed) throw new Error("Human viewer closed during generation");
      const produced: IProduced = produce();
      const model: HumanViewerModel = await HumanViewerModel.create(
        produced.result,
        produced.alias,
        produced.milliseconds,
        generation + 1,
      );
      prepared = model;

      // The page may have been disposed while the images decoded.
      if (closed) {
        throw new Error("Human viewer closed during texture decoding");
      }
      const previous: HumanViewerModel | undefined = current;
      current = model;
      committed = true;
      generation = model.loaded.generation;
      scene.add(model.object);
      await previous?.dispose();
      if (!model.loaded.construction) pass = "surface";
      model.setPass(pass);

      // Keep the selection and free view across loads when they still apply.
      let note: string = "";
      try {
        model.setCurves(curves);
        model.setIsolate(free.value.isolate);
        model.setDisplay(free.value);
      } catch (error) {
        curves = "";
        free = normalizeHumanView((): null => null);
        note = " (이전 곡선 선택 해제: " + describe(error) + ")";
      }
      place();
      dom.empty.hidden = true;
      const { generateMilliseconds, bounds }: IHumanViewerPage.ILoaded =
        model.loaded;
      dom.state.textContent = JSON.stringify(
        {
          generation,
          alias: produced.alias,
          generateMilliseconds,
          bounds,
          parts: model.loaded.parts.length,
          curves: model.curveIds().length,
        },
        null,
        2,
      );
      dom.parameters.textContent = JSON.stringify(
        produced.result.parameters,
        null,
        2,
      );
      sync();
      const time: string =
        produced.milliseconds === null
          ? ""
          : ", " + produced.milliseconds.toFixed(0) + " ms";
      report(
        "ok",
        `생성 완료${produced.alias === null ? "" : " (" + produced.alias + ")"}${time}: 파트 ${model.loaded.parts.length}개${note}`,
      );
      return model.loaded;
    } catch (error) {
      if (!committed) await prepared?.dispose().catch(console.error);
      report("error", "Human 생성 실패: " + describe(error));
      throw error;
    } finally {
      busy = false;
    }
  };

  /** Run the public generator on admitted typed parameters and time it. */
  const run: (
    parameters: IAutoMovieHumanParameters,
    alias: string | null,
  ) => () => IProduced =
    (
      parameters: IAutoMovieHumanParameters,
      alias: string | null,
    ): (() => IProduced) =>
    (): IProduced => {
      const start: number = performance.now();
      const result: IAutoMovieHumanGenerated =
        AutoMovieHuman.generate(parameters);
      return { result, alias, milliseconds: performance.now() - start };
    };

  /** The loaded model, or a thrown error naming the missing load. */
  const loaded: () => HumanViewerModel = (): HumanViewerModel => {
    if (current === undefined) throw new Error("No generated Human is loaded");
    return current;
  };

  /** Place the interactive camera on the named camera with the free view applied. */
  const place: () => void = (): void => {
    const model: HumanViewerModel = loaded();
    camera.place(key, model.describe(view, free.value), model.bounds);
    dirty = true;
  };

  const page: IHumanViewerPage = {
    loadAlias: (alias: string): Promise<IHumanViewerPage.ILoaded> =>
      replace((): IProduced => {
        const admitted: ReturnType<typeof admitHumanParameters> =
          admitHumanParameters({ alias });
        return run(admitted.parameters, admitted.alias)();
      }),
    load: (candidate: unknown): Promise<IHumanViewerPage.ILoaded> =>
      replace((): IProduced => {
        const admitted: ReturnType<typeof admitHumanParameters> =
          admitHumanParameters({ candidate });
        return run(admitted.parameters, admitted.alias)();
      }),
    generate: (
      parameters: IAutoMovieHumanParameters,
    ): Promise<IHumanViewerPage.ILoaded> =>
      replace((): IProduced => {
        const admitted: ReturnType<typeof admitHumanParameters> =
          admitHumanParameters({ candidate: parameters });
        return run(admitted.parameters, admitted.alias)();
      }),
    loadGenerated: (
      result: IAutoMovieHumanGenerated,
    ): Promise<IHumanViewerPage.ILoaded> =>
      replace((): IProduced => ({ result, alias: null, milliseconds: null })),
    serialize: (): string => JSON.stringify(loaded().result),
    setPass: (next: IHumanViewerPage.Pass): void => {
      loaded().setPass(next);
      pass = next;
      if (free.value.fit !== null) place();
      sync();
    },
    setCamera: (name: string): void => {
      const previous: string = view;
      view = name;
      try {
        place();
      } catch (error) {
        view = previous;
        throw error;
      }
      sync();
    },
    setCurves: (value: string): IHumanViewerPage.ISelection => {
      const selection: IHumanViewerPage.ISelection = loaded().setCurves(value);
      curves = selection.curves;
      if (free.value.isolate && selection.selected.length === 0)
        page.setView("");
      else if (free.value.fit !== null) place();
      sync();
      return selection;
    },
    curves: (): string[] => current?.curveIds() ?? [],
    setView: (query: string): string => {
      const model: HumanViewerModel = loaded();
      const next: ReturnType<typeof normalizeHumanView> = normalizeHumanView(
        (name: string): string | null => new URLSearchParams(query).get(name),
      );
      const previous: ReturnType<typeof normalizeHumanView> = free;
      try {
        model.setIsolate(next.value.isolate);
        model.setDisplay(next.value);
        free = next;
        place();
      } catch (error) {
        free = previous;
        model.setIsolate(previous.value.isolate);
        model.setDisplay(previous.value);
        throw error;
      }
      sync();
      return free.text;
    },
    capture: (
      name: string,
      next: IHumanViewerPage.Pass,
      selection: string,
      query: string,
    ): IHumanViewerPage.ICapture => {
      if (closed || busy || mount === undefined)
        throw new Error("Human viewer has no idle loaded model to capture");
      const model: HumanViewerModel = loaded();
      try {
        return captureHumanPageFrame(
          { model, renderer: mount.renderer, scene, key, hemisphere, shots },
          name,
          next,
          selection,
          query,
        );
      } finally {
        // Restore the interactive view; the next frame resizes and redraws.
        model.setCurves(curves);
        model.setIsolate(free.value.isolate);
        model.setDisplay(free.value);
        model.setPass(pass);
        camera.follow(
          key,
          model.bounds.getSize(new THREE.Vector3()).length(),
          hemisphere,
          free.value.light,
        );
        size.width = 0;
        dirty = true;
      }
    },
    diagram: (
      alias: string | null,
      curves: string,
      format: "svg" | "png",
    ): Promise<string> =>
      drawHumanPageCurveDiagram(alias, curves, format, current?.result.parameters),
    snapshot: (): IHumanViewerPage.ISnapshot => ({
      generation: current?.loaded.generation ?? 0,
      alias: current?.loaded.alias ?? null,
      pass,
      view: free.text,
      curves: current?.selection() ?? resolveHumanCurves("", [], []),
      status: dom.status.textContent ?? "",
      failed,
      busy,
      parameters: current?.result.parameters ?? null,
    }),
    dispose: (): Promise<void> => {
      closed = true;
      closing ??= (async (): Promise<void> => {
        try {
          await retire();
        } finally {
          try {
            camera.dispose();
            controlsSignal.abort();
          } finally {
            try {
              mount?.stop();
            } finally {
              dom.dispose();
            }
          }
        }
      })();
      return closing;
    },
  };

  // Toolbar, sidebar and viewport clicks drive the same page methods as automation.
  const guard: (action: () => void) => void = (action: () => void): void => {
    try {
      action();
    } catch (error) {
      report("error", describe(error));
      sync();
    }
  };
  const controlsSignal: AbortController = new AbortController();
  const showView: (value: normalizeHumanView.IView) => void =
    mountHumanViewControls(
      dom.toolbar,
      controlsSignal.signal,
      (query: string): void => guard((): void => void page.setView(query)),
    );
  dom.listen({
    alias: (alias: string): void => {
      void page.loadAlias(alias).catch(console.error);
    },
    pass: (next: string): void =>
      guard((): void => page.setPass(next as IHumanViewerPage.Pass)),
    camera: (name: string): void => guard((): void => page.setCamera(name)),
    curves: (value: string): void =>
      guard((): void => {
        const selection: IHumanViewerPage.ISelection = page.setCurves(value);
        report(
          "ok",
          `곡선 ${selection.selected.length}개 선택, 피부 구간 ${selection.shaped.length}개 강조`,
        );
      }),
    pick: (x: number, y: number): string | null =>
      current?.pick(
        camera.active,
        new THREE.Vector2(x, y),
        new THREE.Vector2(
          2 / (dom.canvas.clientWidth || 1),
          2 / (dom.canvas.clientHeight || 1),
        ),
      ) ?? null,
  });
  report("ok", "생성할 입력을 선택하십시오.");
  return page;
}
