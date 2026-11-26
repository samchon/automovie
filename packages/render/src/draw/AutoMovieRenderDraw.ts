import { bindAutoMovieDrawSceneSoftProps as bindAutoMovieDrawSceneSoftPropsImplementation } from "./internal/bindAutoMovieDrawSceneSoftProps.js";
import { decodeAutoMovieDrawPixels as decodeAutoMovieDrawPixelsImplementation } from "./internal/decodeAutoMovieDrawPixels.js";
import { describeAutoMovieDrawScene as describeAutoMovieDrawSceneImplementation } from "./internal/describeAutoMovieDrawScene.js";
import { encodeAutoMovieDrawPixels as encodeAutoMovieDrawPixelsImplementation } from "./internal/encodeAutoMovieDrawPixels.js";
import { type AutoMovieDrawSubjects } from "./AutoMovieDrawSubjects.js";
import { type IAutoMovieDrawGlobal } from "./IAutoMovieDrawGlobal.js";
import { installAutoMovieDraw as installAutoMovieDrawImplementation } from "./internal/installAutoMovieDraw.js";
import { isAutoMoviePlainBeautyRequest as isAutoMoviePlainBeautyRequestImplementation } from "./internal/isAutoMoviePlainBeautyRequest.js";
import { observeAutoMoviePlacedInspection as observeAutoMoviePlacedInspectionImplementation } from "./internal/observeAutoMoviePlacedInspection.js";
import { placeAutoMovieDrawLayer as placeAutoMovieDrawLayerImplementation } from "./internal/placeAutoMovieDrawLayer.js";
import { selectAutoMovieDrawSubject as selectAutoMovieDrawSubjectImplementation } from "./internal/selectAutoMovieDrawSubject.js";
import { stampAutoMovieDrawLegend as stampAutoMovieDrawLegendImplementation } from "./internal/stampAutoMovieDrawLegend.js";

import { type IAutoMovieCaptureCell, type IAutoMovieCaptureLayout, type IAutoMovieCaptureSubject, type IAutoMovieCaptureTime, type IAutoMovieDrawCall, type IAutoMoviePlaybackLayer, type IAutoMovieRenderSoftPropFrame, type IAutoMovieRasterImage, type IAutoMovieDrawResult, type IAutoMovieInspectionRequest, type IAutoMovieInspectionDiagnostics, type IAutoMovieRasterLabel, type IAutoMovieInspectionLegendEntry } from "@automovie/interface";

import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";
import { planAutoMovieDrawCall } from "./internal/planAutoMovieDrawCall.js";
import { planAutoMovieDrawLayers } from "./internal/planAutoMovieDrawLayers.js";
import { planAutoMovieDrawPicture } from "./internal/planAutoMovieDrawPicture.js";

/** Public capture and picture planning operations owned by Render's draw topic. */
export namespace AutoMovieRenderDraw {
  /** The capture-plan fields needed to plan one draw page call. */
  export interface IPlanCallProps {
    /** The width and height of the capture subject. */
    subject: Pick<IAutoMovieCaptureSubject, "width" | "height">;
    /** The times covered by the capture plan, in seconds. */
    times: readonly Pick<IAutoMovieCaptureTime, "seconds">[];
    /** The planned raster layout of the capture cell. */
    layout: Pick<IAutoMovieCaptureLayout, "cell">;
  }

  /**
   * Turn one planned capture cell into the call a draw page answers: the
   * cell's second, view and inspection request, subject raster, framing span,
   * and label scale. Every planned second frames a fitted view, so it keeps one
   * camera across the capture; a view with @follow frames on the cell's own
   * second. The call's pass remains the request's shade.
   *
   * @param cell The capture cell's time, view and request.
   * @param plan The subject raster, plan times and cell layout.
   * @returns The draw call for the cell.
   */
  export function planCall(
    cell: Pick<IAutoMovieCaptureCell, "time" | "view" | "request">,
    plan: IPlanCallProps,
  ): IAutoMovieDrawCall {
    return planAutoMovieDrawCall(cell, plan);
  }

