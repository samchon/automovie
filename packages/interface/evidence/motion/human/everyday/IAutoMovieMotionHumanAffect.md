# src/motion/human/everyday/IAutoMovieMotionHumanAffect.ts#IAutoMovieMotionHumanAffect.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the closed set of displays; each one's pattern is documented on the namespace.

## @evidence contracts/development/design.md#principled-representation

A string union over the nine displays, so an unknown display cannot be written; `angles` switches over it exhaustively.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by `IDisplay`, `LENGTH`, `angles` and the affect test.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No shortcut present: one discriminant for all displays, no per-consumer member.

# src/motion/human/everyday/IAutoMovieMotionHumanAffect.ts#IAutoMovieMotionHumanAffect.IDisplay

## @evidence contracts/development/common.md#meaningful-documentation

Documents each member's unit (film seconds, seconds, a scale) and the meaning of an absent length or intensity.

## @evidence contracts/development/design.md#principled-representation

A display's kind, its start on the film timebase, its length in seconds, an amplitude scale and the key of its seeded timing; positive length is validated at runtime by `angles`, intensity is not range-checked.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by `layer` and the affect test; the optional length, intensity and seed default to `LENGTH`, 1 and the display's kind and start.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No shortcut present: the optional members default independently and combine into no meaningless state.
