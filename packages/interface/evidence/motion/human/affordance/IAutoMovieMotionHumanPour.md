# src/motion/human/affordance/IAutoMovieMotionHumanPour.ts#IAutoMovieMotionHumanPour.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Gives units, bounds, the supported prop features and the default hand.

## @evidence contracts/development/design.md#principled-representation

Prop ids reference authored affordances. The screenplay owns the amount released and the timing, and the recipient's capacity determines overflow.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One hand, two vessels, an angle and gap, the phase lengths and the volume inputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Amounts are explicitly authored because drinkware fill contributes to prop mass and supplies no mutable volume state.

# src/motion/human/affordance/IAutoMovieMotionHumanPour.ts#IAutoMovieMotionHumanPour.ILiquid

## @evidence contracts/development/common.md#meaningful-documentation

Identifies each quantity, its unit and its time.

## @evidence contracts/development/design.md#principled-representation

Three disjoint destinations account for the original volume.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Gives the two fills and accumulated overflow to callers sampling the liquid cue.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The balance is independent of frame rate, prop mass and playback history.
