import { IAutoMovieCapsuleProxy } from "@automovie/interface";

/**
 * Declare one capsule pair to include in a self-intersection check.
 *
 * @evidence contracts/development/design.md#principled-representation Explicit pairing defines the checked population because neighboring anatomical capsules can share joints; each proxy still requires distinct reachable endpoints and a positive radius.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Pair selection is authored separately from the canonical capsule admission and distance owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Omitted pairs are not inferred as safe or tested automatically, and this record does not certify topology or continuous collision freedom.
 * @evidence contracts/development/common.md#meaningful-documentation Documents the exact pair population and why adjacent joint-sharing proxies may be omitted deliberately.
 */
export interface IAutoMovieCapsuleProxyPair {
  /** First capsule in the pair. */
  first: IAutoMovieCapsuleProxy;

  /** Second capsule in the pair. */
  second: IAutoMovieCapsuleProxy;
}
