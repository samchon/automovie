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
 *
 * @evidence contracts/development/design.md#principled-representation Separate cumulative geometry/population counts from request-owned model caches and attribution sinks; ground uses tessellated geometry and compact populations use independent tier maxima.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The population phase shares only the caches and callbacks needed by later inventory phases, without owning renderer resources.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Counts do not claim camera visibility or full native allocation residency; missing models or empty LOD lists refuse rather than imply zero cost.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish borrowed inputs, mutated request collections, synchronous callbacks and the units and scope of returned totals.
 */
export namespace IAutoMovieMeasureRenderPopulation {
  /**
   * Account for staged and compact populations before simulation and frame passes.
   *
   * @evidence contracts/development/design.md#principled-representation Borrowed scene population and request-local lookup/cache/sink state feed geometry counts, byte totals and compact-instance bounds in their documented metric units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface measureRenderPopulation shares model costs and attribution with measureAutoMovieRenderInventory; no renderer resource is owned by these records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Independent worst-tier counts need not occur in one frame, and missing models refuse rather than count as zero.
   * @evidence contracts/development/common.md#meaningful-documentation Documents mutable request collections, synchronous effects, ground-byte scope and uncropped bounds.
   */
  export type IProps = {
    /** Borrowed scene and compact populations; this phase does not mutate them. */
    subject: IAutoMovieRenderSubject;
    /** Borrowed node-id lookup used to attribute lowered building elements. */
    nodeIndex: Map<string, IAutoMovieSemanticMaskEntry>;
    /**
     * Resolve a model id synchronously; cited is diagnostic owner text. Errors propagate.
     * measureAutoMovieRenderInventory supplies model resolution; measureRenderPopulation calls it synchronously with model identity and diagnostic citation, and propagates failures.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents resolver inputs, synchronous failure and request-owned model lifetime.
     */
    model: (id: string, cited: string) => IAutoMovieModel;
    /** Mutable request-local model-cost cache populated by the shared measurer. */
    costs: Map<string, IAutoMovieRenderModelCost>;
    /** Mutable set receiving every drawn model, including every cited LOD tier. */
    drawnModels: Set<string>;
    /** Mutable set receiving compact-population models whose geometry is flattened. */
    flattenedModels: Set<string>;
    /**
     * Append an owner/source metric row synchronously. Cost uses the named metric's
     * unit; this phase omits kind. Exceptions propagate and prior mutations remain.
     * The inventory caller owns owner/source metric accumulation; measureRenderPopulation invokes this synchronous sink and does not roll back prior sink effects on failure.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States metric units, omitted kind and nontransactional exception behavior.
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
   * Account for staged and compact populations before simulation and frame passes.
   *
   * @evidence contracts/development/design.md#principled-representation Borrowed scene population and request-local lookup/cache/sink state feed geometry counts, byte totals and compact-instance bounds in their documented metric units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface measureRenderPopulation shares model costs and attribution with measureAutoMovieRenderInventory; no renderer resource is owned by these records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Independent worst-tier counts need not occur in one frame, and missing models refuse rather than count as zero.
   * @evidence contracts/development/common.md#meaningful-documentation Documents mutable request collections, synchronous effects, ground-byte scope and uncropped bounds.
   */
  export type IResult = {
    /** Scene/ground triangles plus independent worst-tier compact-population bounds. */
    triangles: number;
    /** Submitted vertex bound for the same population, independent of triangle maxima. */
    vertices: number;
    /** Draw-submission bound: mesh parts, drawable ground surfaces and compact chunks. */
    drawCalls: number;
    /** Borrowed scene ground record, or null when the scene has no space. */
    space: IAutoMovieSpace | null;
    /** Ground position, normal and index buffer bytes; excludes other model storage. */
    groundBytes: number;
    /** Instance-set count plus anonymous formation members; excludes promoted nodes. */
    instanceSlots: number;
    /** Sum of instance-set and formation chunk counts, irrespective of visibility. */
    instanceChunks: number;
    /** Formation count contributed to the later simulated-node accumulator. */
    simulatedNodes: number;
  };
}
