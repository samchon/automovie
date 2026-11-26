import { type IAutoMovieRenderModelCost, type IAutoMovieModel, type IAutoMovieRenderInventory, type IAutoMovieMeasureRenderInventory, type IAutoMovieMeasureRenderPopulation, type IAutoMovieMeasureRenderSimulation } from "@automovie/interface";
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
   * Simulated drawables — cloth panels, planting clusters and water surfaces —
   * are measured beside the staged ones. They are held by no scene node, so
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
}
