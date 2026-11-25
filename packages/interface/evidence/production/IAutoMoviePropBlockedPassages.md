# src/production/IAutoMoviePropBlockedPassages.ts#IAutoMoviePropBlockedPassages.IProps

## @evidence contracts/development/design.md#principled-representation

bounds is an axis-aligned world-metre box tested for strict interior overlap with rest opening fills and swept connector boxes; touching boundaries do not count as intrusion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

propBlockedPassages delegates passage measurement to createPropPassageBlocker, also shared by prop placement validation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Open or unmeasurable cuts cannot establish blockage, and connector sections must be declared. The query returns known overlaps rather than claiming complete clearance for unmeasurable passages.

## @evidence contracts/development/common.md#meaningful-documentation

World occupancy query against measurable building passage volumes. bounds is an axis-aligned world-metre box tested for strict interior overlap with rest opening fills and swept connector boxes; touching boundaries do not count as intrusion.
