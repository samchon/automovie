import { type IAutoMovieViewerHandle, mountViewer } from "@automovie/viewer";
import * as THREE from "three";

import { AutoMovieHuman } from "../../../human/src/AutoMovieHuman";
import { AutoMovieHumanBodyCalibration } from "../../../human/src/generation/AutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanGenerated } from "../../../human/src/structures/IAutoMovieHumanGenerated";
import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { HumanCaptureCamera } from "./HumanCaptureCamera";
import { HumanViewerCamera } from "./HumanViewerCamera";
import { HumanViewerModel } from "./HumanViewerModel";
import type { IHumanViewerPage } from "./IHumanViewerPage";
import { admitHumanParameters } from "./admitHumanParameters";
import { captureHumanViewerFrame } from "./captureHumanViewerFrame";
import { drawHumanCurveDiagram } from "./drawHumanCurveDiagram";
import { layoutHumanViewerPage } from "./layoutHumanViewerPage";
import { mountHumanViewControls } from "./mountHumanViewControls";
import { normalizeHumanCurves } from "./normalizeHumanCurves";
import { normalizeHumanView } from "./normalizeHumanView";
import { readHumanLegend } from "./readHumanLegend";
import { resolveHumanCurves } from "./resolveHumanCurves";

/** What a load produces before display. */
interface IProduced {
  result: IAutoMovieHumanGenerated;
  alias: string | null;
  milliseconds: number | null;
}

/** URL variables the page mirrors from its free view. */
const FREE: readonly string[] = [
  "az",
  "el",
  "view",
  "target",
  "dist",
  "ortho",
  "isolate",
  "fit",
  "garment",
];

