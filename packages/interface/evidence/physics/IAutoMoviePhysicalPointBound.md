# src/physics/IAutoMoviePhysicalPointBound.ts#IAutoMoviePhysicalPointBound

## @evidence contracts/development/design.md#principled-representation

The reference union permits either one local point or one collider support point; the explicit axis and interval define the constraint without guessing a goal point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Articulated point fitting and contact admission share this record, while the referenced profile continues to own bone hierarchy and collider geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

At least one interval end remains a runtime requirement; the type does not claim that any admitted interval is reachable or that fitting directly corrects a pose.

## @evidence contracts/development/common.md#meaningful-documentation

Defines both local and world frames, metre units, absent ends, numerical admission and residual behavior.
