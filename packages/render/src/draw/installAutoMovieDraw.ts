import type { IAutoMovieMark } from "@automovie/engine";
import * as THREE from "three";

import type { IAutoMovieViewerSubjectBounds } from "../scene/subjectViewpoint/IAutoMovieViewerSubjectBounds.js";
import { resolveAutoMovieCapturePatterns } from "../capture/resolveAutoMovieCapturePatterns.js";
import { applyAutoMovieInspection } from "../scene/inspection/applyAutoMovieInspection.js";
import { formatAutoMovieInspectionRequest } from "../scene/inspection/formatAutoMovieInspectionRequest.js";
import type { IAutoMovieInspectionCamera } from "../scene/inspection/IAutoMovieInspectionCamera.js";
import type { IAutoMovieInspectionHandle } from "../scene/inspection/IAutoMovieInspectionHandle.js";
import type { IAutoMovieInspectionLabel } from "../scene/inspection/IAutoMovieInspectionLabel.js";
import type { IAutoMovieInspectionLegendEntry } from "../scene/inspection/IAutoMovieInspectionLegendEntry.js";
import type { IAutoMovieInspectionPath } from "../scene/inspection/IAutoMovieInspectionPath.js";
import type { IAutoMovieInspectionRequest } from "../scene/inspection/IAutoMovieInspectionRequest.js";
import type { IAutoMovieInspectionTrail } from "../scene/inspection/IAutoMovieInspectionTrail.js";
import type { IAutoMovieInspectionView } from "../scene/inspection/IAutoMovieInspectionView.js";
import { listAutoMovieInspectionPaths } from "../scene/inspection/listAutoMovieInspectionPaths.js";
import { markAutoMovieInspectionTrails } from "../scene/inspection/markAutoMovieInspectionTrails.js";
import { parseAutoMovieInspectionView } from "../scene/inspection/parseAutoMovieInspectionView.js";
import { planAutoMovieInspectionTrailTimes } from "../scene/inspection/planAutoMovieInspectionTrailTimes.js";
import { resolveAutoMovieInspectionView } from "../scene/inspection/resolveAutoMovieInspectionView.js";
import { sampleAutoMovieInspectionTrails } from "../scene/inspection/sampleAutoMovieInspectionTrails.js";
import { AUTO_MOVIE_DRAW_GLOBALS } from "./AUTO_MOVIE_DRAW_GLOBALS.js";
import type { AutoMovieDrawSubjects } from "./AutoMovieDrawSubjects.js";
import type { IAutoMovieDrawCall } from "./IAutoMovieDrawCall.js";
import type { IAutoMovieDrawDescription } from "./IAutoMovieDrawDescription.js";
import type { IAutoMovieDrawFunction } from "./IAutoMovieDrawFunction.js";
import type { IAutoMovieDrawProps } from "./IAutoMovieDrawProps.js";
import type { IAutoMovieDrawResult } from "./IAutoMovieDrawResult.js";
import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";
import type { IAutoMovieDrawSubject } from "./IAutoMovieDrawSubject.js";
import { describeAutoMovieDrawScene } from "./describeAutoMovieDrawScene.js";
import { encodeAutoMovieDrawPixels } from "./encodeAutoMovieDrawPixels.js";
import { selectAutoMovieDrawSubject } from "./selectAutoMovieDrawSubject.js";

/**
 * Side of the block the beauty pass is drawn at and averaged down from, so its edges are antialiased by area: two, the supersampling the motion harness drew its stills at.
 */
const SUPERSAMPLE: number = 2;

/**
 * Install the draw-only function on a page: read the props the host injected, and answer `describe` and `draw` for the subject they name, drawing offscreen with no interface.
 *
 * The page's script calls it once with its module's `subjects`. The subject is created on the first call, with one WebGL renderer on a canvas that is never attached to the document, without antialiasing. A draw then:
 *
 * 1. applies the call's inspection to the scene, or keeps the one applied when the request is the same, restoring the previous one first;
 * 2. for a fitted view, frames it on the union of what the inspection leaves drawn, or its focus, over the call's `frame` seconds, measured once per view and selection;
 * 3. for each `trail` pattern of the request, samples the matched objects over `planAutoMovieInspectionTrailTimes` with `sampleAutoMovieInspectionTrails`, then seeks the call's second and waits for the subject to report ready, and brings the inspection to it with the subject's marks of that second and `markAutoMovieInspectionTrails` of the samples; every seek is awaited, the sampler's and the drawn second's, so a subject that becomes ready only after an await is never read or drawn at another second;
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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loader for the subject and renderer, one applier keyed by the request, one placer that seeks and gathers a second's marks with its trails, one bounds cache keyed by view, selection and trails, and one draw that composes them; describing, pixel encoding and pattern resolution are their own modules.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A subject that is not ready is awaited, never drawn half placed; a view or request the inspection refuses throws to the host, which records the cell as not drawn.
 * @evidence contracts/development/implementation.md#efficient-algorithms A draw costs one seek, one inspection update, a trail's seeks over its window when asked, one render, one readback linear in the picture's pixels and one walk of the scene's paths for the resolution; a new request adds one inspection apply, and a new fitted view one seek and update per framing second.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The subject, the renderer, the applied inspection while its request text is unchanged, and each view's framing box while its view text, selection and seconds are unchanged, are reused across draws.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The page holds one subject, one renderer, one applied inspection and one box per framed view for its life; leaving the page restores the inspection and disposes the subject and renderer.
 */
