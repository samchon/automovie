import type {
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawCall,
  IAutoMovieDrawDescription,
  IAutoMovieDrawResult,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieInspectionLegendEntry,
  IAutoMovieInspectionView,
} from "@automovie/interface";
import * as THREE from "three";

import type { AutoMovieFilmAlpha } from "../../scene/AutoMovieFilmAlpha.js";
import type { IAutoMovieInspectionHandle } from "../../scene/IAutoMovieInspectionHandle.js";
import { parseAutoMovieInspectionView } from "../../scene/inspection/internal/parseAutoMovieInspectionView.js";
import { renderWithAutoMovieInspectionDiagnostics } from "../../scene/inspection/internal/renderWithAutoMovieInspectionDiagnostics.js";
import { AutoMovieRenderInspectionCamera } from "../../scene/AutoMovieRenderInspectionCamera.js";
import type { IAutoMovieViewerSubjectBounds } from "../../scene/IAutoMovieViewerSubjectBounds.js";
import { AUTO_MOVIE_DRAW_GLOBALS } from "../AUTO_MOVIE_DRAW_GLOBALS.js";
import { AutoMovieDrawBeauty } from "./AutoMovieDrawBeauty.js";
import { AutoMovieDrawFilm } from "../AutoMovieDrawFilm.js";
import { AutoMovieDrawPlacement } from "../AutoMovieDrawPlacement.js";
import type { AutoMovieDrawSubjects } from "../AutoMovieDrawSubjects.js";
import type { IAutoMovieDrawFunction } from "../IAutoMovieDrawFunction.js";
import type { IAutoMovieDrawGlobal } from "../IAutoMovieDrawGlobal.js";
import type { IAutoMovieDrawProps } from "../IAutoMovieDrawProps.js";
import type { IAutoMovieDrawScene } from "../IAutoMovieDrawScene.js";
import type { IAutoMovieDrawSubject } from "../IAutoMovieDrawSubject.js";
import { describeAutoMovieDrawScene } from "./describeAutoMovieDrawScene.js";
import { isAutoMoviePlainBeautyRequest } from "./isAutoMoviePlainBeautyRequest.js";
import { observeAutoMoviePlacedInspection } from "./observeAutoMoviePlacedInspection.js";
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
 *    `AutoMovieDrawPlacement`, as the shot that second's picture shows, and
 *    frames the union of what the inspection leaves drawn, or its focus,
 *    measured once per view and selection;
 * 3. Plans the second through `AutoMovieDrawFilm`: the shot it shows,
 *    `playbackShownLayer` of the layers `AutoMovieRenderDraw.planLayers` gives, and,
 *    for the film picture, a delivered or plain `beauty` picture or `graphics`
 *    plate, a transition's layers. Every layer of positive weight but the shown
 *    one is placed on its own entry's clock, drawn and held, and a sampled
 *    film's shutter and lens samples of the shown layer are accumulated, each
 *    on that layer's own clock;
 * 4. Places the second itself through `AutoMovieDrawPlacement.inspect`, which
 *    restores the previous inspection and places the shown layer on its own
 *    entry's clock, at each of the request's trail times and then at the call's
 *    second, by `seekShot` when it is a transition's outgoing shot, so marks,
 *    trails, diagnostics, mouths, the camera record and every structural pass
 *    follow the shot on screen. When the subject supplies diagnostics, the draw
 *    observes the settled scene before the fresh inspection is applied, and no
 *    seek occurs between this application and drawing. The subject's
 *    `beforeDraw` runs right after this and every other placement, a layer's
 *    and each sample's, before any pass's render mode applies;
 * 5. Draws through the camera `AutoMovieRenderInspectionCamera.resolveView` gives, mark lines
 *    at the supersampling factor's width: the `beauty` shade by
 *    `AutoMovieDrawBeauty`, whose stages give a subject's optics and shading
 *    their response; the `graphics` plate by its `plate`; every other pass
 *    straight to the canvas. A film picture inside a transition holds the shown
 *    layer too and composites the held layers by their weights through
 *    `renderAutoMovieFilmFrame`, toward alpha 0 over a transparent background
 *    and for the plate, then draws the witness cubes of the shown shot's
 *    diagnostics over the composite at full strength;
 * 6. Reads the picture back and assembles the result by `readAutoMovieDrawResult`.
 *
 * It reads the renderer's own canvas back in the same task. Without optics the
 * scene is drawn straight to the canvas, so colour conversion and tone mapping
 * are the ones the interactive page applies to its canvas; with optics the
 * stage's final pass writes the canvas, so the response is the film's whatever
 * the renderer's own curve and exposure. The film camera's aspect is set to the
 * picture's, as the page sets it to its canvas. A picture outside every
 * transition is drawn exactly as a subject without a sequence is, except that a
 * shutter sample or a trail time outside the live entry's span, the film's
 * first frame included, places that entry rather than another shot, its handle
 * by `seekShot` or without `seekShot` its nearest live second by `seek`, and
 * that a fitted view's framing second inside a transition is placed as that
 * transition's picture shows it, through `seekShot`. Without `seekShot`, such a
 * framing second is refused like any picture inside a transition, which refuses
 * the fitted view's every cell.
 *
 * `speak` hands a subject with `speak` the film's dialogue mouths; each
 * result's `mouths` are what the subject read for the drawn second.
 *
 * ```ts
 * import { AutoMovieRenderDraw } from "@automovie/render";
 *
 * import { subjects } from "./subjects";
 *
 * AutoMovieRenderDraw.installAutoMovieDraw(subjects);
 * ```
 */
