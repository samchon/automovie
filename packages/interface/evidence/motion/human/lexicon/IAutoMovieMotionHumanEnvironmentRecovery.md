# src/motion/human/lexicon/IAutoMovieMotionHumanEnvironmentRecovery.ts#IAutoMovieMotionHumanEnvironmentRecovery.IRail

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the placed rail, its bar and the receiving hand.

## @evidence contracts/development/design.md#principled-representation

The bar affordance supplies the axis and length in world metres; the hand is the anatomical side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three names the rail catch reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The author supplies no fitted pose or second shape; an unreachable bar is refused at runtime.

# src/motion/human/lexicon/IAutoMovieMotionHumanEnvironmentRecovery.ts#IAutoMovieMotionHumanEnvironmentRecovery.Outcome

## @evidence contracts/development/common.md#meaningful-documentation

States what each outcome selects.

## @evidence contracts/development/design.md#principled-representation

A closed set; each member maps to one existing law.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the outcomes this action can plan are exposed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The law still refuses an outcome the perturbation cannot produce, and a rail without the rail outcome.

# src/motion/human/lexicon/IAutoMovieMotionHumanEnvironmentRecovery.ts#IAutoMovieMotionHumanEnvironmentRecovery.ITrip

## @evidence contracts/development/common.md#meaningful-documentation

Names the obstruction, the swinging foot, the outcome and the optional rail.

## @evidence contracts/development/design.md#principled-representation

The obstruction's collision shapes decide the contact against the displayed toe.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the trip admission and the chosen response read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No force is typed: the swing velocity at the cut sets it.

# src/motion/human/lexicon/IAutoMovieMotionHumanEnvironmentRecovery.ts#IAutoMovieMotionHumanEnvironmentRecovery.ISlip

## @evidence contracts/development/common.md#meaningful-documentation

Names the slipping foot, the static friction coefficient, the support, the outcome and the optional rail.

## @evidence contracts/development/design.md#principled-representation

The coefficient is dimensionless static friction; the support is the prop the foot bears on or the floor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the slip admission and the chosen response read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The required friction is measured from the entering motion, never authored.

# src/motion/human/lexicon/IAutoMovieMotionHumanEnvironmentRecovery.ts#IAutoMovieMotionHumanEnvironmentRecovery.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the two variants.

## @evidence contracts/development/design.md#principled-representation

A closed discriminated union on kind.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two causes the law admits.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Alternatives are separated by kind rather than optional fields.
