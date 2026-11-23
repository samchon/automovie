# src/harness/IAutoMovieDirectionTarget.ts#IAutoMovieDirectionTarget

## @evidence contracts/development/design.md#principled-representation

A heading in the actor's own frame uses the same sign convention as `aimYawPitch`'s yaw, positive toward the actor's left, so a future resolver can rotate it by the staged facing about +Y without a new convention.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One angle field states a relative goal; distance and destination are left to the verb, so the record carries no coordinates the model would have to invent.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The engine does not guess a destination from the heading; the locomote synthesizer steps in place and `positionalTargetFault` refuses it elsewhere, and the gap is stated here.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and sign of the heading, the intended use, and exactly what each verb does with the unresolved target today; the member gives the unit and zero.
