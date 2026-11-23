import { playbackEntryTime, playbackShownLayer } from "@automovie/engine";
import type {
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawCall,
  IAutoMovieDrawDescription,
  IAutoMovieDrawResult,
  IAutoMovieFilmOptics,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieInspectionLegendEntry,
  IAutoMovieInspectionView,
  IAutoMoviePlaybackEntry,
  IAutoMoviePlaybackLayer,
} from "@automovie/interface";
import * as THREE from "three";

import type { AutoMovieFilmAlpha } from "../scene/filmResponse/AutoMovieFilmAlpha.js";
import type { IAutoMovieInspectionHandle } from "../scene/inspection/IAutoMovieInspectionHandle.js";
import { parseAutoMovieInspectionView } from "../scene/inspection/parseAutoMovieInspectionView.js";
import { renderWithAutoMovieInspectionDiagnostics } from "../scene/inspection/renderWithAutoMovieInspectionDiagnostics.js";
import { resolveAutoMovieInspectionView } from "../scene/inspection/resolveAutoMovieInspectionView.js";
import type { IAutoMovieViewerSubjectBounds } from "../scene/subjectViewpoint/IAutoMovieViewerSubjectBounds.js";
import { AUTO_MOVIE_DRAW_GLOBALS } from "./AUTO_MOVIE_DRAW_GLOBALS.js";
import { AutoMovieDrawBeauty } from "./AutoMovieDrawBeauty.js";
import { AutoMovieDrawPlacement } from "./AutoMovieDrawPlacement.js";
import type { AutoMovieDrawSubjects } from "./AutoMovieDrawSubjects.js";
import type { IAutoMovieDrawFunction } from "./IAutoMovieDrawFunction.js";
import type { IAutoMovieDrawProps } from "./IAutoMovieDrawProps.js";
import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";
import type { IAutoMovieDrawSubject } from "./IAutoMovieDrawSubject.js";
import { describeAutoMovieDrawScene } from "./describeAutoMovieDrawScene.js";
import { isAutoMoviePlainBeautyRequest } from "./isAutoMoviePlainBeautyRequest.js";
import { observeAutoMoviePlacedInspection } from "./observeAutoMoviePlacedInspection.js";
import { planAutoMovieDrawLayers } from "./planAutoMovieDrawLayers.js";
import { readAutoMovieDrawResult } from "./readAutoMovieDrawResult.js";
import { selectAutoMovieDrawSubject } from "./selectAutoMovieDrawSubject.js";

/**
 * Side of the block the beauty pass is drawn at and averaged down from, so its
 * edges are antialiased by area: two, the supersampling the motion harness drew
 * its stills at.
 */
const SUPERSAMPLE = 2 as const;

