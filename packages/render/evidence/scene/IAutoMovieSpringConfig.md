# src/scene/IAutoMovieSpringConfig.ts#IAutoMovieSpringConfig

## @evidence contracts/development/design.md#principled-representation

Identifies semantic humanoid joints and passes stiffness/damping directly to engine dampedSpring, allowing secondary follow-through without inventing viewer-specific joint axes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One solver-parameter pair applies to the explicitly listed joints; the player owns per-axis values and timestamps separately.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Joints are selected by the closed humanoid bone union rather than model-specific names, and solver parameters are not silently retuned for particular clips.

## @evidence contracts/development/common.md#meaningful-documentation

Documents lag/overshoot intent, joint selection and verbatim engine solver parameter forwarding.
