import type { AutoMovieHumanoidBone } from "../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieResolvedBone } from "../../pose/IAutoMovieResolvedBone";
import type { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import type { IAutoMovieSweepBinding } from "./IAutoMovieSweepBinding";

/** Name-based rigid and sweep bindings for posing an entire rest network. */
export namespace IAutoMoviePoseSurfaceNetwork {
  /**
   * Pose a whole surface network: re-sweep its bound sweeps and carry its free
   * points with their bones, keeping every patch, count and name.
   * 
   * Each bound sweep is posed by `poseAutoMovieSweep`. A free node, a curve's
   * through points, direction and normal, and a ring's pinned positions move rigidly
   * with the bone named for them; nodes on a sweep follow that sweep by
   * construction. Anything without a binding keeps its rest position. Because
   * the patch layout is unchanged, sampling the posed network at a tier gives
   * the rest cage's topology, UVs and coordinates with posed positions, which
   * is what a renderer swaps in for the skinned positions.
   *
   * @evidence contracts/development/design.md#principled-representation Canonical resolved bones and rest geometry share model metres; separate name tables identify sweeps, free nodes, curves and ring pins. The poser checks named components and resolves required bones.
   * @evidence contracts/development/design.md#minimal-and-owned-surface poseAutoMovieSurfaceNetwork combines poseAutoMovieSweep with rigid transport of free geometry while preserving the canonical network topology and sampling counts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional tables mean no bindings for that category; sweep-attached nodes follow their sweep and are not given an additional rigid transform.
   * @evidence contracts/development/common.md#meaningful-documentation Gives binding categories, absence behavior, shared output components, bone-frame requirements and volume default.
   */
  export type IProps = {
    /** Rest network, only read. The returned posed record preserves patch topology and shares unchanged components with this input. */
    network: IAutoMovieSurfaceNetwork;
    /** Name-based bone assignments. Empty tables leave all components at rest; unknown sweep, node, curve or ring names throw before posing those components. */
    bindings: {
      /** Existing sweep names to spine/station bone assignments passed to poseAutoMovieSweep. Unlisted sweeps retain the original sweep object. */
      sweeps?: Record<string, IAutoMovieSweepBinding>;
      /** Existing free point-node names to rigid-motion bones; nodes attached to a sweep follow that sweep instead. */
      nodes?: Record<string, AutoMovieHumanoidBone>;
      /** Existing curve names to bones transporting free through points, normals and directions. Unlisted curves share their unchanged rest declaration. */
      curves?: Record<string, AutoMovieHumanoidBone>;
      /** Existing ring names to bones transporting pinned positions; unlisted ring pins remain at rest. */
      rings?: Record<string, AutoMovieHumanoidBone>;
    };
    /** Resolved bones at rest in the network's frame, paired by bone identity with posed to establish each rigid motion. */
    rest: readonly IAutoMovieResolvedBone[];
    /** Corresponding resolved bones in the requested pose. A bone actually used to transport geometry must exist in both lists; bindings on sweep-attached nodes or rings without positions do not request rigid motion. */
    posed: readonly IAutoMovieResolvedBone[];
    /** Passed to each bound sweep's posing to retain rest volume at joint stations when true; omitted means false. */
    preserveVolume?: boolean;
  };
}
