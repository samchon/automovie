import type {
  IAutoMovieDrawCall,
  IAutoMovieDrawDescription,
  IAutoMovieDrawResult,
  IAutoMovieInspectionCamera,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieInspectionLabel,
  IAutoMovieInspectionLegendEntry,
  IAutoMovieInspectionRequest,
  IAutoMovieInspectionTrail,
  IAutoMovieInspectionView,
  IAutoMovieMark,
} from "@automovie/interface";
import * as THREE from "three";

import { resolveAutoMovieCapturePatterns } from "../capture/resolveAutoMovieCapturePatterns.js";
import type { IAutoMovieInspectionHandle } from "../scene/inspection/IAutoMovieInspectionHandle.js";
import type { IAutoMovieInspectionPath } from "../scene/inspection/IAutoMovieInspectionPath.js";
import { listAutoMovieInspectionPaths } from "../scene/inspection/listAutoMovieInspectionPaths.js";
import { markAutoMovieInspectionTrails } from "../scene/inspection/markAutoMovieInspectionTrails.js";
import { parseAutoMovieInspectionView } from "../scene/inspection/parseAutoMovieInspectionView.js";
import { planAutoMovieInspectionTrailTimes } from "../scene/inspection/planAutoMovieInspectionTrailTimes.js";
import { renderWithAutoMovieInspectionDiagnostics } from "../scene/inspection/renderWithAutoMovieInspectionDiagnostics.js";
import { resolveAutoMovieInspectionView } from "../scene/inspection/resolveAutoMovieInspectionView.js";
import { sampleAutoMovieInspectionTrails } from "../scene/inspection/sampleAutoMovieInspectionTrails.js";
import type { IAutoMovieViewerSubjectBounds } from "../scene/subjectViewpoint/IAutoMovieViewerSubjectBounds.js";
import { AUTO_MOVIE_DRAW_GLOBALS } from "./AUTO_MOVIE_DRAW_GLOBALS.js";
import type { AutoMovieDrawSubjects } from "./AutoMovieDrawSubjects.js";
import type { IAutoMovieDrawFunction } from "./IAutoMovieDrawFunction.js";
import type { IAutoMovieDrawProps } from "./IAutoMovieDrawProps.js";
import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";
import type { IAutoMovieDrawSubject } from "./IAutoMovieDrawSubject.js";
import { describeAutoMovieDrawScene } from "./describeAutoMovieDrawScene.js";
import { encodeAutoMovieDrawPixels } from "./encodeAutoMovieDrawPixels.js";
import { observeAutoMoviePlacedInspection } from "./observeAutoMoviePlacedInspection.js";
import { replaceAutoMovieDrawInspection } from "./replaceAutoMovieDrawInspection.js";
import { selectAutoMovieDrawSubject } from "./selectAutoMovieDrawSubject.js";

/**
 * Side of the block the beauty pass is drawn at and averaged down from, so its edges are antialiased by area: two, the supersampling the motion harness drew its stills at.
 */
const SUPERSAMPLE = 2 as const;

