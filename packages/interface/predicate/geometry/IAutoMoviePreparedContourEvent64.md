# src/geometry/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64

## @evidence contracts/development/common.md#meaningful-documentation

The prepared event gives physical cut coordinates, its terminal and both sides of declared incidence. The link indicators are derived from authored kind and regularity.

## @evidence contracts/development/design.md#principled-representation

Document preparation copies terminal coordinates, resolves each side through the corresponding saved section and copies loop ordinal and winding. It maps the declared minimum or maximum to an empty-side link indicator. Local admission reasons accompany the same event into planning.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record owns generation-local planning observations. Source event geometry is kept separately, and no mesh vertex or measured link is required.

# src/geometry/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64.y

## @evidence contracts/development/common.md#meaningful-documentation

The event's critical location is measured along the common cutting direction in millimetres.

# src/geometry/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64.y0

## @evidence contracts/development/common.md#meaningful-documentation

The lower bracket is the original saved section coordinate in millimetres.

# src/geometry/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64.y1

## @evidence contracts/development/common.md#meaningful-documentation

The upper bracket is the corresponding saved section coordinate in millimetres.

# src/geometry/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64.point

## @evidence contracts/development/common.md#meaningful-documentation

The value is a new world-millimetre terminal tuple for an extremum, or null for a saddle.

# src/geometry/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64.below

## @evidence contracts/development/common.md#meaningful-documentation

Each lower incident entry preserves its saved-section order and winding at y0.

# src/geometry/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64.above

## @evidence contracts/development/common.md#meaningful-documentation

Each upper incident entry preserves its saved-section order and winding at y1.

# src/geometry/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64.lowerLinkComponents

## @evidence contracts/development/common.md#meaningful-documentation

Preparation writes zero for a minimum and one otherwise. This describes declared kind.

# src/geometry/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64.upperLinkComponents

## @evidence contracts/development/common.md#meaningful-documentation

Preparation writes zero for a maximum and one otherwise, allowing terminal emission to identify that side.

# src/geometry/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64.manifoldLink

## @evidence contracts/development/common.md#meaningful-documentation

The adapter copies the declaration's regular flag into this link indicator.

# src/geometry/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64.equalHeightNeighbour

## @evidence contracts/development/common.md#meaningful-documentation

The current adapter negates the regular flag to derive this indicator without geometric neighborhood measurements.

# src/geometry/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64.unsupported

## @evidence contracts/development/common.md#meaningful-documentation

The optional reason preserves the event-admission failure for subsequent local reporting.

# src/geometry/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64.IIncident

## @evidence contracts/development/common.md#meaningful-documentation

The incident value gives one local saved loop ordinal and its signed material-boundary orientation.

## @evidence contracts/development/design.md#principled-representation

Preparation resolves each loop index in the event's exact lower or upper saved section and copies its winding to the side array. Planning uses winding when matching candidates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The incident record carries only the side-local address and winding. The parent identifies its bracket and side membership.

# src/geometry/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64.IIncident.loop

## @evidence contracts/development/common.md#meaningful-documentation

The zero-based ordinal addresses a loop within this incident's original saved section.

# src/geometry/IAutoMoviePreparedContourEvent64.ts#IAutoMoviePreparedContourEvent64.IIncident.winding

## @evidence contracts/development/common.md#meaningful-documentation

The orientation distinguishes outer and cavity uses through the admitted positive and negative signs.
