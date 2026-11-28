import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";
import type { IAutoMovieSweep } from "./IAutoMovieSweep";
import type { IAutoMovieSweepBinding } from "./IAutoMovieSweepBinding";

/** Authored sweep and resolved pose inputs for bone-driven regeneration. */
export namespace IAutoMoviePoseSweep {
  /**
   * Rest sweep, authored bone binding and two resolved poses for rebuilding a
   * sweep in model space.
   *
   * Departure direction and any end tangents turn with the corresponding
   * endpoint bones. Pose compilation computes the rotated station planes, then
   * interpolates their turns relative to the posed spine.
   */
  export type IProps = {
    /**
     * Rest sweep in the resolved bones' model metre frame. The output can share
     * unchanged section, guide and feature records.
     */
    sweep: IAutoMovieSweep;

    /**
     * Authored bone identities aligned with rest spine controls and stations.
     * Station tuples choose one bone or a two-bone rotation midpoint.
     */
    binding: IAutoMovieSweepBinding;

    /**
     * Borrowed resolved rest transforms, identified by their bone IDs and
     * expressed in model coordinates.
     */
    rest: readonly IAutoMovieResolvedBone[];

    /**
     * Borrowed resolved current transforms in the same coordinate frame. Every
     * referenced identity must resolve in both poses.
     */
    posed: readonly IAutoMovieResolvedBone[];

    /**
     * True settles one joint-based scale factor against the authored rest
     * volume for two-bone stations. Omission disables settlement.
     */
    preserveVolume?: boolean;
  };
}
