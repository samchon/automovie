# src/construction/IAutoMovieSolidCycle.ts#IAutoMovieSolidCycle.ICycle

## @evidence contracts/development/design.md#principled-representation

Parallel vertex/chart/segment arrays represent a face's boundary and its shared neighbour correspondence without deriving geometry from a rendered mesh.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four fields separate kept-side kind, shared mesh identity, this chart and the adjacent chart's endpoint maps; the optional fifth carries the exact curve a winding cycle samples, absent where its chords are its boundary.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type does not validate array lengths, winding, simplicity or inclusive boundary classification; prepared readers require unchanged kind/chart data during their lifetime.

## @evidence contracts/development/common.md#meaningful-documentation

States coindexing, closing-segment ownership, chart phase unwrapping and which face keeps each side.

# src/construction/IAutoMovieSolidCycle.ts#IAutoMovieSolidCycle.INeighbour

## @evidence contracts/development/design.md#principled-representation

An adjacent face identity and two corresponding chart endpoints let Body.atlas linearly map a boundary foot's segment share into that face.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One fixed record keeps neighbour identity and directed endpoint correspondence together.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A negative or excluded neighbour is not replaced by another face; the record alone does not prove that both surfaces meet along the segment.

## @evidence contracts/development/common.md#meaningful-documentation

Gives body-index ownership, the open sentinel and endpoint order before atlas-index translation.

# src/construction/IAutoMovieSolidCycle.ts#IAutoMovieSolidCycle.IFoot

## @evidence contracts/development/design.md#principled-representation

A segment index and clamped affine share identify the chart foot consumed by Clip and Body.atlas's neighbour map.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three scalars distinguish where the foot lies from the chart distance used to rank it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record certifies no analytic-curve or world-distance minimum; foot on an empty chart returns segment/share zero with infinite distance, not an admitted correspondence.

## @evidence contracts/development/common.md#meaningful-documentation

States polygon meaning, share range, distance space and the empty-chart sentinel limitation.

# src/construction/IAutoMovieSolidCycle.ts#IAutoMovieSolidCycle.IExactSegment

## @evidence contracts/development/common.md#meaningful-documentation

States the readers' owner and what the sense orients.

## @evidence contracts/development/design.md#principled-representation

An edited cycle is a chain of pieces of its owners' curves and of clips' chords, so exactness is a property of a segment: a cut that crosses a seam at one column leaves every other column on the owner's curve, and a cycle joined from two trims has two owners.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The owner's shared readers and one sign; the segment's ends are the cycle's own chart points.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Stores no copy of the curve, no vertex-count proxy and no tolerance; the sign is fixed by the cycle the owner built and reversed only with the segment's direction.

# src/construction/IAutoMovieSolidCycle.ts#IAutoMovieSolidCycle.IExact

## @evidence contracts/development/common.md#meaningful-documentation

States the count's role, the kept reading and the correspondence.

## @evidence contracts/development/design.md#principled-representation

The atlas's kept test and crossing map read the generating owner's curve directly, so the two faces of one seam own complementary sides of one curve and map a point across it to the same physical point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A count, an optional kept reader for a boundary whose chords are not already exact, and the crossing map.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The readers are the owner's; nothing is fitted or clamped here.
