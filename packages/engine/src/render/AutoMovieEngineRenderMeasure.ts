import { measureAutoMovieRenderFeeds as measureAutoMovieRenderFeedsImplementation } from "./internal/measureAutoMovieRenderFeeds";
import { measureAutoMovieRenderFilmStage as measureAutoMovieRenderFilmStageImplementation } from "./internal/measureAutoMovieRenderFilmStage";
import type { AutoMovieEngineRenderMeasureTypes } from "./AutoMovieEngineRenderMeasureTypes";

import { type IAutoMovieRenderModelCost, type IAutoMovieModel, type IAutoMovieRenderInventory, type IAutoMovieMeasureRenderInventory, type IAutoMovieMeasureRenderPopulation, type IAutoMovieMeasureRenderSimulation, type IAutoMovieRenderSubject } from "@automovie/interface";
import { measure as measureImplementation } from "./internal/measure";
import { measureAutoMovieRenderInventory as measureAutoMovieRenderInventoryImplementation } from "./internal/measureAutoMovieRenderInventory";
import { measureRenderPopulation as measureRenderPopulationImplementation } from "./internal/measureRenderPopulation";
import { measureRenderSimulation as measureRenderSimulationImplementation } from "./internal/measureRenderSimulation";

/** Public operations for Auto Movie Engine Render Measure. */
export namespace AutoMovieEngineRenderMeasure {
  /**
   * Exact geometry cost of one model, memoized by model id.
   *
   * Primitives are measured by tessellating them with the engine's own
   * tessellator rather than by a table of formulas: a table would be a second
   * source of truth for how many triangles a sphere has, and the day the
   * tessellator's ring count changes, the budget would still be checking the old
   * number. Bicubic recipes use the same retained finite engine geometry as
   * display; geometryRealization records their incomplete processing
   * independently of cost.
   */
  export function measure(model: IAutoMovieModel, cache: Map<string, IAutoMovieRenderModelCost>, tier?: "hero" | "near" | "far"): IAutoMovieRenderModelCost {
    return measureImplementation(model, cache, tier);
  }

  /**
   * Measure what one frame of a subject commits the renderer to.
   *
   * Everything here is exact or an explicit upper bound, and the difference is
   * stated per metric rather than left to a reader:
   *
   * - Counts of nodes, lights, slots, chunks and materials are exact;
   * - Texture allocations use the conservative union of sampler, environment and
   *   shadow consumers. Uncertified identities/profiles or unsafe counts remain
   *   null rather than an invented exact native allocation population;
   * - Triangles, vertices and draw calls for instanced sets are UPPER BOUNDS, taken
   *   over the most expensive level of detail and the most expensive prototype a
   *   slot could select, because level-of-detail selection and frustum culling
   *   are camera facts and a budget must hold for every camera;
   * - Texture bytes are conservative uncompressed-storage estimates from decoded
   *   facts and required target profiles. Unresolved dimensions, representation
   *   or residency facts remain null rather than invented storage.
   *
   * The upper-bound direction is the only safe one. A budget checked against an
   * average would pass a production that stutters whenever the camera turns
   * toward the crowd, which is exactly the frame anyone would have wanted the
   * budget to catch.
   *
   * Simulated drawables ??cloth panels, planting clusters and water surfaces ??   * are measured beside the staged ones. They are held by no scene node, so
   * leaving them out was never "not yet supported": it was a triangle count for a
   * room the curtain, the fern bed and the pond are missing from, checked against
   * a budget and reported as cleared. Their cost comes from the domain record
   * alone and no solve has to run, which is what lets a production be refused
   * before the first step is integrated.
   *
   * Owners are the semantic ids of the mask, so a cost in the report and a colour
   * in the mask name the same thing. Shared resources that draw no pixels of
   * their own carry a `material:`, `texture:` or `light:` identity instead.
   *
   * A row that is one further whole-frame pass over geometry the other rows
   * already counted, such as a shadow view's depth pass or the outline guide
   * pass, is marked `pass` rather than `own`. The pass belongs in the
   * conservative one-frame peak and its own identity is worth keeping, but its
   * cost is the sum of every drawable that preceded it rather than the owner's
   * own complexity, so the report keeps its attribution without ranking it as an
   * editable owner.
   */
  export function measureAutoMovieRenderInventory(props: IAutoMovieMeasureRenderInventory.IProps): IAutoMovieRenderInventory {
    return measureAutoMovieRenderInventoryImplementation(props);
  }