/**
 * Install the draw-only function on a page: read the props the host injected, and answer `describe` and `draw` for the subject they name, drawing offscreen with no interface.
 *
 * The page's script calls it once with its module's `subjects`. The subject is created on the first call, with one WebGL renderer on a canvas that is never attached to the document, without antialiasing. A draw then:
 *
 * 1. restores the previous inspection before placement, so a subject may replace its objects during a seek;
 * 2. for a fitted view, places and inspects each framing second and frames the union of what the current inspection leaves drawn, or its focus, measured once per view and selection;
 * 3. for each `trail` pattern of the request, samples the matched objects over `planAutoMovieInspectionTrailTimes` with `sampleAutoMovieInspectionTrails`, then seeks the call's second and awaits readiness. When the subject supplies diagnostics, the draw observes the settled delivery scene before applying a fresh inspection to the resulting objects with their current marks and sampled trails; no seek occurs between this application and drawing;
 * 4. draws through the camera `resolveAutoMovieInspectionView` gives, at the call's raster, or for the `beauty` shade at twice each side with mark lines twice as wide;
 * 5. reads the drawn pixels back, flips them to rows from the top and averages a supersampled picture down, places the request's labels at the label scale, copies the inspection's legend of the marks drawn, and resolves every pattern of the request and view by `resolveAutoMovieCapturePatterns` against the scene's object paths and the selected mark paths, so the record names what each matched.
 *
 * It draws to the renderer's own canvas and reads it back in the same task, so colour conversion and tone mapping are the ones the interactive page applies to its canvas; a render target would skip both. The film camera's aspect is set to the picture's, as the page sets it to its canvas.
 *
 * ```ts
 * import { installAutoMovieDraw } from "@automovie/render";
 * import { subjects } from "./subjects";
 * installAutoMovieDraw(subjects);
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who calls it, when the subject and renderer are made, every step of a draw in order, why the canvas is read instead of a render target, and the supersampling rule.
 * @evidence contracts/development/implementation.md#principled-implementation WebGL's `readPixels` on the default framebuffer, read before the task ends, returns what the page shows; the inspection, the view grammar and the camera resolution are the inspection core's, so a still and the page draw the same scene through the same code. Framing on all the run's seconds keeps one camera per view, as `.agents/skills/visual-debugging/capture.md` asks for a view a later round compares.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One placed observer is invoked by the final seek alone, before inspection. One loader owns the subject/renderer, one placer seeks and gathers marks/trails, one inspection lifecycle restores before placement and binds current objects, and one bounds cache is keyed by view/selection/trails. Describing, pixel encoding and pattern resolution retain their owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A subject that is not ready is awaited, never drawn half placed; a view or request the inspection refuses throws to the host, which records the cell as not drawn.
 * @evidence contracts/development/implementation.md#efficient-algorithms A draw places the actual second and applies inspection to its current objects, then renders and reads back linearly in pixels. A new fitted view additionally places and inspects each framing second; trails add their requested samples. Each necessary inspection includes its mesh/triangle measurements rather than silently measuring removed objects.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The subject, renderer and framing boxes keyed by view/selection/seconds are shared across draws. Inspection handles are recreated after placement because seek may replace geometry; unchanged request text proves no object identity or measurement equivalence.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The page holds one subject, one renderer, one applied inspection and one box per framed view for its life; leaving the page restores the inspection and disposes the subject and renderer.
 */
