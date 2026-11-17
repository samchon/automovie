import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalJoint } from "./IAutoMoviePhysicalJoint";
import type { IAutoMoviePhysicalJointAxis } from "./IAutoMoviePhysicalJointAxis";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/**
 * Seed a straight-chain singularity with the shared triangle solver, through bounded coordinates only.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the admitted chain, independent goal and caller-owned bounded subtree rotation.
 * @evidence contracts/development/design.md#principled-representation World target poses and bone-local endpoint offsets are metres; rotate requests angular increments in radians within profile coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface seedPhysicalChainTarget uses the shared two-bone solver but delegates every change of working targets to the caller's range-limited rotate callback.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only a straight-chain degeneracy is seeded; absent movable geometry can produce no update and no actual body pose is written.
 */
export namespace IAutoMovieSeedPhysicalChainTarget {
  /**
   * Seed a straight-chain singularity with the shared triangle solver, through bounded coordinates only.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the admitted chain, independent goal and caller-owned bounded subtree rotation.
   * @evidence contracts/development/design.md#principled-representation World target poses and bone-local endpoint offsets are metres; rotate requests angular increments in radians within profile coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface seedPhysicalChainTarget uses the shared two-bone solver but delegates every change of working targets to the caller's range-limited rotate callback.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only a straight-chain degeneracy is seeded; absent movable geometry can produce no update and no actual body pose is written.
   */
  export type IInput = {
    /** Admitted tree and coordinate bounds. */ profile: IAutoMoviePhysicalProfile;
    /** Declared proximal-to-distal chain. */ chain: readonly string[];
    /** Working motor goals, mutated only through rotate. */ targets: Record<
      string,
      IAutoMovieRigidTransform
    >;
    /** Requested support endpoint. */ goal: IAutoMovieVector3;
    /** Bone-local terminal endpoint, metres. */ localPoint?: IAutoMovieVector3;
    /** Metre degeneracy threshold. */ tolerance: number;
    /**
     * The caller's range-limited subtree update.
     *
     * Apply a requested incremental joint-coordinate rotation in radians through the caller's ROM-limited subtree update. The callback owns mutation of working targets, runs synchronously and is not retained; exceptions abort seeding.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Apply a requested incremental joint-coordinate rotation in radians through the caller's ROM-limited subtree update. The callback owns mutation of working targets, runs synchronously and is not retained; exceptions abort seeding.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; seedPhysicalChainTarget and solvePhysicalChainTarget owns the numerical method and its runtime premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; seedPhysicalChainTarget and solvePhysicalChainTarget owns its implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in seedPhysicalChainTarget and solvePhysicalChainTarget.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; seedPhysicalChainTarget and solvePhysicalChainTarget owns cost for the supported workload.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; seedPhysicalChainTarget and solvePhysicalChainTarget owns reuse and invalidation of any retained work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; seedPhysicalChainTarget and solvePhysicalChainTarget and the documented reader/caller lifetime own retained data and release.
     */ rotate: (
      joint: IAutoMoviePhysicalJoint,
      axis: IAutoMoviePhysicalJointAxis,
      request: number,
    ) => void;
  };
}
