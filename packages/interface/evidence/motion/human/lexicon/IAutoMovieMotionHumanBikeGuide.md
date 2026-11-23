# src/motion/human/lexicon/IAutoMovieMotionHumanBikeGuide.ts#IAutoMovieMotionHumanBikeGuide

## @evidence contracts/development/common.md#meaningful-documentation

Names the bicycle, the side walked on, the duration and who owns the path.

## @evidence contracts/development/design.md#principled-representation

A scene subject id, an anatomical side and seconds; the bicycle's motion stays with its prop.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanBikeGuide reads this record; the course and grip geometry come from the scene bicycle.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No path or speed is duplicated here, so the athlete cannot drift from the bicycle it holds.
