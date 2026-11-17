import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";
import type { IAutoMovieActorContext } from "./IAutoMovieActorContext";

/**
 * Data and callback contracts shared by the ResumeActorSynthesisRuntime operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Fresh per-action maps reuse borrowed actor contexts, rigs and nested poses from a verified previous beat. Prior pose, facing, root and gait phase replace staged state; horizontal speed below 1e-6 metres per second preserves the authored speed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieResumeActorSynthesisRuntime contracts used by packages/engine/src/perform/resumeActorSynthesisRuntime.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Fresh per-action maps reuse borrowed actor contexts, rigs and nested poses from a verified previous beat. Prior pose, facing, root and gait phase replace staged state; horizontal speed below 1e-6 metres per second preserves the authored speed. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResumeActorSynthesisRuntime contract belongs to interface; packages/engine/src/perform/resumeActorSynthesisRuntime.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieResumeActorSynthesisRuntime {
  /**
   * Build per-action context and placement maps from a verified previous beat, when supplied. Carried pose, facing, root position and gait phase replace the staged values; horizontal speed below 1e-6 m/s keeps the authored speed. Entries and nested pose data are borrowed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fresh per-action maps reuse borrowed actor contexts, rigs and nested poses from a verified previous beat. Prior pose, facing, root and gait phase replace staged state; horizontal speed below 1e-6 metres per second preserves the authored speed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieResumeActorSynthesisRuntime.IResult keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Fresh per-action maps reuse borrowed actor contexts, rigs and nested poses from a verified previous beat. Prior pose, facing, root and gait phase replace staged state; horizontal speed below 1e-6 metres per second preserves the authored speed. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResumeActorSynthesisRuntime.IResult contract belongs to interface; packages/engine/src/perform/resumeActorSynthesisRuntime.ts uses this boundary. Runtime computation remains with those consumers.
   */
  export type IResult = {
    /** Call-local resumed actor lookup; nested poses, rigs and unchanged contexts are borrowed. */
    contexts: Map<string, IAutoMovieActorContext>;

    /** Call-local staged-id lookup with known prior actor translations substituted; values are borrowed. */
    nodes: Map<string, IAutoMovieVector3>;
  };
}
