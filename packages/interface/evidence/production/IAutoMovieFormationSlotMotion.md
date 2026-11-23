# src/production/IAutoMovieFormationSlotMotion.ts#IAutoMovieFormationSlotMotion

## @evidence contracts/development/design.md#principled-representation

Sparse cues name explicit unique slot indices and interpolate member-local state over half-open shot-local intervals; sampling holds identity before the first cue and retains the last endpoint afterward.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shares timing and easing with formation-wide motion; stored exceptions scale with authored cues and slot references, while member-query and population execution costs remain with their consumers. Hero promotion stays separate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Slot membership is explicit and range-validated; removal is the present channel rather than deletion of the designed slot or automatic promotion to a named actor.

## @evidence contracts/development/common.md#meaningful-documentation

Explains sparse ownership, retained endpoints, identity before cues, shared-slot timing and the distinction from hero actors; start and end use shot-local seconds.
