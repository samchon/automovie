import type { IAutoMoviePose } from "../../pose/IAutoMoviePose";

/**
 * Data and callback contracts shared by the CreateDynamicActorExtendClip operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A caller-supplied pose reader uses local seconds and one skeleton identity over a finite positive duration; null refuses the whole bake and exceptions propagate. The extension reaches its peak halfway through and then holds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieCreateDynamicActorExtendClip contracts used by packages/engine/src/perform/createDynamicActorExtendClip.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation A caller-supplied pose reader uses local seconds and one skeleton identity over a finite positive duration; null refuses the whole bake and exceptions propagate. The extension reaches its peak halfway through and then holds. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieCreateDynamicActorExtendClip contract belongs to interface; packages/engine/src/perform/createDynamicActorExtendClip.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieCreateDynamicActorExtendClip {
  /**
   * Bake a moving arm goal with an easeInOut extension over the first half of a positive second duration, then hold its sampled solved articulation. An unresolved target sample returns null.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A caller-supplied pose reader uses local seconds and one skeleton identity over a finite positive duration; null refuses the whole bake and exceptions propagate. The extension reaches its peak halfway through and then holds.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieCreateDynamicActorExtendClip.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation A caller-supplied pose reader uses local seconds and one skeleton identity over a finite positive duration; null refuses the whole bake and exceptions propagate. The extension reaches its peak halfway through and then holds. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieCreateDynamicActorExtendClip.IProps contract belongs to interface; packages/engine/src/perform/createDynamicActorExtendClip.ts uses this boundary. Runtime computation remains with those consumers.
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
     */
    poseAt: (time: number) => IAutoMoviePose | null;
  };
}
