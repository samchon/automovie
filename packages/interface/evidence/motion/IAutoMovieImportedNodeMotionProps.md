# src/motion/IAutoMovieImportedNodeMotionProps.ts#IAutoMovieImportedNodeMotionProps

## @evidence contracts/development/design.md#principled-representation

Supplies the selected clip, normalized source skeleton and explicit one-to-one mapping needed to remove rest rotation and decompose source quaternions into clinical coordinates under declared axes and rest frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Imported channel facts and clinical interpretation enter one conversion boundary; target-skeleton retargeting remains a later operation with separate inputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unmapped channels, non-hips translation, scales, weights, mixed interpolation and cubic splines are refused instead of sampled into an approximate supported form.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies retained key times, supported channels/laws, explicit mapping and clinical defaults, and states the between-key quaternion-versus-axis interpolation limitation.
