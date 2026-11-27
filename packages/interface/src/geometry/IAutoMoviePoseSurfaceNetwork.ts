import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";
import type { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import type { IAutoMovieSurfaceNetworkBindings } from "./IAutoMovieSurfaceNetworkBindings";

/** Name-based rigid and sweep bindings for posing an entire rest network. */
export namespace IAutoMoviePoseSurfaceNetwork {
  /**
   * Pose a whole surface network: re-sweep its bound sweeps and carry its free
   * points with their bones, keeping every patch, count and name.
   *
   * Each bound sweep is posed by `poseSweep`. A free node, a curve's
   * through points, direction and normal, and a ring's pinned positions move
   * rigidly with the bone named for them; nodes on a sweep follow that sweep by
   * construction. Anything without a binding keeps its rest position. Because
   * the patch layout is unchanged, sampling the posed network at a tier gives
   * the rest cage's topology, UVs and coordinates with posed positions, which
   * is what a renderer swaps in for the skinned positions.
   */
  export type IProps = {
    /**
     * Rest network, only read. The returned posed record preserves patch
     * topology and shares unchanged components with this input.
     */
    network: IAutoMovieSurfaceNetwork;
    /**
     * Name-based bone assignments. Empty tables leave all components at rest;
     * unknown sweep, node, curve or ring names throw before posing those
     * components.
     */
    bindings: IAutoMovieSurfaceNetworkBindings;
    /**
     * Resolved bones at rest in the network's frame, paired by bone identity
     * with posed to establish each rigid motion.
     */
    rest: readonly IAutoMovieResolvedBone[];
    /**
     * Corresponding resolved bones in the requested pose. A bone actually used
     * to transport geometry must exist in both lists; bindings on
     * sweep-attached nodes or rings without positions do not request rigid
     * motion.
     */
    posed: readonly IAutoMovieResolvedBone[];
    /**
     * Passed to each bound sweep's posing to retain rest volume at joint
     * stations when true; omitted means false.
     */
    preserveVolume?: boolean;
  };
}
