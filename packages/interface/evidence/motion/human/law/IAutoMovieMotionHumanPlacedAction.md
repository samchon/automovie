# src/motion/human/law/IAutoMovieMotionHumanPlacedAction.ts#IAutoMovieMotionHumanPlacedAction

## @evidence contracts/development/common.md#meaningful-documentation

A resolved action placement available to another law: performer, action family, plan and film-time boundaries. The plan remains evaluated on its own action-local clock.

## @evidence contracts/development/design.md#principled-representation

start: Film second of its law's time zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

ActionContext.action exposes another planned action to responding laws without exposing the evaluator's segment caches or recursion state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record retains film placement and the independent plan clock. Performance action lookup owns unknown-anchor refusal and schedule readiness.
