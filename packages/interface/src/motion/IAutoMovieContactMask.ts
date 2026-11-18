import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Data and callback contracts shared by the ContactMask operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Resolved effector positions and ground heights share model-frame metres; tolerance is finite nonnegative metres. contactMask rejects nonfinite ground, propagates callback errors and reports false for a missing effector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieContactMask contracts used by packages/engine/src/motion/contactMask.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Resolved effector positions and ground heights share model-frame metres; tolerance is finite nonnegative metres. contactMask rejects nonfinite ground, propagates callback errors and reports false for a missing effector. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieContactMask contract belongs to interface; packages/engine/src/motion/contactMask.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieContactMask {
  /**
   * Classify each resolved effector sample as stance when its model-frame Y is at or below sampled ground plus finite nonnegative tolerance. Missing effectors are false; nonfinite sampled ground throws and callback exceptions propagate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Resolved effector positions and ground heights share model-frame metres; tolerance is finite nonnegative metres. contactMask rejects nonfinite ground, propagates callback errors and reports false for a missing effector.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieContactMask.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Resolved effector positions and ground heights share model-frame metres; tolerance is finite nonnegative metres. contactMask rejects nonfinite ground, propagates callback errors and reports false for a missing effector. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieContactMask.IProps contract belongs to interface; packages/engine/src/motion/contactMask.ts uses this boundary. Runtime computation remains with those consumers.
   */
  export type IProps = {
    /** End-effector bone judged against the ground. */
    effector: AutoMovieHumanoidBone;

    /** Per-frame actual FK position lookups; complete bone frames are also accepted. */
    resolved: ReadonlyArray<
      ReadonlyMap<
        AutoMovieHumanoidBone,
        IAutoMovieResolvedBone | Pick<IAutoMovieResolvedBone, "worldPosition">
      >
    >;

    /**
     * Ground height at a plan position.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieContactMask.IProps.groundAt: Ground height at a plan position.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieContactMask.IProps.groundAt is used through packages/engine/src/motion/contactMask.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieContactMask.IProps.groundAt is used through packages/engine/src/motion/contactMask.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieContactMask.IProps.groundAt is used through packages/engine/src/motion/contactMask.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieContactMask.IProps.groundAt is used through packages/engine/src/motion/contactMask.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieContactMask.IProps.groundAt is used through packages/engine/src/motion/contactMask.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieContactMask.IProps.groundAt is used through packages/engine/src/motion/contactMask.ts.
     */
    groundAt: (x: number, z: number) => number;

    /** Contact tolerance above the ground counted as stance. */
    tolerance: number;
  };
}
