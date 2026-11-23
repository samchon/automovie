# src/motion/human/lexicon/IAutoMovieMotionHumanWallRun.ts#IAutoMovieMotionHumanWallRun

## @evidence contracts/development/common.md#meaningful-documentation

States both moves, the compositions, the checks and the refusals.

## @evidence contracts/development/design.md#principled-representation

A discriminated union on kind; each names the wall, its face and the foot that steps.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One registered vocabulary entry; planWallRun in motions is the only consumer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No height or friction is restated; they come from the wall and the body.

# src/motion/human/lexicon/IAutoMovieMotionHumanWallRun.ts#IAutoMovieMotionHumanWallRun.IWallStep

## @evidence contracts/development/common.md#meaningful-documentation

States each member and default.

## @evidence contracts/development/design.md#principled-representation

The wall, its face and the stepping foot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the wall step reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The step's height follows from the body.

# src/motion/human/lexicon/IAutoMovieMotionHumanWallRun.ts#IAutoMovieMotionHumanWallRun.IRun

## @evidence contracts/development/common.md#meaningful-documentation

States each member and default.

## @evidence contracts/development/design.md#principled-representation

The wall, its face, its top edge and the first foot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the wall run reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The top's height comes from the ledge affordance.

# src/motion/human/lexicon/IAutoMovieMotionHumanWallRun.ts#IAutoMovieMotionHumanWallRun.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the variants.

## @evidence contracts/development/design.md#principled-representation

A closed discriminated union on kind.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The variants planWallRun dispatches on.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Alternatives are separated by kind rather than optional fields.
