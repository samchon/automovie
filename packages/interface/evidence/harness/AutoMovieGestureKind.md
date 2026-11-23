# src/harness/AutoMovieGestureKind.ts#AutoMovieGestureKind

## @evidence contracts/development/design.md#principled-representation

A closed string union converges parallel generations on one spelling per family, and the engine maps kinds to motion through explicit tables, `gestureMotion`'s generic set and `actionRegion`'s per-kind region defaults, so each kind's behavior is a lookup rather than a guess.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Eighteen families with `note` for refinement and `custom` as the escape keep the vocabulary small enough to choose from while leaving variety to the free-text note the engine ignores.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Kinds the reference synthesizer cannot animate return no motion instead of borrowing another family's keyframes, and the documentation lists them so an author knows a host synthesizer must supply them.

## @evidence contracts/development/common.md#meaningful-documentation

States why the set is closed, how `note` and `custom` widen it, why creature families share the humanoid skeleton, exactly which kinds produce motion and under what condition, each kind's default region, and how to express an untargeted creature pose.
