# src/harness/IAutoMovieHoldAction.ts#IAutoMovieHoldAction

## @evidence contracts/development/design.md#principled-representation

A hold is a constant clip, two identical keyframes at `0` and `duration`, so sampling anywhere in the span returns the held pose exactly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The verb adds no field to the shared base beyond narrowing `duration` to a number, since a stillness has no natural length for `"auto"` to choose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The held pose is the context's declared rest or the measured prior beat end, never a pose guessed from the preceding action, and the documentation states that limit.

## @evidence contracts/development/common.md#meaningful-documentation

States which pose is held and when, what is not held, the no-context outcome, the checks and the default mask; the members give the discriminator and the span's unit and why it is numeric.
