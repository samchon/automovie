import { type IAutoMovieViewerHandle, mountViewer } from "@automovie/viewer";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { AutoMovieHuman } from "../../../human/src/AutoMovieHuman";
import type { IAutoMovieHumanGenerated } from "../../../human/src/structures/IAutoMovieHumanGenerated";
import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { HumanCaptureCamera } from "./HumanCaptureCamera";
import { HumanViewerModel } from "./HumanViewerModel";
import type { IHumanViewerPage } from "./IHumanViewerPage";
import { admitHumanParameters } from "./admitHumanParameters";
import { captureHumanViewerFrame } from "./captureHumanViewerFrame";
import { layoutHumanViewerPage } from "./layoutHumanViewerPage";

/** What a load produces before display. */
interface IProduced {
  result: IAutoMovieHumanGenerated;
  alias: string | null;
  milliseconds: number | null;
}

/**
 * Mount the single Human page: generate, display, select curves and capture `AutoMovieHuman` results.
 *
 * One scene, one `mountViewer` renderer and one key light serve both the
 * interactive OrbitControls view and every PNG capture, so the PNG service
 * shows exactly what a person sees here. The scene reproduces the reference
 * photographs' conditions (background `#f1f3f6`, hemisphere 0.6, key 2.2,
 * fov 30); {@link IHumanViewerPage.capture} additionally pins the drawing
 * buffer to 1200 x 1200 at pixel ratio 1 and places the camera with
 * {@link HumanCaptureCamera.place}. The interactive view draws only when the
 * camera, size, pass, selection or model changes, so an idle page, including
 * the PNG worker's resident one, spends no GPU time.
 *
 * Every load retires the displayed model before generating, so a failure
 * leaves an empty viewport with the error, never an old model. Parameters come
 * from typed modules only (see {@link admitHumanParameters}). The page keeps
 * `alias`, `pass`, `camera` and `curves` in its URL and links the PNG URL of
 * the same view.
 *
 * @param root Element whose children this page replaces and owns until dispose.
 * @returns The page control surface, also published as `window.__automovieHuman` by the entry.
 *
 * @evidence contracts/common.md#principled-implementation Existing buildModel and mountViewer display the public generator's exact model under the reference scene conditions; captures read the preserved 1200 x 1200 buffer drawn with the reference framing rule.
 * @evidence contracts/common.md#clear-and-simple-design The page owns scene, renderer, controls and load serialization; model display state is HumanViewerModel, Human display rules createHumanPartStyle, framing HumanCaptureCamera, readback captureHumanViewerFrame and DOM layoutHumanViewerPage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Loads retire the old model first and report failures explicitly; JSON is admitted only by equality with a typed example; no old model or image is shown as current.
 * @evidence contracts/common.md#meaningful-documentation States the shared scene, capture conditions, on-demand drawing, failure rule and URL mirroring.
 * @evidence contracts/performance.md#efficient-algorithms Draws only when camera, size, pass, selection or model change; a load costs one generation and one model build, a capture one draw and PNG encode.
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

  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    HumanCaptureCamera.fov,
    1,
    0.01,
    100,
  );
  camera.position.set(4, 1, 4);
  const shot: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    HumanCaptureCamera.fov,
    1,
  );
  const controls: OrbitControls = new OrbitControls(camera, dom.canvas);

  let dirty: boolean = true;
  controls.addEventListener("change", (): void => {
    dirty = true;
  });

  let current: HumanViewerModel | undefined;
  let generation: number = 0;
  let pass: IHumanViewerPage.Pass = "surface";
  let view: string = "whole-oblique-front";
  let curves: string = "";
  let busy: boolean = false;
  let closed: boolean = false;
  let closing: Promise<void> | undefined;
  let failed: boolean = false;
  const size: { width: number; height: number; ratio: number } = {
    width: 0,
    height: 0,
    ratio: 0,
  };

  // Draw on demand: returning true tells mountViewer the frame is handled.
  let mount: IAutoMovieViewerHandle | undefined;
  const frame: () => boolean = (): boolean => {
    controls.update();
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
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      dirty = true;
    }
    if (!dirty) return true;
    dirty = false;

    // The key light keeps the capture rule's camera-relative offset.
    const diagonal: number =
      current?.bounds.getSize(new THREE.Vector3()).length() ?? 2;
    camera.updateMatrixWorld();
    key.position
      .copy(controls.target)
      .add(
        new THREE.Vector3(1, 1.4, 0.7)
          .applyQuaternion(camera.quaternion)
          .multiplyScalar(diagonal),
      );
    key.target.position.copy(controls.target);
    return false;
  };
  try {
    mount = mountViewer(dom.canvas, scene, camera, frame, {
      preserveDrawingBuffer: true,
    });
  } catch (error) {
    controls.dispose();
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

  /** Mirror the view into the URL and the PNG link, so it can be fetched as a PNG. */
  const sync: () => void = (): void => {
    const alias: string | null = current?.loaded.alias ?? null;
    const url: URL = new URL(location.href);
    url.searchParams.delete("document");
    for (const [name, value] of [
      ["alias", alias ?? ""],
      ["pass", pass],
      ["camera", view],
      ["curves", curves],
    ] as const)
      if (value === "") url.searchParams.delete(name);
      else url.searchParams.set(name, value);
    history.replaceState(null, "", url);
    dom.setLinks(alias, view, pass, curves);
    dom.setCurves(current?.curveIds() ?? [], curves);
    dom.setPassAvailability(current?.loaded.construction ?? false, pass);
    dom.camera.value = view;
    dirty = true;
  };

  /** Remove and dispose the displayed model, leaving the empty viewport. */
  const retire: () => Promise<void> = async (): Promise<void> => {
    const previous: HumanViewerModel | undefined = current;
    current = undefined;
    dom.empty.hidden = false;
    dom.emptyDetail.textContent = "";
    dom.state.textContent = "";
    dom.parameters.textContent = "";
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
      const model: HumanViewerModel = new HumanViewerModel(
        produced.result,
        produced.alias,
        produced.milliseconds,
        generation + 1,
      );
      current = model;
      generation = model.loaded.generation;
      scene.add(model.object);
      if (!model.loaded.construction) pass = "surface";
      model.setPass(pass);

      // Keep the selection across loads when this model still has its curves.
      let note: string = "";
      try {
        model.setCurves(curves);
      } catch (error) {
        curves = "";
        note = " (이전 곡선 선택 해제: " + describe(error) + ")";
      }
      setCamera(view);
      dom.empty.hidden = true;
      dom.state.textContent = JSON.stringify(
        {
          generation: model.loaded.generation,
          alias: model.loaded.alias,
          generateMilliseconds: model.loaded.generateMilliseconds,
          bounds: model.loaded.bounds,
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
      dom.setLegend(model.legend());
      sync();
      report(
        "ok",
        "생성 완료" +
          (produced.alias === null ? "" : " (" + produced.alias + ")") +
          (produced.milliseconds === null
            ? ""
            : ", " + produced.milliseconds.toFixed(0) + " ms") +
          ": 파트 " +
          model.loaded.parts.length +
          "개" +
          note,
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

  /** Place the interactive camera on a named capture camera at the viewport aspect. */
  const setCamera: (name: string) => void = (name: string): void => {
    if (current === undefined) throw new Error("No generated Human is loaded");
    const placement: HumanCaptureCamera.IPlacement = HumanCaptureCamera.place(
      camera,
      key,
      current.describe(name),
      current.bounds,
    );
    view = name;
    controls.target.fromArray(placement.target);
    controls.update();
    sync();
  };

  /** The loaded model, or a thrown error naming the missing load. */
  const loaded: () => HumanViewerModel = (): HumanViewerModel => {
    if (current === undefined) throw new Error("No generated Human is loaded");
    return current;
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
      sync();
    },
    setCamera,
    setCurves: (value: string): IHumanViewerPage.ISelection => {
      const selection: IHumanViewerPage.ISelection = loaded().setCurves(value);
      curves = selection.curves;
      sync();
      return selection;
    },
    curves: (): string[] => current?.curveIds() ?? [],
    capture: (
      name: string,
      next: IHumanViewerPage.Pass,
      selection: string,
    ): IHumanViewerPage.ICapture => {
      if (closed || busy || mount === undefined)
        throw new Error("Human viewer has no idle loaded model to capture");
      const model: HumanViewerModel = loaded();
      try {
        // The frame's own pass and selection; both are restored below.
        const visibleParts: string[] = model.setPass(next);
        const frameCurves: IHumanViewerPage.ISelection =
          model.setCurves(selection);
        const drawn: ReturnType<typeof captureHumanViewerFrame> =
          captureHumanViewerFrame(
            mount.renderer,
            scene,
            shot,
            key,
            model.describe(name),
            model.bounds,
          );
        return {
          png: drawn.png,
          capturedUtc: drawn.capturedUtc,
          metadata: {
            generation: model.loaded.generation,
            alias: model.loaded.alias,
            pass: next,
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
        model.setPass(pass);
        size.width = 0;
        dirty = true;
      }
    },
    snapshot: (): IHumanViewerPage.ISnapshot => ({
      generation: current?.loaded.generation ?? 0,
      alias: current?.loaded.alias ?? null,
      pass,
      curves: current?.selection() ?? { curves: "", selected: [], shaped: [] },
      status: dom.status.textContent ?? "",
      failed,
      parameters: current?.result.parameters ?? null,
    }),
    dispose: (): Promise<void> => {
      closed = true;
      closing ??= (async (): Promise<void> => {
        try {
          await retire();
        } finally {
          try {
            controls.dispose();
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
  dom.listen({
    alias: (alias: string): void => {
      void page.loadAlias(alias).catch(console.error);
    },
    pass: (next: string): void =>
      guard((): void => page.setPass(next as IHumanViewerPage.Pass)),
    camera: (name: string): void => guard((): void => setCamera(name)),
    curves: (value: string): void =>
      guard((): void => {
        const selection: IHumanViewerPage.ISelection = page.setCurves(value);
        report(
          "ok",
          "곡선 " +
            selection.selected.length +
            "개 선택, 피부 구간 " +
            selection.shaped.length +
            "개 강조",
        );
      }),
    pick: (x: number, y: number): string | null =>
      current?.pick(
        camera,
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
