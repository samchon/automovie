# src/motion/perform/IAutoMovieResumeActorSynthesisRuntime.ts#IAutoMovieResumeActorSynthesisRuntime.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Fresh per-action maps reuse borrowed actor contexts, rigs and nested poses from a verified previous beat. Prior pose, facing, root and gait phase replace staged state; horizontal speed below 1e-6 metres per second preserves the authored speed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieResumeActorSynthesisRuntime.IResult keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Fresh per-action maps reuse borrowed actor contexts, rigs and nested poses from a verified previous beat. Prior pose, facing, root and gait phase replace staged state; horizontal speed below 1e-6 metres per second preserves the authored speed. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieResumeActorSynthesisRuntime.IResult contract belongs to interface; packages/engine/src/perform/resumeActorSynthesisRuntime.ts uses this boundary. Runtime computation remains with those consumers.
