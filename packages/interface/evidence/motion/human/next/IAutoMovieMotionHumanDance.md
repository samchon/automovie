# src/motion/human/next/IAutoMovieMotionHumanDance.ts#IAutoMovieMotionHumanDance

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Dance family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Dance laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanDance.ts#IAutoMovieMotionHumanDance.ISlowDanceSway

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and its meaning.

## @evidence contracts/development/design.md#principled-representation

The size in metres, the beat in seconds and a whole count of sways.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three values the sway reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The beat and the distance are the author's; no default is assumed.

# src/motion/human/next/IAutoMovieMotionHumanDance.ts#IAutoMovieMotionHumanDance.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The step, the tempo and the number of beats.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tempo is a number, not audio.

# src/motion/human/next/IAutoMovieMotionHumanDance.ts#IAutoMovieMotionHumanDance.ILock

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

A track id and the event name read from it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two values the beat lock reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The track is the performance's input, never audio.

# src/motion/human/next/IAutoMovieMotionHumanDance.ts#IAutoMovieMotionHumanDance.IWaltz

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit, frame and default.

## @evidence contracts/development/design.md#principled-representation

A turn in degrees, a pivot and a travel in world metres, and the role.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four values the waltz box reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Omitted members keep the basic square; nothing is assumed.

# src/motion/human/next/IAutoMovieMotionHumanDance.ts#IAutoMovieMotionHumanDance.Side

## @evidence contracts/development/common.md#meaningful-documentation

Names the two admitted feet.

## @evidence contracts/development/design.md#principled-representation

Closed choices "left", "right" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The foot choice of the solo dance steps.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly.

# src/motion/human/next/IAutoMovieMotionHumanDance.ts#IAutoMovieMotionHumanDance.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Capture cases of the solo dance steps (#3253), eight beats at 120 bpm from quiet standing. The steps.

## @evidence contracts/development/design.md#principled-representation

Closed choices "bounce", "sway", "stepTouch", "boxStep" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: executable/cases/danceCases.ts (danceCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in danceCases.
