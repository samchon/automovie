import type { IAutoMovieResolvedBone } from "../../pose/IAutoMovieResolvedBone";

/**
 * Rest and posed transforms used to construct rigid bone-motion queries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Rest and posed bone identities refer to metre origins and dimensionless rotations in the same model frame. Matching identities are checked when requested; duplicate identities use the last record, and retained transforms must remain stable.
 * @evidence contracts/development/design.md#principled-representation Rest and posed bone identities refer to metre origins and dimensionless rotations in the same model frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface createAutoMovieBoneMotion retains the resolved records to provide rigid motion to sweep and network posing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Matching identities are checked when requested; duplicate identities use the last record, and retained transforms must remain stable.
 */
export namespace IAutoMovieCreateBoneMotion {
  /**
   * Build each bone's rigid motion from rest to pose, the transform a point or
   * a direction fixed in that bone undergoes.
   *
   * Bone `b` carries a point `p` to `P_b + Q_b R_b^-1 (p - O_b)`, with rest
   * origin `O_b` and rotation `R_b` and posed origin `P_b` and rotation `Q_b`
   * in model space, the rigid transform `skinAutoMovieMesh` applies per joint.
   * Directions take the rotation `Q_b R_b^-1` alone.
   *
   * @evidence contracts/development/design.md#principled-representation Resolved bone identities pair metre origins and rotations in one model frame; lookup refuses a missing identity, while duplicate identities follow Map's last-record rule.
   * @evidence contracts/development/design.md#minimal-and-owned-surface createAutoMovieBoneMotion supplies poseAutoMovieSweep and poseAutoMovieSurfaceNetwork with the same rigid motion rule using the canonical resolved-bone contract.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Rest and posed arrays need not share ordering; records are matched by bone identity rather than by one skeleton's array layout.
   * @evidence contracts/development/common.md#meaningful-documentation States the rigid-transform equation, shared frame, reference retention, cache implications and missing-bone failure.
   */
  export type IProps = {
    /** Resolved rest origins in metres and rotations in the shared model frame. Indexed by bone identity, not array position; duplicate identities use the last record. The returned resolver retains these records. */
    rest: readonly IAutoMovieResolvedBone[];

    /** Resolved posed transforms in the same frame as rest. A requested bone missing from either array throws when resolved. Preserve the records while the resolver lives: rotations are cached, while point application reads retained origins. */
    posed: readonly IAutoMovieResolvedBone[];
  };
}
