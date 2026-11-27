import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";

/** Rest and posed transforms used to construct rigid bone-motion queries. */
export namespace IAutoMovieCreateBoneMotion {
  /**
   * Build each bone's rigid motion from rest to pose, the transform a point or
   * a direction fixed in that bone undergoes.
   *
   * Bone `b` carries a point `p` to `P_b + Q_b R_b^-1 (p - O_b)`, with rest
   * origin `O_b` and rotation `R_b` and posed origin `P_b` and rotation `Q_b`
   * in model space, the rigid transform `skinMesh` applies per joint.
   * Directions take the rotation `Q_b R_b^-1` alone.
   */
  export type IProps = {
    /**
     * Resolved rest origins in metres and rotations in the shared model frame.
     * Indexed by bone identity, not array position; duplicate identities use
     * the last record. The returned resolver retains these records.
     */
    rest: readonly IAutoMovieResolvedBone[];

    /**
     * Resolved posed transforms in the same frame as rest. A requested bone
     * missing from either array throws when resolved. Preserve the records
     * while the resolver lives: rotations are cached, while point application
     * reads retained origins.
     */
    posed: readonly IAutoMovieResolvedBone[];
  };
}