  /**
   * Return the layers a film picture composites at a second, outgoing first,
   * or null for the live placement alone. The result comes from engine
   * playbackLayersAt on the subject's sequence and cut. It is null when either
   * is absent and outside a transition, where one live layer has weight 1.
   *
   * If an outgoing layer needs placing and the subject has no seekShot, this
   * throws an error naming the subject, second, entry, transition kind and
   * missing placer.
   *
   * @param name The subject's name, included in placement errors.
   * @param scene The subject's sequence, cut and optional seekShot.
   * @param seconds The second drawn on the playback clock.
   * @returns Transition layers, or null for a single live placement.
   */
  export function planLayers(
    name: string,
    scene: Pick<IAutoMovieDrawScene, "sequence" | "cut" | "seekShot">,
    seconds: number,
  ): IAutoMoviePlaybackLayer[] | null {
    return planAutoMovieDrawLayers(name, scene, seconds);
  }

  /** The transition layers and placement selected for a picture. */
  export interface IPlanPicture {
    /** Transition layers, or null outside a transition. */
    layers: IAutoMoviePlaybackLayer[] | null;
    /** The layer shown most, or null outside a transition. */
    shown: IAutoMoviePlaybackLayer | null;
    /** The entry and shot placed, or null without a cut. */
    placed: Pick<IAutoMoviePlaybackLayer, "entry" | "shot"> | null;
  }

  /**
   * Plan a picture's layers, the layer shown most (greater weight, live on a
   * tie), and the entry used for placement. Outside a transition, the shown
   * layer is null; placement uses the live entry at the second, or null when
   * there is no cut. Draw pages, capture and Viewer use this same plan so the
   * picture and its records follow the same shot.
   *
   * Throws the missing-seekShot error from planLayers when an outgoing
   * shot cannot be placed.
   *
   * @param name The subject's name, included in placement errors.
   * @param scene The subject's sequence, cut and optional seekShot.
   * @param seconds The second drawn on the playback clock.
   * @returns The transition layers, shown layer and placed entry.
   */
  export function planPicture(
    name: string,
    scene: Pick<IAutoMovieDrawScene, "sequence" | "cut" | "seekShot">,
    seconds: number,
  ): IPlanPicture {
    return planAutoMovieDrawPicture(name, scene, seconds);
  }

  /**
   * Route soft prop surfaces from a producer into the draw subject's scene. The
   * producer is read right after the subject has placed its other objects, by
   * `seek`, `place` or `seekShot`, with the output second, and describes that
   * placement, as every reader of a draw subject does: after `seekShot`, the
   * placed shot at its own shot-local time.
   */
  export function bindAutoMovieDrawSceneSoftProps(subject: IAutoMovieDrawScene, read: (seconds: number) => readonly IAutoMovieRenderSoftPropFrame[]): IAutoMovieDrawScene {
    return bindAutoMovieDrawSceneSoftPropsImplementation(subject, read);
  }

  /**
   * Turn a draw page's picture back into the raster the capture core reads: the
   * base64 RGBA bytes of an `IAutoMovieDrawResult`, rows from the top, at the
   * size it states.
   *
   * It throws when the stated size is not the expected raster, or the bytes are
   * not that size's, naming both.
   */
  export function decodeAutoMovieDrawPixels(result: Pick<IAutoMovieDrawResult, "pixels" | "width" | "height">, expected: Pick<IAutoMovieRasterImage, "width" | "height">): IAutoMovieRasterImage {
    return decodeAutoMovieDrawPixelsImplementation(result, expected);
  }

