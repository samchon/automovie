# src/architecture/IAutoMovieOpeningHardware.ts#IAutoMovieOpeningHardware

## @evidence contracts/development/design.md#principled-representation `validateBuiltEnvironment` requires a unique non-blank id within the operation, a non-blank kind, and an element that is null or resolves; nothing enters the driven-element table, so a hardware element may also be driven by a panel or carriage.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three fields name a fixed part and optionally the element that draws it, leaving placement to the element hierarchy rather than adding a transform here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A declared-only part keeps a null element instead of pointing at a placeholder; the remaining gap is that no lowering, drawing, or schedule consumes hardware yet, which the documentation states.

## @evidence contracts/development/common.md#meaningful-documentation

States that hardware has no travel of its own, how it can still move with a parent panel, what a null element means, the label vocabulary, and that only validation reads it.
