# src/validation/IAutoMovieValidateMotion.ts#IAutoMovieValidateMotion.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Admit motion identity/skeleton, positive duration, loop, ordered in-range times/easing, frame pose/expression and adjacent-axis speed. Member documentation states the supplied records, units and absence meanings used by validateMotion.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The shared motion/rig contracts separate authored keys from admission; invalid times, poses, expressions and speeds are reported rather than clamped.

## @evidence contracts/development/design.md#principled-representation

motion uses clip seconds and joint degrees, and skeleton supplies current joint membership and effective range-of-motion overrides.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateMotion.IProps, used by validateMotion. Its motion, skeleton members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