/**
 * Install the draw-only function on a page: read the props the host injected,
 * and answer `describe` and `draw` for the subject they name, drawing offscreen
 * with no interface.
 *
 * The page's script calls it once with its module's `subjects`. The subject is
 * created on the first call, with one WebGL renderer on a canvas that is never
 * attached to the document, without antialiasing. A draw then:
 *
 * 1. Admits the background: `transparent` only for `beauty`; the `graphics` plate
 *    is always drawn over a transparent background, so its alpha is the
 *    graphics' coverage. Before each layer is drawn the canvas is sized to the
 *    drawn raster, the call's raster or for the `beauty` shade twice each side,
 *    and cleared to alpha 0 for a transparent picture or 1 otherwise;
 * 2. For a fitted view, places and inspects each framing second through
 *    `AutoMovieDrawPlacement` and frames the union of what the inspection
 *    leaves drawn, or its focus, measured once per view and selection;
 * 3. For a delivery or plain `beauty` draw, the film picture, reads the layers
 *    `planAutoMovieDrawLayers` gives at the second. A transition's outgoing
 *    shot is placed by the subject's `seekShot` on its own entry's clock,
 *    sampled and drawn by `AutoMovieDrawBeauty`, and its picture held. When the
 *    live entry is drawn and the subject has optics, its shutter and lens
 *    samples are accumulated;
 * 4. Places the second itself through `AutoMovieDrawPlacement.inspect`, which
 *    restores the previous inspection, samples the request's trails and seeks
 *    the call's second, or, when `playbackShownLayer` says the picture shows
 *    more of a transition's outgoing shot, places that shot, so marks,
 *    diagnostics, mouths, the camera record and every pass follow the shot on
 *    screen; a live layer drawn under it is drawn and held first. When the
 *    subject supplies diagnostics, the draw observes the settled scene before
 *    the fresh inspection is applied, and no seek occurs between this
 *    application and drawing. The subject's `beforeDraw` runs right after this
 *    and every other placement, a transition shot's and each sample's, before
 *    any pass's render mode applies;
 * 5. Draws through the camera `resolveAutoMovieInspectionView` gives, mark lines
 *    at the supersampling factor's width: the `beauty` shade by
 *    `AutoMovieDrawBeauty`, whose stages give a subject's optics and shading
 *    their response; the `graphics` plate by its `plate`; every other pass
 *    straight to the canvas. A film picture inside a transition holds the live
 *    picture too and composites the held layers by their weights through
 *    `renderAutoMovieFilmFrame`, a fade over a transparent background falling
 *    to alpha 0;
 * 6. Reads the picture back and assembles the result by `readAutoMovieDrawResult`.
 *
 * It reads the renderer's own canvas back in the same task. Without optics the
 * scene is drawn straight to the canvas, so colour conversion and tone mapping
 * are the ones the interactive page applies to its canvas; with optics the
 * stage's final pass writes the canvas, so the response is the film's whatever
 * the renderer's own curve and exposure. The film camera's aspect is set to the
 * picture's, as the page sets it to its canvas. A picture outside every
 * transition is drawn exactly as a subject without a sequence is.
 *
 * `speak` hands a subject with `speak` the film's dialogue mouths; each
 * result's `mouths` are what the subject read for the drawn second.
 *
 * ```ts
 * import { installAutoMovieDraw } from "@automovie/render";
 *
 * import { subjects } from "./subjects";
 *
 * installAutoMovieDraw(subjects);
 * ```
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
        // A transparent draw needs a drawing buffer with alpha; an opaque
        // draw clears to alpha 1 and stays opaque.
        alpha: true,
        preserveDrawingBuffer: false,
      });
      renderer.setPixelRatio(1);
      return {
        name,
        scene,
        renderer,
        placement: new AutoMovieDrawPlacement(scene, renderer),
        beauty: new AutoMovieDrawBeauty(renderer),
      };
    })());

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
    speak: async (track: IAutoMovieDialogueMouthTrack): Promise<void> => {
      (await load()).placement.speak(track);
    },
    draw: async (call: IAutoMovieDrawCall): Promise<IAutoMovieDrawResult> =>
      drawCall(await load(), call),
  };
  target[AUTO_MOVIE_DRAW_GLOBALS.draw] = draw;

  // Leaving the page releases what it holds.
  const listen: unknown = target["addEventListener"];
  if (typeof listen === "function")
    listen.call(
      target,
      "pagehide",
      (): void => {
        void loading?.then((loaded: ILoaded): void => {
          loaded.placement.restore();
          loaded.scene.dispose();
          loaded.beauty.dispose();
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

  /** The subject's placement, inspection and dialogue mouths. */
  placement: AutoMovieDrawPlacement;

  /**
   * The beauty pass's stages and a transition's held layers; they allocate
   * nothing for a subject that never asks for them.
   */
  beauty: AutoMovieDrawBeauty;
}

