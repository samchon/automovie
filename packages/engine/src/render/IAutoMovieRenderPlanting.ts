import {
  IAutoMoviePlantingCluster,
  IAutoMoviePlantingDomain,
} from "@automovie/interface";

import { IAutoMovieRenderPrototypeCost } from "./IAutoMovieRenderPrototypeCost";

/** One planting cluster drawn as instanced branch and leaf batches.
 *
 * @evidence contracts/common.md#principled-implementation Pair a planting domain and cluster with semantic/material ownership and host-reported branch/leaf prototype costs; null geometry cost preserves not-run instead of inventing renderer tessellation.
 * @evidence contracts/common.md#clear-and-simple-design One subject row joins geometry inventory and semantic-mask identity, while plant derivation and renderer sweep resolution stay outside this record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null branch/leaf costs are explicit missing-host-fact policy; a recipe with no leaves requires no leaf batch rather than a fabricated zero-cost measured leaf.
 * @evidence contracts/common.md#meaningful-documentation Members document borrowed domain/cluster laws, owner/material defaults and the distinction between exact batching and unknown per-instance geometry.
 * @evidence contracts/performance.md#efficient-algorithms The row contains references and two optional cost records; total branch/leaf derivation and counting depend on domain/cluster size in measureRenderSimulation.
 * @evidence contracts/performance.md#reuse-equivalent-work Mask and inventory share this subject row, so the same cluster ownership feeds both; mutable recipes or host costs preclude identity-only measurement caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns referenced records and returned reports; the type retains no generated branches, renderer object or resource handle.
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
