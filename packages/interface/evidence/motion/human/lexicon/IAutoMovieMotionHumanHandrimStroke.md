# src/motion/human/lexicon/IAutoMovieMotionHumanHandrimStroke.ts#IAutoMovieMotionHumanHandrimStroke

## @evidence contracts/development/common.md#meaningful-documentation

Names the chair, both rims, the optional active side, and all three positive phases in seconds.

## @evidence contracts/development/design.md#principled-representation

Three durations determine a single contact window on the same clock as the chair's authored course.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanHandrimStroke consumes these parameters as a registered action and HumanObject.prop binds the moving point frames separately.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The prop supplies wheel geometry and travel. The parameter record neither drives wheels nor encodes body geometry.