/** Draw one call on the loaded page, as `installAutoMovieDraw` states. */
async function drawCall(
  loaded: ILoaded,
  call: IAutoMovieDrawCall,
): Promise<IAutoMovieDrawResult> {
  const { scene, renderer, placement, beauty } = loaded;
  const shade: IAutoMovieDrawCall["request"]["shade"] = call.request.shade;

  // 1. The background, admitted before anything is placed or drawn. A
  // transparent picture clears to alpha 0, and its beauty renders leave the
  // backdrop undrawn; an opaque picture clears opaque, as the page always did.
  if (call.background === "transparent" && shade !== "beauty")
    throw new Error(
      `A transparent background is drawn only in the beauty pass, not ${shade}`,
    );
  const transparent: boolean =
    call.background === "transparent" || shade === "graphics";
  const alpha: AutoMovieFilmAlpha | undefined =
    call.background === "transparent" ? "transparent" : undefined;

  // The supersampled surface keeps marks at the requested output-pixel width.
  const factor: number = shade === "beauty" ? SUPERSAMPLE : 1;
  const width: number = call.width * factor;
  const height: number = call.height * factor;
  const prepare: () => void = (): void => {
    renderer.setClearAlpha(transparent ? 0 : 1);
    renderer.setSize(width, height, false);
  };

  // 2. A fitted view's framing over the call's seconds.
  const view: IAutoMovieInspectionView = parseAutoMovieInspectionView(
    call.view,
  );
  const fitted: boolean =
    view.type === "named" &&
    !(scene.views !== undefined && Object.hasOwn(scene.views, view.name));
  const bounds: IAutoMovieViewerSubjectBounds | null =
    fitted && view.type === "named" ? await placement.frame(call, view) : null;
  if (scene.camera.aspect !== call.width / call.height) {
    scene.camera.aspect = call.width / call.height;
    scene.camera.updateProjectionMatrix();
  }
  const resolveAt: (
    at: number,
  ) => ReturnType<typeof resolveAutoMovieInspectionView> = (
    at: number,
  ): ReturnType<typeof resolveAutoMovieInspectionView> =>
    resolveAutoMovieInspectionView({
      view,
      text: call.view,
      bounds,
      camera: scene.camera,
      ...(scene.views === undefined ? {} : { views: scene.views }),
      seconds: at,
      width: call.width,
      height: call.height,
    });
  const cameraAt: (at: number) => THREE.Camera = (at: number): THREE.Camera =>
    resolveAt(at).camera;

  // The subject's render-target work, such as surface feeds, runs right after
  // each placement, shot or sample, before any pass's render mode applies, so
  // every pass shows feeds drawn with the scene's own materials.
  const fed: (
    seek: (at: number) => Promise<void>,
  ) => (at: number) => Promise<void> =
    (seek: (at: number) => Promise<void>): ((at: number) => Promise<void>) =>
    async (at: number): Promise<void> => {
      await seek(at);
      scene.beforeDraw?.(renderer, at);
    };

  // 3. The film picture: its transition's layers, the outgoing shot drawn and
  // held before the live second is placed.
  const delivery: boolean = call.inspectionDiagnostics === "delivery";
  const film: boolean =
    shade === "beauty" &&
    (delivery || isAutoMoviePlainBeautyRequest(call.request));
  const planned: IAutoMoviePlaybackLayer[] | null = planAutoMovieDrawLayers(
    loaded.name,
    scene,
    call.seconds,
  );
  const layers: IAutoMoviePlaybackLayer[] | null = film ? planned : null;

  // Every record of the frame, from marks and diagnostics to the camera, the
  // mouths and a structural pass, follows the shot the picture shows most of:
  // inside a transition, before its midpoint, the outgoing shot.
  const shown: IAutoMoviePlaybackLayer | null =
    planned === null ? null : playbackShownLayer(planned);
  const seekShown: ((at: number) => Promise<void>) | undefined =
    shown === null || shown.live
      ? undefined
      : (at: number): Promise<void> =>
          scene.seekShot!(
            shown.shot,
            playbackEntryTime(scene.cut!.entries[shown.entry]!, at),
            at,
          );
  const outgoing: IAutoMoviePlaybackLayer | undefined = layers?.find(
    (layer: IAutoMoviePlaybackLayer): boolean => !layer.live,
  );
  const drawsLive: boolean =
    layers === null ||
    layers.some((layer: IAutoMoviePlaybackLayer): boolean => layer.live);
  if (outgoing !== undefined) {
    placement.restore();
    const entry: IAutoMoviePlaybackEntry = scene.cut!.entries[outgoing.entry]!;
    const sampled: IAutoMovieFilmOptics | undefined = await beauty.sample({
      scene,
      seconds: call.seconds,
      width,
      height,
      seek: fed(
        (at: number): Promise<void> =>
          scene.seekShot!(outgoing.shot, playbackEntryTime(entry, at), at),
      ),
      camera: cameraAt,
      ...(alpha === undefined ? {} : { alpha }),
    });
    prepare();
    beauty.draw({
      scene,
      camera: cameraAt(call.seconds),
      seconds: call.seconds,
      width,
      height,
      sampled,
      ...(alpha === undefined ? {} : { alpha }),
    });
    beauty.hold(0);
  }

  // The live second's shutter and lens samples, accumulated before the
  // inspection seeks the second again.
  let sampled: IAutoMovieFilmOptics | undefined;
  if (film && drawsLive && scene.optics !== undefined) {
    placement.restore();
    sampled = await beauty.sample({
      scene,
      seconds: call.seconds,
      width,
      height,
      seek: fed((at: number): Promise<void> => scene.seek(at)),
      camera: cameraAt,
      ...(alpha === undefined ? {} : { alpha }),
    });
  }

  // A live layer under an outgoing shot that the picture shows more of is
  // drawn and held before the shown shot is placed for the frame's records.
  let heldLive: boolean = false;
  if (layers !== null && drawsLive && seekShown !== undefined) {
    placement.restore();
    if (sampled === undefined)
      await fed((at: number): Promise<void> => scene.seek(at))(call.seconds);
    prepare();
    beauty.draw({
      scene,
      camera: cameraAt(call.seconds),
      seconds: call.seconds,
      width,
      height,
      sampled,
      ...(alpha === undefined ? {} : { alpha }),
    });
    beauty.hold(1);
    heldLive = true;
  }

  // 4. The second itself, once the subject is ready.
  let diagnostics: IAutoMovieInspectionDiagnostics | undefined;
  const handle: IAutoMovieInspectionHandle = await placement.inspect(
    { ...call.request, stroke: call.request.stroke * factor },
    call.seconds,
    (): void => {
      diagnostics = observeAutoMoviePlacedInspection(
        scene,
        call.seconds,
        delivery ? "delivery" : "capture",
        { renderer, factor: SUPERSAMPLE },
      );
      scene.beforeDraw?.(renderer, call.seconds);
    },
    seekShown,
  );

  // 5. Draw through the resolved camera at the drawn raster.
  const resolved: ReturnType<typeof resolveAt> = resolveAt(call.seconds);
  prepare();
  handle.resize(width, height);
  const diagnosticLegend: readonly IAutoMovieInspectionLegendEntry[] =
    renderWithAutoMovieInspectionDiagnostics({
      scene: scene.scene,
      diagnostics: delivery || shade !== "beauty" ? undefined : diagnostics,
      render: (): void => {
        // Only the beauty shade and the graphics plate have a camera
        // response; the other structural passes never ask for optics.
        if (shade !== "beauty") {
          if (shade === "graphics")
            beauty.plate({
              scene,
              camera: resolved.camera,
              seconds: call.seconds,
              width,
              height,
            });
          else renderer.render(scene.scene, resolved.camera);
          return;
        }
        if (drawsLive && !heldLive)
          beauty.draw({
            scene,
            camera: resolved.camera,
            seconds: call.seconds,
            width,
            height,
            sampled,
            ...(alpha === undefined ? {} : { alpha }),
          });
        if (layers === null) return;

        // The held layers, mixed by their weights: the outgoing shot in slot
        // 0 and the live one in slot 1.
        if (drawsLive && !heldLive) beauty.hold(1);
        beauty.composite(
          layers.map(
            (
              layer: IAutoMoviePlaybackLayer,
            ): { weight: number; slot: number } => ({
              weight: layer.weight,
              slot: layer.live ? 1 : 0,
            }),
          ),
          transparent,
        );
      },
      width,
      height,
      stroke: call.request.stroke * factor,
    });

  // 6. Read back before the task ends, then the labels at the output raster.
  return readAutoMovieDrawResult({
    ...{ renderer, call, width, height, factor, handle, diagnosticLegend },
    scene: scene.scene,
    resolved,
    shade,
    diagnostics,
    mouths: placement.mouths(),
  });
}
