import {
  IAutoMoviePlantingCluster,
  IAutoMoviePlantingDomain,
} from "@automovie/interface";

import { IAutoMovieRenderPrototypeCost } from "./IAutoMovieRenderPrototypeCost";

/** One planting cluster drawn as instanced branch and leaf batches.
 *
 * @evidence contracts/development/design.md#principled-representation Pair a planting domain and cluster with semantic/material ownership and host-reported branch/leaf prototype costs; null geometry cost preserves not-run instead of inventing renderer tessellation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One subject row joins geometry inventory and semantic-mask identity, while plant derivation and renderer sweep resolution stay outside this record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null branch/leaf costs are explicit missing-host-fact policy; a recipe with no leaves requires no leaf batch rather than a fabricated zero-cost measured leaf.
 * @evidence contracts/development/common.md#meaningful-documentation Members document borrowed domain/cluster laws, owner/material defaults and the distinction between exact batching and unknown per-instance geometry.
 */
export interface IAutoMovieRenderPlanting {
  /** The recipe every member of the cluster instances. */
  domain: IAutoMoviePlantingDomain;

  /** The cluster placing the members. */
  cluster: IAutoMoviePlantingCluster;

  /** Semantic id of the owning building space, or `null` when unowned. */
  owner: string | null;

  /** Material id of the branch batch, or `null` for the default. */
  branchMaterial: string | null;

  /** Material id of the leaf batch, or `null` for the default. */
  leafMaterial: string | null;

  /**
   * Drawn cost of one branch instance, or `null` when the caller did not state
   * it.
   *
   * A branch is drawn as whatever solid the renderer chooses to sweep along it,
   * and that choice is not in the recipe: the same derived plant is a six-sided
   * tube in one viewer and a twenty-sided one in another. So the engine refuses
   * to invent a number here, exactly as it refuses to invent texture bytes, and
   * an absent cost makes the geometry metrics `not-run` while the batching
   * metrics stay exact.
   */
  branch: IAutoMovieRenderPrototypeCost | null;

  /**
   * Drawn cost of one leaf instance, or `null` when the caller did not state
   * it. A recipe bearing no leaves draws no leaf batch, so its absence costs
   * nothing and reports no gap.
   */
  leaf: IAutoMovieRenderPrototypeCost | null;
}
