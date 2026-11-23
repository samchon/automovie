# src/production/IAutoMovieFormationBounds.ts#IAutoMovieFormationBounds

## @evidence contracts/development/design.md#principled-representation

Component-wise minima and maxima summarize the exact positions regenerated for a formation or instance range; these are position bounds, not a measured mesh envelope.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two vector corners serve both compact population kinds without coupling the bound to a prototype or viewer representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No radius or body size is inferred from these corners; a one-slot range legitimately has equal minimum and maximum positions.

## @evidence contracts/development/common.md#meaningful-documentation

Gives world-meter units, corner meaning and the exclusion of model extents and instantaneous motion.