export function installAutoMovieDraw(
  subjects: AutoMovieDrawSubjects,
  target: Record<string, unknown> = globalThis as unknown as Record<
    string,
    unknown
  >,
): void {
  const injected: IAutoMovieDrawProps = (target[
    AUTO_MOVIE_DRAW_GLOBALS.props
  ] as IAutoMovieDrawProps | undefined) ?? { subject: null, props: null };
  const offered: Readonly<Record<string, IAutoMovieDrawSubject>> = subjects(
    injected.props,
  );

  // The subject and the renderer, made once on the first call.
  let loading: Promise<ILoaded> | null = null;
  const load: () => Promise<ILoaded> = (): Promise<ILoaded> =>
    (loading ??= (async (): Promise<ILoaded> => {
      const name: string = selectAutoMovieDrawSubject(
        Object.keys(offered),
        injected.subject,
      );
      const scene: IAutoMovieDrawScene = await offered[name]!.create();
      const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        preserveDrawingBuffer: false,
      });
      renderer.setPixelRatio(1);
      return { name, scene, renderer };
    })());

  // The subject placed at a second, with its own marks and the trails the request asks for there.
  const place: (
    loaded: ILoaded,
    request: IAutoMovieInspectionRequest,
    seconds: number,
    onPlaced?: () => void,
  ) => Promise<IAutoMovieMark[]> = async (
    loaded: ILoaded,
    request: IAutoMovieInspectionRequest,
    seconds: number,
    onPlaced?: () => void,
  ): Promise<IAutoMovieMark[]> => {
    const { scene } = loaded;
    const trails: IAutoMovieInspectionTrail[] = [];
    if (request.trail.length !== 0) {
      const times: number[] = planAutoMovieInspectionTrailTimes({
        request,
        seconds,
        durationSeconds: scene.durationSeconds,
      });
      for (const pattern of request.trail)
        trails.push(
          ...(await sampleAutoMovieInspectionTrails({
            scene: scene.scene,
            pattern,
            times,
            seek: (at: number): Promise<void> => scene.seek(at),
          })),
        );
    }
    await scene.seek(seconds);
    onPlaced?.();
    return [
      ...(scene.marks?.(seconds) ?? []),
      ...markAutoMovieInspectionTrails(trails, seconds),
    ];
  };

  // The current inspection ends before any placement can replace its objects.
  let applied: { handle: IAutoMovieInspectionHandle } | null = null;
  const inspect: (
    loaded: ILoaded,
    request: IAutoMovieInspectionRequest,
    seconds: number,
    onPlaced?: () => void,
  ) => Promise<IAutoMovieInspectionHandle> = async (
    loaded: ILoaded,
    request: IAutoMovieInspectionRequest,
    seconds: number,
    onPlaced?: () => void,
  ): Promise<IAutoMovieInspectionHandle> => {
    const previous: IAutoMovieInspectionHandle | null = applied?.handle ?? null;
    applied = null;
    const handle: IAutoMovieInspectionHandle =
      await replaceAutoMovieDrawInspection({
        previous,
        scene: loaded.scene.scene,
        request,
        renderer: loaded.renderer,
        place: (): Promise<IAutoMovieMark[]> =>
          place(loaded, request, seconds, onPlaced),
      });
    applied = { handle };
    return handle;
  };

  // Framing boxes, one per view text, selection and span of seconds.
  const framings: Map<string, IAutoMovieViewerSubjectBounds | null> = new Map();
  const frame: (
    loaded: ILoaded,
    call: IAutoMovieDrawCall,
    view: IAutoMovieInspectionView.INamed,
  ) => Promise<IAutoMovieViewerSubjectBounds | null> = async (
    loaded: ILoaded,
    call: IAutoMovieDrawCall,
    view: IAutoMovieInspectionView.INamed,
  ): Promise<IAutoMovieViewerSubjectBounds | null> => {
    const key: string = JSON.stringify([
      call.view,
      call.request.parts,
      call.request.hide,
      call.request.surface,
      call.request.marks,
      call.request.trail,
      call.request.reach,
      call.request.ticks,
      call.frame,
    ]);
    if (framings.has(key)) return framings.get(key)!;
    let union: IAutoMovieViewerSubjectBounds | null = null;
    for (const seconds of call.frame) {
      const handle: IAutoMovieInspectionHandle = await inspect(
        loaded,
        call.request,
        seconds,
      );
      union = unite(union, handle.bounds(view.focus));
    }
    framings.set(key, union);
    return union;
  };

  const draw: IAutoMovieDrawFunction = {
    describe: async (): Promise<IAutoMovieDrawDescription> => {
      const loaded: ILoaded = await load();
      const context: WebGLRenderingContext | WebGL2RenderingContext =
        loaded.renderer.getContext();
      const debug: WEBGL_debug_renderer_info | null = context.getExtension(
        "WEBGL_debug_renderer_info",
      );
      return {
        subject: describeAutoMovieDrawScene(loaded.name, loaded.scene),
        renderer: String(
          context.getParameter(
            debug === null ? context.RENDERER : debug.UNMASKED_RENDERER_WEBGL,
          ),
        ),
      };
    },
    draw: async (call: IAutoMovieDrawCall): Promise<IAutoMovieDrawResult> => {
      const loaded: ILoaded = await load();
      const { scene, renderer } = loaded;

      // The supersampled surface keeps marks at the requested output-pixel width.
      const factor: number = call.request.shade === "beauty" ? SUPERSAMPLE : 1;

      // 2. A fitted view's framing over the call's seconds.
      const view: IAutoMovieInspectionView = parseAutoMovieInspectionView(
        call.view,
      );
      const fitted: boolean =
        view.type === "named" &&
        !(scene.views !== undefined && Object.hasOwn(scene.views, view.name));
      const bounds: IAutoMovieViewerSubjectBounds | null =
        fitted && view.type === "named"
          ? await frame(loaded, call, view)
          : null;

      // 3. The second itself, once the subject is ready.
      let diagnostics: IAutoMovieInspectionDiagnostics | undefined;
      const delivery: boolean = call.inspectionDiagnostics === "delivery";
      const handle: IAutoMovieInspectionHandle = await inspect(
        loaded,
        { ...call.request, stroke: call.request.stroke * factor },
        call.seconds,
        (): void => {
          diagnostics = observeAutoMoviePlacedInspection(
            scene,
            call.seconds,
            delivery ? "delivery" : "capture",
            { renderer, factor: SUPERSAMPLE },
          );
        },
      );

      // 4. Draw through the resolved camera at the drawn raster.
      const width: number = call.width * factor;
      const height: number = call.height * factor;
      if (scene.camera.aspect !== call.width / call.height) {
        scene.camera.aspect = call.width / call.height;
        scene.camera.updateProjectionMatrix();
      }
      const resolved: {
        camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
        record: IAutoMovieInspectionCamera;
      } = resolveAutoMovieInspectionView({
        view,
        text: call.view,
        bounds,
        camera: scene.camera,
        ...(scene.views === undefined ? {} : { views: scene.views }),
        seconds: call.seconds,
        width: call.width,
        height: call.height,
      });
      renderer.setSize(width, height, false);
      handle.resize(width, height);
      const diagnosticLegend: readonly IAutoMovieInspectionLegendEntry[] =
        renderWithAutoMovieInspectionDiagnostics({
          scene: scene.scene,
          diagnostics:
            delivery || call.request.shade !== "beauty"
              ? undefined
              : diagnostics,
          render: (): void => renderer.render(scene.scene, resolved.camera),
          width,
          height,
          stroke: call.request.stroke * factor,
        });

      // 5. Read back before the task ends, then the labels at the output raster.
      const context: WebGLRenderingContext | WebGL2RenderingContext =
        renderer.getContext();
      const bytes: Uint8Array = new Uint8Array(width * height * 4);
      context.readPixels(
        0,
        0,
        width,
        height,
        context.RGBA,
        context.UNSIGNED_BYTE,
        bytes,
      );
      const labels: IAutoMovieInspectionLabel[] = handle.labels(
        resolved.camera,
        call.width,
        call.height,
        call.scale,
      ).labels;
      return {
        pixels: encodeAutoMovieDrawPixels(bytes, width, height, factor),
        width: call.width,
        height: call.height,
        labels: labels.map(
          (
            label: IAutoMovieInspectionLabel,
          ): IAutoMovieDrawResult["labels"][number] => ({
            text: label.text,
            x: label.x,
            y: label.y,
          }),
        ),
        legend: [
          ...handle.legend.map(
            (
              entry: IAutoMovieInspectionLegendEntry,
            ): IAutoMovieInspectionLegendEntry => ({ ...entry }),
          ),
          ...diagnosticLegend,
        ],
        ...(diagnostics === undefined ? {} : { diagnostics }),
        camera: resolved.record,
        resolved: resolveAutoMovieCapturePatterns({
          paths: [
            ...listAutoMovieInspectionPaths(scene.scene).map(
              (entry: IAutoMovieInspectionPath): string => entry.path,
            ),
            ...handle.selected,
          ],
          request: call.request,
          view: call.view,
        }),
      };
    },
  };
  target[AUTO_MOVIE_DRAW_GLOBALS.draw] = draw;

  // Leaving the page releases what it holds.
  const listen: unknown = target["addEventListener"];
  if (typeof listen === "function")
    listen.call(
      target,
      "pagehide",
      (): void => {
        applied?.handle.restore();
        void loading?.then((loaded: ILoaded): void => {
          loaded.scene.dispose();
          loaded.renderer.dispose();
        });
      },
      { once: true },
    );
}

/** The created subject and the page's renderer. */
interface ILoaded {
  /** The subject's name. */
  name: string;

  /** The created subject. */
  scene: IAutoMovieDrawScene;

  /** The renderer, on a canvas never attached to the document. */
  renderer: THREE.WebGLRenderer;
}

/** The smallest box holding two boxes, either of which may be absent. */
function unite(
  a: IAutoMovieViewerSubjectBounds | null,
  b: IAutoMovieViewerSubjectBounds | null,
): IAutoMovieViewerSubjectBounds | null {
  if (a === null || b === null) return a ?? b;
  return {
    min: {
      x: Math.min(a.min.x, b.min.x),
      y: Math.min(a.min.y, b.min.y),
      z: Math.min(a.min.z, b.min.z),
    },
    max: {
      x: Math.max(a.max.x, b.max.x),
      y: Math.max(a.max.y, b.max.y),
      z: Math.max(a.max.z, b.max.z),
    },
  };
}
