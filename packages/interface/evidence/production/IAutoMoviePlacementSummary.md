# src/production/IAutoMoviePlacementSummary.ts#IAutoMoviePlacementSummary

## @evidence contracts/development/common.md#meaningful-documentation

Defines units, point-only bounds, ordered arithmetic, empty sentinels and the accumulator's shared-vector lifetime.

## @evidence contracts/development/design.md#principled-representation

The same bounds and centroid describe a whole population or a contiguous subset without encoding a different spatial concept for each traversal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Incremental, range and chunk producers exchange this single summary with population materializers and terrain selection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The centroid is not a box centre or an unweighted mean of chunk means, and finite/nonempty admission remains the supplying population's responsibility.
