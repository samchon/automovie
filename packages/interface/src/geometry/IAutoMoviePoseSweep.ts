import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";
import type { IAutoMovieSweep } from "./IAutoMovieSweep";
import type { IAutoMovieSweepBinding } from "./IAutoMovieSweepBinding";

/**
 * Rest sweep and bone transforms required to rebuild its posed spine and
 * section planes.
 */
export namespace IAutoMoviePoseSweep {
  /**
   * Re-sweep a sweep in a pose: move its spine and section planes with the
   * bones they ride and rebuild the surface from them, sweep-based deformation
   * after Hyun, Yoon, Chang, Seong, Kim and Juttler (2005, "Sweep-based human
   * deformation", The Visual Computer 21(8-10):542-550).
   *
   * Each spine point moves rigidly with its bone, and the spine's starting
   * direction and any declared end tangents turn with the first or last point's
   * bone. Each station's rest plane, its own rotation or the rest sweep's frame
   * at its `at`, turns with its bone; a station on two bones takes the
   * spherical midpoint of the two turned planes. The posed sweep carries those
   * planes as station rotations, so between stations the turn relative to the
   * posed spine's rotation-minimizing frame is interpolated by normalized
   * linear quaternion interpolation: a twist at one station spreads evenly to
   * the next instead of wringing the surface beside one joint, and sections at
   * a bent joint stay across the tube rather than collapsing into it. Sections,
   * guides, scale and features are kept as they are, so the surface keeps its
   * shape in each section plane.
   *
   * With `preserveVolume`, the sections of stations on two bones are scaled
   * together by one factor until the posed volume, by
   * `measureAutoMovieSweepVolume`, equals the rest volume: the scale profile
   * gains a knot at every station, the factor at joint stations and 1 at the
   * others, multiplied into any existing profile, and the factor is found by
   * secant steps, as the paper first rescales the key section at the bent joint
   * (Section 4.4), by `settleAutoMovieSweepVolume`. Without joint stations the
   * sweep is returned unscaled. The scale applies after features, so the
   * section's shape is unchanged and only its size at the joints moves.
   */
  export type IProps = {
    /**
     * Rest sweep in the same model-metre frame as resolved bones.
     * compileAutoMovieSweep validates its section and spine data; the returned
     * sweep shares unchanged section/guide/feature data.
     */
    sweep: IAutoMovieSweep;

    /**
     * Bone identities aligned with spine points and stations.
     * poseAutoMovieSweep checks both array lengths and resolves every named
     * bone; each station tuple supplies one bone or a two-bone spherical
     * midpoint.
     */
    binding: IAutoMovieSweepBinding;

    /**
     * Resolved rest transforms, indexed by bone identity, whose
     * worldPosition/worldRotation are in the sweep's model frame. Only read
     * during this call.
     */
    rest: readonly IAutoMovieResolvedBone[];

    /**
     * Corresponding posed transforms in the same frame. A bound identity
     * missing from either resolved list throws when its motion is requested.
     */
    posed: readonly IAutoMovieResolvedBone[];

    /**
     * Omitted means false. True settles one joint-station scale factor against
     * the authored rest volume; sweeps without two-bone stations skip
     * compensation. Volume measurement or settlement failures propagate.
     */
    preserveVolume?: boolean;
  };
}