  /**
   * Describe a created subject as a capture plans against it, from the scene as
   * `create` left it: no second is sought, because a subject need not hold every
   * second, such as a case that samples only its own instants.
   *
   * Named instants are the subject's own, copied. Views are the subject's own
   * names, then the inspection's named viewpoints. Drawables are the inspection
   * paths of the drawn objects, one world box per distinct path, the union of the
   * boxes of every object sharing it; an object with an empty box is left out.
   * Mark kinds are the subject's declared `markKinds` and those it supplies at
   * second 0, then `trail`, `trail/now`, `edge` and every `defect/<kind>`, the
   * kinds the inspection draws from its own sampling and measurement. Declaring a
   * later kind admits its capture without seeking through the film or inventing a
   * marker at zero; its geometry still comes from `marks` at the drawn second.
   */
  export function describeAutoMovieDrawScene(name: string, scene: IAutoMovieDrawScene): IAutoMovieCaptureSubject {
    return describeAutoMovieDrawSceneImplementation(name, scene);
  }

  /**
   * Turn the bytes WebGL read from a drawn target into the base64 text a draw
   * page returns: rows flipped to start at the top, and a supersampled target
   * reduced to the picture's size by averaging each `factor` by `factor` block.
   *
   * `bytes` holds `width * height * 4` RGBA bytes of the drawn target, rows from
   * the bottom as `readPixels` writes them. The result holds `(width / factor) *
   * (height / factor) * 4` bytes, rows from the top. Averaging is the area
   * filter: each output pixel is the mean of the target pixels it covers.
   *
   * The target's colour is associated with its alpha, as blending over a cleared
   * target leaves it, so the mean is taken of associated colour and of alpha, and
   * the colour is then divided by the mean alpha into straight colour, 0 where
   * the alpha is 0, each rounded to the nearest byte. Averaging straight colour
   * instead would let a transparent sample's black darken every half-covered
   * edge. An opaque target, alpha 255 throughout, reduces to the plain mean of
   * each channel.
   *
   * It throws when the byte count is not the size's, or the factor is not a whole
   * number dividing both sides.
   */
  export function encodeAutoMovieDrawPixels(bytes: Uint8Array, width: number, height: number, factor: number): string {
    return encodeAutoMovieDrawPixelsImplementation(bytes, width, height, factor);
  }

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
   * 5. Draws through the camera `resolveAutoMovieInspectionView` gives, mark lines
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
  export function installAutoMovieDraw<Props = unknown>(subjects: AutoMovieDrawSubjects<Props | null>, target?: IAutoMovieDrawGlobal<Props | null>): void {
    installAutoMovieDrawImplementation<Props>(subjects, target);
  }

  /**
   * Whether an inspection request asks for the film picture alone: the `beauty`
   * shade with no part selection, hiding, marks, trail, colouring, labels,
   * section or x-ray.
   *
   * Such a capture shows what the delivered frame shows, so the draw host gives
   * it a sampled film's shutter and lens samples as it does a delivery draw.
   */
  export function isAutoMoviePlainBeautyRequest(request: IAutoMovieInspectionRequest): boolean {
    return isAutoMoviePlainBeautyRequestImplementation(request);
  }

  /**
   * Read production diagnostics once from a settled scene and its delivery
   * camera.
   *
   * Call after the outer seek is ready, before inspection changes the scene. The
   * subject's raster determines the delivery projection regardless of the review
   * view. The offscreen capture and delivery hosts supply the actual raster audit
   * context; the Viewer never does.
   *
   * The sample offers the subject's synchronous `place` only when the placement
   * was its film-clock `seek`. A transition's outgoing shot placed by `seekShot`
   * lies on a clock `place` cannot reach, so its sample offers none, and a check
   * that would place other seconds and the drawn one again leaves the shot as
   * placed instead of putting the live entry there.
   *
   * @param subject Subject whose placement has completed.
   * @param seconds Film second at which the subject was placed.
   * @param mode Host that requested this observation.
   * @param auditRaster Optional offscreen renderer and sample factor for a
   *   capture or delivery.
   * @param byShot Whether the subject was placed by `seekShot`; absent or false
   *   for `seek`.
   * @returns The producer's findings and coverage at the subject clock, or
   *   undefined when diagnostics are absent.
   * @throws {Error} If the producer returns another sample's time or frame.
   */
  export function observeAutoMoviePlacedInspection(subject: IAutoMovieDrawScene, seconds: number, mode: IAutoMovieDrawScene.IPlacedSample["mode"], auditRaster?: IAutoMovieDrawScene.IPlacedSample["auditRaster"], byShot?: boolean): IAutoMovieInspectionDiagnostics | undefined {
    return observeAutoMoviePlacedInspectionImplementation(subject, seconds, mode, auditRaster, byShot);
  }