/**
 * Mount the single Human page: generate, display, select and isolate curves, and capture `AutoMovieHuman` results.
 *
 * One scene, one `mountViewer` renderer and one key light serve both the
 * interactive view and every PNG capture, so the PNG service shows exactly
 * what a person sees here. The scene reproduces the reference photographs'
 * conditions (background `#f1f3f6`, hemisphere 0.6, key 2.2, fov 30);
 * {@link IHumanViewerPage.capture} additionally pins the drawing buffer to
 * 1200 x 1200 at pixel ratio 1 and places the camera with
 * {@link HumanCaptureCamera.place}. Free-view variables (`az`, `el`, `target`,
 * `dist`, `ortho`, `isolate`, `fit`, `garment`) modify the named camera on the page and in
 * captures alike. The page draws only when the camera, size, pass, selection
 * or model changes, so an idle page, including the worker's resident one,
 * spends no GPU time.
 *
 * Every load retires the displayed model before generating, so a failure
 * leaves an empty viewport with the error, never an old model. Parameters come
 * from typed modules only (see {@link admitHumanParameters}). The page keeps
 * `alias`, `pass`, `camera`, `curves` and the free view in its URL and links
 * the PNG URL of the same view.
 *
 * @param root Element whose children this page replaces and owns until dispose.
 * @returns The page control surface, also published as `window.__automovieHuman` by the entry.
 *
 * @evidence contracts/common.md#principled-implementation Existing buildModel and mountViewer display the public generator's exact model under the reference scene conditions; captures read the preserved 1200 x 1200 buffer drawn with the reference framing rule, and the page renders its active perspective or orthographic camera itself.
 * @evidence contracts/common.md#clear-and-simple-design The page owns scene, renderer and load serialization; display state is HumanViewerModel, cameras HumanViewerCamera, Human display rules createHumanPartStyle, framing HumanCaptureCamera, readback captureHumanViewerFrame, diagrams drawHumanCurveDiagram and DOM layoutHumanViewerPage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Loads retire the old model first and report failures explicitly; JSON is admitted only by equality with a typed example; no old model or image is shown as current.
 * @evidence contracts/common.md#meaningful-documentation States the shared scene, capture conditions, free view, on-demand drawing, failure rule and URL mirroring.
 * @evidence contracts/performance.md#efficient-algorithms Draws only when something visible changes; a load costs one generation and one model build, a capture up to six restyles, one draw and one PNG encode.
 * @evidence contracts/performance.md#reuse-equivalent-work One scene, renderer and model serve interaction and every capture of a generation; display changes restyle instead of regenerating.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds at most one model; a load joins the previous model's retirement first, dispose releases model, controls, render loop and DOM, and loads are serialized by a busy flag.
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
    const url: URL = new URL(location.href);
    for (const name of ["document", ...FREE]) url.searchParams.delete(name);
    for (const name of ["alias", "pass", "camera", "curves"])
      url.searchParams.delete(name);
    for (const [name, value] of [
      ["alias", alias ?? ""],
      ["pass", pass],
      ["camera", view],
    ] as const)
      if (value === "") url.searchParams.delete(name);
      else url.searchParams.set(name, value);

    // Curves and the free view keep their readable canonical spelling.
    const search: string = [
      url.searchParams.toString(),
      normalizeHumanCurves.query(curves),
      free.text,
    ]
      .filter((part: string): boolean => part !== "")
      .join("&");
    history.replaceState(
      null,
      "",
      url.pathname + (search === "" ? "" : "?" + search) + url.hash,
    );
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
        selection!.selected.map((id: string, index: number) => ({
          id,
          colour: selection!.colours[index]!,
        })),
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

  /** Serialize loads: retire, produce, display, and report failure explicitly. */
  const replace: (
    produce: () => IProduced,
  ) => Promise<IHumanViewerPage.ILoaded> = async (
    produce: () => IProduced,
  ): Promise<IHumanViewerPage.ILoaded> => {
    if (closed || busy) throw new Error("Human viewer is closed or busy");
    busy = true;
    try {
      await retire();
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

      // The page may have been disposed while the images decoded.
      if (closed) {
        await model.dispose();
        throw new Error("Human viewer closed during texture decoding");
      }
      current = model;
      generation = model.loaded.generation;
      scene.add(model.object);
      if (!model.loaded.construction) pass = "surface";
      model.setPass(pass);

      // Keep the selection and free view across loads when they still apply.
      let note: string = "";
      try {
        model.setCurves(curves);
        model.setIsolate(free.value.isolate);
        model.setGarment(free.value.garment);
      } catch (error) {
        curves = "";
        free = normalizeHumanView((): null => null);
        note = " (이전 곡선 선택 해제: " + describe(error) + ")";
      }
      place();
      dom.empty.hidden = true;
      const { generateMilliseconds, bounds } = model.loaded;
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
      await retire().catch(console.error);
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
    (parameters: IAutoMovieHumanParameters, alias: string | null) =>
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
    ): Promise<IHumanViewerPage.ILoaded> => replace(run(parameters, null)),
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
        model.setGarment(next.value.garment);
        free = next;
        place();
      } catch (error) {
        free = previous;
        model.setIsolate(previous.value.isolate);
        model.setGarment(previous.value.garment);
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
      const frameView: ReturnType<typeof normalizeHumanView> =
        normalizeHumanView((variable: string): string | null =>
          new URLSearchParams(query).get(variable),
        );
      try {
        // The frame's own pass, selection and view; all are restored below.
        model.setPass(next);
        const frameCurves: IHumanViewerPage.ISelection =
          model.setCurves(selection);
        model.setIsolate(frameView.value.isolate);
        model.setGarment(frameView.value.garment);
        const visibleParts: string[] = model.setPass(next);
        const descriptor: HumanCaptureCamera.IDescriptor = model.describe(
          name,
          frameView.value,
        );
        const drawn: ReturnType<typeof captureHumanViewerFrame> =
          captureHumanViewerFrame(
            mount.renderer,
            scene,
            descriptor.orthographic === true
              ? shots.orthographic
              : shots.perspective,
            key,
            descriptor,
            model.bounds,
            frameCurves.selected.map((id: string, index: number) => ({
              id,
              colour: frameCurves.colours[index]!,
            })),
          );
        return {
          png: drawn.png,
          capturedUtc: drawn.capturedUtc,
          metadata: {
            generation: model.loaded.generation,
            alias: model.loaded.alias,
            pass: next,
            view: frameView.text,
            curves: frameCurves,
            visibleParts,
            camera: drawn.placement,
            bounds: model.loaded.bounds,
            canvas: drawn.canvas,
            background:
              "#" +
              new THREE.Color(HumanCaptureCamera.background).getHexString(),
            hemisphere: {
              sky: "#" + hemisphere.color.getHexString(),
              ground: "#" + hemisphere.groundColor.getHexString(),
              intensity: hemisphere.intensity,
            },
            renderer: drawn.renderer,
          },
        };
      } finally {
        // Restore the interactive view; the next frame resizes and redraws.
        model.setCurves(curves);
        model.setIsolate(free.value.isolate);
        model.setGarment(free.value.garment);
        model.setPass(pass);
        size.width = 0;
        dirty = true;
      }
    },
    diagram: async (
      alias: string,
      list: string,
      format: "svg" | "png",
    ): Promise<string> => {
      // The legend reports the alias's model scale against the calibration.
      const height: number | null = admitHumanParameters({ alias }).parameters
        .body.controls.height.value;
      const svg: string = drawHumanCurveDiagram(
        AutoMovieHumanBodyCalibration,
        list,
        (height ?? Number.NaN) / AutoMovieHumanBodyCalibration.stature,
      );
      if (format === "svg") return svg;
      const image: HTMLImageElement = new Image();
      image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      await image.decode();
      const canvas: HTMLCanvasElement = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d")!.drawImage(image, 0, 0);
      return canvas.toDataURL("image/png");
    },
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
