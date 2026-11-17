import type { IAutoMoviePose } from "../../pose/IAutoMoviePose";

/**
 * Data and callback contracts shared by the CreateDynamicActorPoseClip operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A caller-supplied pose reader uses local seconds and one skeleton identity over a finite positive duration; null refuses the whole bake and exceptions propagate. Finite in-span landmarks augment the 24 Hz grid and duplicate sample times collapse.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieCreateDynamicActorPoseClip contracts used by packages/engine/src/perform/createDynamicActorPoseClip.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation A caller-supplied pose reader uses local seconds and one skeleton identity over a finite positive duration; null refuses the whole bake and exceptions propagate. Finite in-span landmarks augment the 24 Hz grid and duplicate sample times collapse. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieCreateDynamicActorPoseClip contract belongs to interface; packages/engine/src/perform/createDynamicActorPoseClip.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieCreateDynamicActorPoseClip {
  /**
   * Bake a live pose callback at 24 Hz plus exact caller landmarks over a positive second duration. Return null if any callback sample cannot resolve; successful samples form a non-looping linear clinical-pose clip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A caller-supplied pose reader uses local seconds and one skeleton identity over a finite positive duration; null refuses the whole bake and exceptions propagate. Finite in-span landmarks augment the 24 Hz grid and duplicate sample times collapse.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieCreateDynamicActorPoseClip.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation A caller-supplied pose reader uses local seconds and one skeleton identity over a finite positive duration; null refuses the whole bake and exceptions propagate. Finite in-span landmarks augment the 24 Hz grid and duplicate sample times collapse. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieCreateDynamicActorPoseClip.IProps contract belongs to interface; packages/engine/src/perform/createDynamicActorPoseClip.ts uses this boundary. Runtime computation remains with those consumers.
   */
  export type IProps = {
    /** Caller-selected output motion identity. */
    id: string;

    /** Skeleton id shared by every callback pose. */
    skeleton: string;

    /** Finite strictly positive clip span in seconds. */
    duration: number;

    /**
     * Resolve an admitted clinical pose at local seconds; null refuses the complete bake and thrown errors propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieCreateDynamicActorPoseClip.IProps.poseAt: Resolve an admitted clinical pose at local seconds; null refuses the complete bake and thrown errors propagate.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieCreateDynamicActorPoseClip.IProps.poseAt is used through packages/engine/src/perform/createDynamicActorPoseClip.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieCreateDynamicActorPoseClip.IProps.poseAt is used through packages/engine/src/perform/createDynamicActorPoseClip.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieCreateDynamicActorPoseClip.IProps.poseAt is used through packages/engine/src/perform/createDynamicActorPoseClip.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieCreateDynamicActorPoseClip.IProps.poseAt is used through packages/engine/src/perform/createDynamicActorPoseClip.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieCreateDynamicActorPoseClip.IProps.poseAt is used through packages/engine/src/perform/createDynamicActorPoseClip.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieCreateDynamicActorPoseClip.IProps.poseAt is used through packages/engine/src/perform/createDynamicActorPoseClip.ts.
     */
    poseAt: (time: number) => IAutoMoviePose | null;

    /** Additional finite in-span seconds that must be sampled exactly; duplicates collapse with the regular grid. */
    landmarks?: readonly number[];
  };
}
