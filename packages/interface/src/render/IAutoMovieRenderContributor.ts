/** One owner's share of one metric, as the report states it. */
export interface IAutoMovieRenderContributor {
  /**
   * Stable owner id.
   *
   * For a cost that paints pixels this is a semantic-mask id, so the report and
   * the mask name the same thing. Shared resources that draw nothing of their
   * own carry a `model:`, `material:`, `texture:` or `light:` identity instead:
   * attributing one shared texture to every node that binds it would count its
   * bytes once per node and describe a memory cost nobody pays.
   */
  owner: string;

  /** Editable source location the author changes to lower this cost. */
  source: string;

  /** Exact contribution in the metric's unit. */
  cost: number;
}
