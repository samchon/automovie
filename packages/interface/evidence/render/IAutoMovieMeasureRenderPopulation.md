# src/render/IAutoMovieMeasureRenderPopulation.ts#IAutoMovieMeasureRenderPopulation

## @evidence contracts/development/design.md#principled-representation

Separate cumulative geometry/population counts from request-owned model caches and attribution sinks; ground uses tessellated geometry and compact populations use independent tier maxima.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The population phase shares only the caches and callbacks needed by later inventory phases, without owning renderer resources.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Counts do not claim camera visibility or full native allocation residency; missing models or empty LOD lists refuse rather than imply zero cost.

## @evidence contracts/development/common.md#meaningful-documentation

Members distinguish borrowed inputs, mutated request collections, synchronous callbacks and the units and scope of returned totals.

# src/render/IAutoMovieMeasureRenderPopulation.ts#IAutoMovieMeasureRenderPopulation.IProps

## @evidence contracts/development/design.md#principled-representation

Borrowed scene population and request-local lookup/cache/sink state feed geometry counts, byte totals and compact-instance bounds in their documented metric units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

measureRenderPopulation shares model costs and attribution with measureAutoMovieRenderInventory; no renderer resource is owned by these records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Independent worst-tier counts need not occur in one frame, and missing models refuse rather than count as zero.

## @evidence contracts/development/common.md#meaningful-documentation

Documents mutable request collections, synchronous effects, ground-byte scope and uncropped bounds.

# src/render/IAutoMovieMeasureRenderPopulation.ts#IAutoMovieMeasureRenderPopulation.IResult

## @evidence contracts/development/design.md#principled-representation

Borrowed scene population and request-local lookup/cache/sink state feed geometry counts, byte totals and compact-instance bounds in their documented metric units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

measureRenderPopulation shares model costs and attribution with measureAutoMovieRenderInventory; no renderer resource is owned by these records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Independent worst-tier counts need not occur in one frame, and missing models refuse rather than count as zero.

## @evidence contracts/development/common.md#meaningful-documentation

Documents mutable request collections, synchronous effects, ground-byte scope and uncropped bounds.
