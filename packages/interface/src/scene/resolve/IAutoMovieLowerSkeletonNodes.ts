import type { IAutoMovieSkeleton } from "../../skeleton/IAutoMovieSkeleton";

/**
 * Data and callback contracts shared by the LowerSkeletonNodes operations.
 *
 * @evidence contracts/development/design.md#principled-representation An admitted skeleton plus optional identity prefix and root parent describes lowering in bone-rest coordinates, with identity root and unit scales.
 * @evidence contracts/development/design.md#minimal-and-owned-surface lowerSkeletonNodes reuses the canonical skeleton and keeps placement parenting separate from the rig's rest geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The lowering borrows bone translation/rotation, so a fresh node array is not a deep copy; rig admission remains the caller's responsibility.
 * @evidence contracts/development/common.md#meaningful-documentation Documents prefix/root defaults and borrowed versus fresh transform members.
 */
export namespace IAutoMovieLowerSkeletonNodes {
  /**
   * Lower an admitted skeleton into a fresh identity group root and bone rest nodes. Prefixes concatenate onto node/parent ids and rootParent seats the synthetic root under a placement. Root records are independent; bone rest translation/rotation are borrowed and bone scales are fresh unit vectors.
   *
   * @evidence contracts/development/design.md#principled-representation An admitted skeleton plus optional identity prefix and root parent describes lowering in bone-rest coordinates, with identity root and unit scales.
   * @evidence contracts/development/design.md#minimal-and-owned-surface lowerSkeletonNodes reuses the canonical skeleton and keeps placement parenting separate from the rig's rest geometry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The lowering borrows bone translation/rotation, so a fresh node array is not a deep copy; rig admission remains the caller's responsibility.
   * @evidence contracts/development/common.md#meaningful-documentation Documents prefix/root defaults and borrowed versus fresh transform members.
   */
  export type IProps = {
    /** The rig to lower. */
    skeleton: IAutoMovieSkeleton;
    /** Node-id prefix for every lowered node. Defaults to `""` (bare names). */
    prefix?: string;
    /** Parent node id for the synthetic root, or `null` for a graph root. */
    rootParent?: string | null;
  };
}
