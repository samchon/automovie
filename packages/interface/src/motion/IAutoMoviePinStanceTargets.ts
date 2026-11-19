import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieFootLeg } from "./IAutoMovieFootLeg";
import type { IAutoMovieFootPlant } from "./IAutoMovieFootPlant";
import type { IAutoMovieTimedGround } from "./IAutoMovieTimedGround";

/**
 * Data and callback contracts shared by the PinStanceTargets operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Parallel FK frames and local-second times produce inclusive stance runs and per-frame targets in model metres. Opening targets are authoritative for runs beginning at frame zero; each run shares one fixed target object and callers admit the parallel arrays.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMoviePinStanceTargets contracts used by packages/engine/src/motion/pinStanceTargets.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Parallel FK frames and local-second times produce inclusive stance runs and per-frame targets in model metres. Opening targets are authoritative for runs beginning at frame zero; each run shares one fixed target object and callers admit the parallel arrays. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMoviePinStanceTargets contract belongs to interface; packages/engine/src/motion/pinStanceTargets.ts and packages/engine/src/motion/plantStanceFeet.ts use its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMoviePinStanceTargets {
  /**
   * Group each leg's stance mask into maximal inclusive runs and assign one fixed model-frame contact per run. A run beginning at frame zero resumes an authoritative opening target; otherwise its first foot supplies XZ and sampled ground supplies Y. Parallel times/FK arrays are caller-admitted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Parallel FK frames and local-second times produce inclusive stance runs and per-frame targets in model metres. Opening targets are authoritative for runs beginning at frame zero; each run shares one fixed target object and callers admit the parallel arrays.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMoviePinStanceTargets.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Parallel FK frames and local-second times produce inclusive stance runs and per-frame targets in model metres. Opening targets are authoritative for runs beginning at frame zero; each run shares one fixed target object and callers admit the parallel arrays. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMoviePinStanceTargets.IProps contract belongs to interface; packages/engine/src/motion/pinStanceTargets.ts and packages/engine/src/motion/plantStanceFeet.ts use this boundary. Runtime computation remains with those consumers.
   */
  export type IProps = {
    /** Legs whose feet are planted. */
    legs: readonly IAutoMovieFootLeg[];

    /** Per-frame FK bone lookups. */
    resolved: ReadonlyArray<
      ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
    >;

    /** Frame times, parallel to `resolved`. */
    times: readonly number[];

    /**
     * Ground height at a plan position.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePinStanceTargets.IProps.groundAt: Ground height at a plan position.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMoviePinStanceTargets.IProps.groundAt is used through packages/engine/src/motion/pinStanceTargets.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMoviePinStanceTargets.IProps.groundAt is used through packages/engine/src/motion/pinStanceTargets.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMoviePinStanceTargets.IProps.groundAt is used through packages/engine/src/motion/pinStanceTargets.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMoviePinStanceTargets.IProps.groundAt is used through packages/engine/src/motion/pinStanceTargets.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMoviePinStanceTargets.IProps.groundAt is used through packages/engine/src/motion/pinStanceTargets.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMoviePinStanceTargets.IProps.groundAt is used through packages/engine/src/motion/pinStanceTargets.ts.
     */
    groundAt: (x: number, z: number) => number;

    /** Static terrain scoped on the local clock, when authored. */
    support?: IAutoMovieTimedGround;

    /** Contact tolerance above the ground counted as stance. */
    tolerance: number;

    /** Prior beat's authoritative opening pin per foot, in model space. */
    openingTargets?: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>;
  };

  /**
   * Group each leg's stance mask into maximal inclusive runs and assign one fixed model-frame contact per run. A run beginning at frame zero resumes an authoritative opening target; otherwise its first foot supplies XZ and sampled ground supplies Y. Parallel times/FK arrays are caller-admitted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Parallel FK frames and local-second times produce inclusive stance runs and per-frame targets in model metres. Opening targets are authoritative for runs beginning at frame zero; each run shares one fixed target object and callers admit the parallel arrays.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMoviePinStanceTargets.IResult keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Parallel FK frames and local-second times produce inclusive stance runs and per-frame targets in model metres. Opening targets are authoritative for runs beginning at frame zero; each run shares one fixed target object and callers admit the parallel arrays. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMoviePinStanceTargets.IResult contract belongs to interface; packages/engine/src/motion/pinStanceTargets.ts and packages/engine/src/motion/plantStanceFeet.ts use this boundary. Runtime computation remains with those consumers.
   */
  export type IResult = {
    /** Compact inclusive stance records, one per detected run. */
    plants: IAutoMovieFootPlant[];

    /** Parallel per-frame maps sharing each run's fixed contact target. */
    targets: Array<Map<AutoMovieHumanoidBone, IAutoMovieVector3>>;
  };
}