export function installAutoMovieDraw<Props = unknown>(
  subjects: AutoMovieDrawSubjects<Props | null>,
  target: IAutoMovieDrawGlobal<Props | null> = globalThis,
): void {
  // The host injects the props its own subjects take, by the page contract.
  const injected: IAutoMovieDrawProps<Props | null> = target[
    AUTO_MOVIE_DRAW_GLOBALS.props
  ] ?? {
    subject: null,
    props: null,
  };
  // Publish one preparation promise when the first call needs a scene.
  let loading: Promise<ILoaded> | undefined;
  const load = (): Promise<ILoaded> =>
    (loading ??= Promise.resolve().then(async (): Promise<ILoaded> => {
      const offered: Readonly<Record<string, IAutoMovieDrawSubject>> = subjects(
        injected.props,
      );
      const name: string = selectAutoMovieDrawSubject(
        Object.keys(offered),
        injected.subject,
      );
      const scene: IAutoMovieDrawScene = await offered[name]!.create();
      const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
        antialias: false,
        // The drawing buffer carries alpha for transparent output.
        alpha: true,
        preserveDrawingBuffer: false,
      });
      renderer.setPixelRatio(1);
      return {
        name,
        scene,
        renderer,
        placement: new AutoMovieDrawPlacement(name, scene, renderer),
        beauty: new AutoMovieDrawBeauty(renderer),
      };
    }));

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
  target.addEventListener?.(
    "pagehide",
    (): void => {
      void loading
        ?.catch((): undefined => undefined)
        .then((loaded: ILoaded | undefined): void => {
          if (loaded === undefined) return;

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
  const { scene, renderer, placement, beauty }: ILoaded = loaded;
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
    view.type === "named" && scene.views?.[view.name] === undefined;
  const bounds: IAutoMovieViewerSubjectBounds | null =
    fitted && view.type === "named" ? await placement.frame(call, view) : null;
  if (scene.camera.aspect !== call.width / call.height) {
    scene.camera.aspect = call.width / call.height;
    scene.camera.updateProjectionMatrix();
  }
  const resolveAt: (
    at: number,
  ) => AutoMovieRenderInspectionCamera.IResolveViewResult = (
    at: number,
  ): AutoMovieRenderInspectionCamera.IResolveViewResult =>
    AutoMovieRenderInspectionCamera.resolveView({
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

  // 3. The picture's plan: the shot it shows and, for the film picture, every
  // other layer of its transition placed, drawn and held, and the shown
  // layer's samples accumulated, before the shown layer is placed.
  const delivery: boolean = call.inspectionDiagnostics === "delivery";
  const picture: AutoMovieDrawFilm = new AutoMovieDrawFilm({
    ...{ name: loaded.name, scene, renderer, beauty, shade, width, height },
    seconds: call.seconds,
    ...(alpha === undefined ? {} : { alpha }),
    transparent,
    film:
      (shade === "beauty" || shade === "graphics") &&
      (delivery ||
        isAutoMoviePlainBeautyRequest({ ...call.request, shade: "beauty" })),
    camera: cameraAt,
    prepare,
    restore: (): void => placement.restore(),
  });
  await picture.prepare();

  // 4. The second itself, once the subject is ready: the shown layer, placed
  // by `seekShot` when it is a transition's outgoing shot.
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
        picture.byShot,
      );
      scene.beforeDraw?.(renderer, call.seconds);
    },
  );

  // 5. Draw through the resolved camera at the drawn raster. Only the beauty
  // shade and the graphics plate have a camera response; the other structural
  // passes never ask for optics. A composited transition takes the witness
  // cubes over its composite, at full strength.
  const resolved: ReturnType<typeof resolveAt> = resolveAt(call.seconds);
  prepare();
  handle.resize(width, height);
  if (picture.composites) picture.draw(resolved.camera);
  const diagnosticLegend: readonly IAutoMovieInspectionLegendEntry[] =
    renderWithAutoMovieInspectionDiagnostics({
      scene: picture.composites ? beauty.overlay : scene.scene,
      diagnostics: delivery || shade !== "beauty" ? undefined : diagnostics,
      render: (): void => {
        if (picture.composites) beauty.over(resolved.camera);
        else if (shade === "beauty" || shade === "graphics")
          picture.draw(resolved.camera);
        else renderer.render(scene.scene, resolved.camera);
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
