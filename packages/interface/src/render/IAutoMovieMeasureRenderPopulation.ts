import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieSpace } from "../scene/IAutoMovieSpace";
import type { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";
import type { IAutoMovieRenderModelCost } from "./IAutoMovieRenderModelCost";
import type { IAutoMovieRenderOwnerCost } from "./IAutoMovieRenderOwnerCost";
import type { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";
import type { IAutoMovieSemanticMaskEntry } from "./IAutoMovieSemanticMaskEntry";

/**
 * Synchronous population accounting before simulation and material closure.
 * Counts are uncropped upper bounds; independent LOD maxima need not occur in
 * one frame. Collections belong to one inventory request and are not retained.
 */
export namespace IAutoMovieMeasureRenderPopulation {
  /**
   * Account for staged and compact populations before simulation and frame
   * passes.
   */
  export type IProps = {
    /** Borrowed scene and compact populations; this phase does not mutate them. */
    subject: IAutoMovieRenderSubject;
    /** Borrowed node-id lookup used to attribute lowered building elements. */
    nodeIndex: Map<string, IAutoMovieSemanticMaskEntry>;
    /**
     * Resolve a model id synchronously; cited is diagnostic owner text. Errors
     * propagate. measureAutoMovieRenderInventory supplies model resolution;
     * measureRenderPopulation calls it synchronously with model identity and
     * diagnostic citation, and propagates failures.
     */
    model: (id: string, cited: string) => IAutoMovieModel;
    /** Mutable request-local model-cost cache populated by the shared measurer. */
    costs: Map<string, IAutoMovieRenderModelCost>;
    /** Mutable set receiving every drawn model, including every cited LOD tier. */
    drawnModels: Set<string>;
    /**
     * Mutable set receiving compact-population models whose geometry is
     * flattened.
     */
    flattenedModels: Set<string>;
    /**
     * Append an owner/source metric row synchronously. Cost uses the named
     * metric's unit; this phase omits kind. Exceptions propagate and prior
     * mutations remain. The inventory caller owns owner/source metric
     * accumulation; measureRenderPopulation invokes this synchronous sink and
     * does not roll back prior sink effects on failure.
     */
    add: (
      owner: string,
      source: string,
      metric: AutoMovieRenderMetric,
      cost: number,
      kind?: NonNullable<IAutoMovieRenderOwnerCost["kind"]>,
    ) => void;
  };

  /**
   * Account for staged and compact populations before simulation and frame
   * passes.
   */
  export type IResult = {
    /**
     * Scene/ground triangles plus independent worst-tier compact-population
     * bounds.
     */
    triangles: number;
    /**
     * Submitted vertex bound for the same population, independent of triangle
     * maxima.
     */
    vertices: number;
    /**
     * Draw-submission bound: mesh parts, drawable ground surfaces and compact
     * chunks.
     */
    drawCalls: number;
    /** Borrowed scene ground record, or null when the scene has no space. */
    space: IAutoMovieSpace | null;
    /**
     * Ground position, normal and index buffer bytes; excludes other model
     * storage.
     */
    groundBytes: number;
    /**
     * Instance-set count plus anonymous formation members; excludes promoted
     * nodes.
     */
    instanceSlots: number;
    /**
     * Sum of instance-set and formation chunk counts, irrespective of
     * visibility.
     */
    instanceChunks: number;
    /** Formation count contributed to the later simulated-node accumulator. */
    simulatedNodes: number;
  };
}
