/**
 * One editable owner's contribution to a metric in the bounded render report.
 *
 * @evidence contracts/common.md#principled-implementation Budget evaluation ranks the inventory's own-cost rows by descending contribution and code-unit owner id, projecting metric-unit cost and source attribution into a bounded list.
 * @evidence contracts/common.md#clear-and-simple-design One owner, source and cost record tells authors where to reduce their own complexity without duplicating metric and status already carried by the finding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared resources use their own resource identity rather than charging bytes to every drawing node; frame passes and runtime storage remain omitted accounting rather than false editable-owner recommendations.
 * @evidence contracts/common.md#meaningful-documentation Defines semantic versus shared-resource ownership, editable source location and metric-specific contribution units.
 * @author Samchon
 */
export interface IAutoMovieRenderContributor {
  /**
   * Stable owner id.
   *
   * For a cost that paints pixels this is a semantic-mask id, so the report and the mask name the same thing. Shared resources that draw nothing of their own carry a `model:`, `material:`, `texture:` or `light:` identity instead: attributing one shared texture to every node that binds it would count its bytes once per node and describe a memory cost nobody pays.
   */
  owner: string;

  /** Editable source location the author changes to lower this cost. */
  source: string;

  /** Exact contribution in the metric's unit. */
  cost: number;
}
