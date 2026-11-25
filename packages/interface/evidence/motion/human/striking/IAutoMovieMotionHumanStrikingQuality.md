# src/motion/human/striking/IAutoMovieMotionHumanStrikingQuality.ts#IAutoMovieMotionHumanStrikingQuality.Accuracy

## @evidence contracts/development/common.md#meaningful-documentation

The namespace states each case's meaning.

## @evidence contracts/development/design.md#principled-representation

A closed union of the named cases, or an explicit world offset in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The cases the strikes' parameters accept.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface vector.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingQuality.ts#IAutoMovieMotionHumanStrikingQuality.IOffsetInput

## @evidence contracts/development/common.md#meaningful-documentation

accuracy: The declared accuracy; `hit` when absent. radius: The weapon's half width, metres. distance: The distance the weapon travels, metres.

## @evidence contracts/development/design.md#principled-representation

accuracy: The declared accuracy; `hit` when absent. radius: The weapon's half width, metres. distance: The distance the weapon travels, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/StrikingQuality.ts (StrikingQuality.offset, input).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanSkill, IAutoMovieRandom, IAutoMovieMotionHumanStrikingQuality.Accuracy, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