export function installAutoMovieDraw(
  subjects: AutoMovieDrawSubjects,
  target: Record<string, unknown> = globalThis as unknown as Record<
    string,
    unknown
  >,
): void {
  const injected: IAutoMovieDrawProps = (target[AUTO_MOVIE_DRAW_GLOBALS.props] as
    | IAutoMovieDrawProps
    | undefined) ?? { subject: null, props: null };
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
  ) => Promise<IAutoMovieMark[]> = async (
    loaded: ILoaded,
    request: IAutoMovieInspectionRequest,
    seconds: number,
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
    return [
      ...(scene.marks?.(seconds) ?? []),
      ...markAutoMovieInspectionTrails(trails, seconds),
    ];
  };

  // The applied inspection, kept while its request is unchanged.
  let applied: { key: string; handle: IAutoMovieInspectionHandle } | null = null;
  const inspect: (
    loaded: ILoaded,
    request: IAutoMovieInspectionRequest,
    seconds: number,
  ) => Promise<IAutoMovieInspectionHandle> = async (
    loaded: ILoaded,
    request: IAutoMovieInspectionRequest,
    seconds: number,
  ): Promise<IAutoMovieInspectionHandle> => {
    const key: string = JSON.stringify(formatAutoMovieInspectionRequest(request));
    if (applied !== null && applied.key === key) return applied.handle;
    applied?.handle.restore();
    applied = null;
    const marks: IAutoMovieMark[] = await place(loaded, request, seconds);
    const handle: IAutoMovieInspectionHandle = applyAutoMovieInspection({
      scene: loaded.scene.scene,
      request,
      renderer: loaded.renderer,
      marks,
    });
    applied = { key, handle };
    return handle;
  };

  // Framing boxes, one per view text, selection and span of seconds.
  const framings: Map<string, IAutoMovieViewerSubjectBounds | null> = new Map();
  const frame: (
    loaded: ILoaded,
    handle: IAutoMovieInspectionHandle,
    call: IAutoMovieDrawCall,
    view: IAutoMovieInspectionView.INamed,
  ) => Promise<IAutoMovieViewerSubjectBounds | null> = async (
    loaded: ILoaded,
    handle: IAutoMovieInspectionHandle,
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
      handle.update(await place(loaded, call.request, seconds));
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

      // 1. The inspection, its marks drawn the stated width in output pixels.
      const factor: number = call.request.shade === "beauty" ? SUPERSAMPLE : 1;
      const handle: IAutoMovieInspectionHandle = await inspect(
        loaded,
        { ...call.request, stroke: call.request.stroke * factor },
        call.seconds,
      );

      // 2. A fitted view's framing over the call's seconds.
      const view: IAutoMovieInspectionView = parseAutoMovieInspectionView(call.view);
      const fitted: boolean =
        view.type === "named" &&
        !(scene.views !== undefined && Object.hasOwn(scene.views, view.name));
      const bounds: IAutoMovieViewerSubjectBounds | null =
        fitted && view.type === "named"
          ? await frame(loaded, handle, call, view)
          : null;

      // 3. The second itself, once the subject is ready.
      handle.update(await place(loaded, call.request, call.seconds));

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
      renderer.render(scene.scene, resolved.camera);

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
          (label: IAutoMovieInspectionLabel): IAutoMovieDrawResult["labels"][number] => ({
            text: label.text,
            x: label.x,
            y: label.y,
          }),
        ),
        legend: handle.legend.map(
          (entry: IAutoMovieInspectionLegendEntry): IAutoMovieInspectionLegendEntry => ({ ...entry }),
        ),
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