  /**
   * Account for staged and compact populations before simulation and frame
   * passes.
   */
  export function measureRenderPopulation(props: IAutoMovieMeasureRenderPopulation.IProps): IAutoMovieMeasureRenderPopulation.IResult {
    return measureRenderPopulationImplementation(props);
  }

  /**
   * Extend prior counts with simulated drawable costs and explicit missing
   * inputs.
   */
  export function measureRenderSimulation(props: IAutoMovieMeasureRenderSimulation.IProps): IAutoMovieMeasureRenderSimulation.IResult {
    return measureRenderSimulationImplementation(props);
  }

  /**
   * Measure the render targets and passes a subject's surface-graphic feed layers
   * commit the renderer to, as `prepareAutoMovieSurfaceGraphics` builds them.
   *
   * Every feed layer of every key owns one render target for the whole shot,
   * `pixels` high and {@link autoMovieSurfaceFeedWidth} wide, the rule `render`
   * allocates by, so each is one texture allocation of
   * {@link FEED_BYTES_PER_PIXEL} bytes per pixel. A shown feed redraws the scene
   * once into its target, so a frame can add as many scene passes as the feed
   * layers shown at once: one key per track is in force, so the bound is the
   * largest feed count of any key, summed over the tracks.
   *
   * A directly rendered film, `subject.film`, draws each feed through its optics
   * on a film response stage of the feed's own, so every feed layer also holds
   * that stage's targets at its raster,
   * {@link measureAutoMovieFilmResponseTargets}, and, when the scene carries a
   * medium, the stage's half-float march target.
   *
   * The face size is the `surface` affordance the track names on the model its
   * node stages; it throws, naming the track, when that cannot be resolved.
   *
   * @param subject The subject whose surface graphics are measured.
   * @returns One row per track with feeds, in track order, and the totals.
   */
  export function measureAutoMovieRenderFeeds(subject: IAutoMovieRenderSubject): AutoMovieEngineRenderMeasureTypes.IFeedResult {
    return measureAutoMovieRenderFeedsImplementation(subject);
  }

  /**
   * Measure what a directly rendered film's stage adds to one frame: the GPU
   * targets render's film response, sample sum, indirect and medium stages
   * allocate at the beauty pass's drawing buffer, `width 횞 pixelRatio` by `height
   * 횞 pixelRatio` pixels (the draw host's is twice the delivered raster on each
   * side), and the further passes they draw.
   *
   * With `subject.film`, and nothing without it, one row pair per stage under a
   * `render-pass:film-*` owner:
   *
   * - Optics (`response`): the targets `measureAutoMovieFilmResponseTargets` counts
   *   at the raster, the linear frame with its depth texture and the glare
   *   pyramid and kernel pairs, made whether or not glare is asked for. Its
   *   passes are the final full-frame quad and, with a glare strength above zero,
   *   one quad into each glare target.
   * - `samples` S: two 32-bit float sum targets. The beauty pass is drawn S times
   *   instead of once, each with its shadow maps, so S ??1 more scene passes, and
   *   one accumulation quad per sample plus the average.
   * - `shading.occlusion`: the normal prepass's half-float target and its depth
   *   texture, and the raw and blurred visibility targets; per beauty sample one
   *   scene pass of the prepass, with its shadow maps, and two quads.
   * - `shading.probes`: the bake's 192 횞 32 float target with its depth
   *   renderbuffer and the grid's float texture of nine texels per probe; a frame
   *   that bakes draws twelve scene passes per probe. The layer's share of the
   *   scene is not known here, so each is bounded by the whole scene.
   * - A scene `medium`: the march's half-float target; two quads per sample.
   *
   * A scene pass is the opaque frame plus its shadow maps' depth passes, as the
   * feed passes count it, and a quad is one call of two triangles. Targets and
   * depth textures are runtime texture allocations, a depth renderbuffer adds
   * only bytes, and the passes are `pass` rows. Without `settings` the raster is
   * unknown: both texture totals are null with a `not-run` gap each, and so are
   * the draw and triangle totals when glare is asked for, since its pass count
   * follows from the raster's height.
   *
   * @param props The subject, the settings, the frame's opaque counts and shadow
   *   casters, and the row and gap sinks.
   * @returns What the stage adds to each total, null where it is unknown.
   */
  export function measureAutoMovieRenderFilmStage(props: AutoMovieEngineRenderMeasureTypes.IFilmStageProps): AutoMovieEngineRenderMeasureTypes.IFilmStageResult {
    return measureAutoMovieRenderFilmStageImplementation(props);
  }

}
