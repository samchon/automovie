# src/motion/perform/IAutoMovieResumeActorSynthesisRuntime.ts#IAutoMovieResumeActorSynthesisRuntime

## @evidence contracts/development/common.md#meaningful-documentation

Fresh per-action maps reuse borrowed actor contexts, rigs and nested poses from a verified previous beat. Prior pose, facing, root and gait phase replace staged state; horizontal speed below 1e-6 metres per second preserves the authored speed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This namespace groups the IAutoMovieResumeActorSynthesisRuntime contracts used by packages/engine/src/perform/resumeActorSynthesisRuntime.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.

## @evidence contracts/development/design.md#principled-representation

Fresh per-action maps reuse borrowed actor contexts, rigs and nested poses from a verified previous beat. Prior pose, facing, root and gait phase replace staged state; horizontal speed below 1e-6 metres per second preserves the authored speed. The namespace groups these type contracts without implementing the operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieResumeActorSynthesisRuntime contract belongs to interface; packages/engine/src/perform/resumeActorSynthesisRuntime.ts uses its nested records and callbacks. Runtime computation remains with those consumers.

# src/motion/perform/IAutoMovieResumeActorSynthesisRuntime.ts#IAutoMovieResumeActorSynthesisRuntime.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Fresh per-action maps reuse borrowed actor contexts, rigs and nested poses from a verified previous beat. Prior pose, facing, root and gait phase replace staged state; horizontal speed below 1e-6 metres per second preserves the authored speed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieResumeActorSynthesisRuntime.IResult keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Fresh per-action maps reuse borrowed actor contexts, rigs and nested poses from a verified previous beat. Prior pose, facing, root and gait phase replace staged state; horizontal speed below 1e-6 metres per second preserves the authored speed. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieResumeActorSynthesisRuntime.IResult contract belongs to interface; packages/engine/src/perform/resumeActorSynthesisRuntime.ts uses this boundary. Runtime computation remains with those consumers.