  /**
   * Place a draw subject as one layer of its film picture shows it at an output
   * second: on that layer's own entry clock, never on another entry's.
   *
   * Without a layer or a `cut` the subject is placed by `seek`, the only clock it
   * has. Otherwise, at an output second inside the entry's live span, from its
   * start to the next entry's, where `playbackEntryAt` resolves it, `seek` places
   * that entry on its own clock. At any other second, a transition's outgoing
   * tail, a shutter sample or trail time before the in-point, the film's first
   * frame included, or a trail time after the out-point, `seekShot` places the
   * layer's shot at `playbackEntryTime` of its entry, with the output second for
   * the film-clock readings. Outside the trimmed span that time runs into the
   * entry's handles, the shot's own source before the trim's start or after its
   * end, as an editor's handle frames supply a shot's edge; beyond the shot's own
   * ends the shot answers as its clips clamp, holding their end states. So a
   * frame or a trail at a hard cut shows only the entry's own shot.
   *
   * A subject without `seekShot`, which only a transition requires and whose
   * transitions `AutoMovieRenderDraw.planLayers` refuses, has no clock but `seek`: a
   * second outside the entry's live span is held at the nearest second the entry
   * is live at, its in-point or the last representable second before the next
   * entry's start, so a cut's first frame shows nothing of the previous shot and
   * only its shutter trail is shorter.
   *
   * @param name The subject's name, which an error names.
   * @param scene The created subject.
   * @param layer The layer's entry and shot, or null for a subject placed on the
   *   film clock alone.
   * @param seconds The output second placed: the drawn one, a sample's or a
   *   trail's.
   * @returns The subject's placement promise.
   */
  export function placeAutoMovieDrawLayer(name: string, scene: Pick<IAutoMovieDrawScene, "cut" | "seek" | "seekShot">, layer: Pick<IAutoMoviePlaybackLayer, "entry" | "shot"> | null, seconds: number): Promise<void> {
    return placeAutoMovieDrawLayerImplementation(name, scene, layer, seconds);
  }

  /**
   * Choose the subject a draw page creates from the names its module offers: the
   * named one, or with no name the only one.
   *
   * It throws, listing every offered name: for a name the module does not offer,
   * for no name when the module offers several, and for a module that offers
   * none.
   */
  export function selectAutoMovieDrawSubject(offered: readonly string[], name: string | null): string {
    return selectAutoMovieDrawSubjectImplementation(offered, name);
  }

  /**
   * Put a picture's legend on the picture itself, in the corner where it hides
   * the least of what was drawn: one row per entry, a square of the entry's
   * colour followed by the label stamp's text `<label> <count>`, so a reader of
   * the still alone knows what each mark colour means.
   *
   * The block is tried in the bottom-left, bottom-right, top-right and top-left
   * corners, in that order; every corner is free, since a contact sheet writes
   * its caption in a strip under each cell rather than over the still. The block
   * goes where the fewest of its pixels differ from the colour of the picture's
   * pixel in that very corner, the background the corner shows, so it covers
   * empty space where the picture has any, and the earlier corner wins a tie.
   * Each swatch is painted now, `ROW × scale` pixels on a side, the height of a
   * stamped label box; the returned labels are the rows' texts, anchored right of
   * their swatches, for the capture run to stamp at the same `scale`. An empty
   * legend paints nothing and returns nothing.
   */
  export function stampAutoMovieDrawLegend(picture: IAutoMovieRasterImage, legend: readonly IAutoMovieInspectionLegendEntry[], scale: number): IAutoMovieRasterLabel[] {
    return stampAutoMovieDrawLegendImplementation(picture, legend, scale);
  }
}
