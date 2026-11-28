# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IPatch

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies the unique chart, bounded U/V interval counts, sample callback and four edges in increasing local order.

## @evidence contracts/development/design.md#principled-representation

The atlas owner checks chart identity, four edge declarations and each lattice interval count. It samples the active unit chart and omits charts whose supplied evaluations or corner agreement fail.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The patch gives one field plus its boundary restrictions, with no duplicated mesh positions. Its evaluator and edge callbacks own the geometry for the same immutable chart.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IPatch.id

## @evidence contracts/development/common.md#meaningful-documentation

Identifies one chart in the input and in localized omission messages.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IPatch.stepsU

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the inclusive 1 through 128 U interval count used for bottom and top schedules.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IPatch.stepsV

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the inclusive 1 through 128 V interval count used for right and left schedules.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IPatch.evaluate

## @evidence contracts/development/common.md#meaningful-documentation

Documents the unit-parameter chart callback and the millimetre position and partials it supplies to the atlas.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IPatch.edges

## @evidence contracts/development/common.md#meaningful-documentation

Defines the four restrictions in bottom, right, top, left order with positive local parameter orientation.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IChartSample

## @evidence contracts/development/common.md#meaningful-documentation

The declaration specifies the position in millimetres, derivatives per respective unit parameter and the optional normal-limit direction.

## @evidence contracts/development/design.md#principled-representation

The tessellator evaluates the chart at its chosen U/V and derives normals from the U/V cross product. When the cross vanishes, it checks and normalizes a usable optional authored direction. Boundary publication separately consults the matching canonical edge position.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The sample supplies exactly the position and local differential data consumed by meshing. It gives the optional degeneracy convention without retaining the chart callback.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IChartSample.point

## @evidence contracts/development/common.md#meaningful-documentation

Carries the chart's Cartesian millimetre position at the requested parameters.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IChartSample.du

## @evidence contracts/development/common.md#meaningful-documentation

Carries the first partial per unit chart U in millimetres.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IChartSample.dv

## @evidence contracts/development/common.md#meaningful-documentation

Carries the first partial per unit chart V, paired with du in the ordered analytic normal.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IChartSample.normalLimit

## @evidence contracts/development/common.md#meaningful-documentation

Offers an optional finite nonzero direction when the chart cross product vanishes. The atlas tracks such limits separately.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IEdge

## @evidence contracts/development/common.md#meaningful-documentation

The declaration describes the authority name, directed unit interval, local-to-canonical and inverse mappings and immutable position query.

## @evidence contracts/development/design.md#principled-representation

The atlas groups requested exact phase addresses by authority. It checks endpoints and the observed finite schedule, asks the supplied inverse for imported phases, and uses stable sample identities to detect position disagreements among incidents.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each incident owns its local mapping and supplies the same boundary authority through its callbacks. The chart keeps its complete field and the authority controls the shared phase identity.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IEdge.authority

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the canonical boundary group used to combine phase requests.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IEdge.start

## @evidence contracts/development/common.md#meaningful-documentation

Gives the directed phase at local zero. It can exceed end to represent reversed incidence.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IEdge.end

## @evidence contracts/development/common.md#meaningful-documentation

Gives the directed phase at local one and completes the local restriction.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IEdge.parameterize

## @evidence contracts/development/common.md#meaningful-documentation

Maps a unit local chart coordinate to a canonical phase with its original exact identity.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IEdge.localize

## @evidence contracts/development/common.md#meaningful-documentation

Maps a canonical phase back to a chart side coordinate on the directed restriction.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IEdge.sample

## @evidence contracts/development/common.md#meaningful-documentation

Returns the canonical sample with stable owner identity and immutable millimetre coordinates.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IBoundarySample

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies the authority's stable sample key and canonical millimetre position.

## @evidence contracts/development/design.md#principled-representation

The tessellator indexes accepted edge samples by the returned key and compares coordinates across incident charts. Different positions for an asserted shared identity trigger local omissions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The point and key suffice to join evidence from independent chart restrictions. The edge record owns interpretation of the input phase and each chart owns its own U/V coordinates.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IBoundarySample.key

## @evidence contracts/development/common.md#meaningful-documentation

Carries the physical identity provided by the shared boundary's owner.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IBoundarySample.point

## @evidence contracts/development/common.md#meaningful-documentation

Carries the canonical finite Cartesian millimetre point copied into the call's sample registry.

# src/geometry/IAutoMovieTessellateParametricAtlas64.ts#IAutoMovieTessellateParametricAtlas64.IProps.patches

## @evidence contracts/development/common.md#meaningful-documentation

Supplies each owning chart's unit domain sampling controls, evaluator and four matched edge restrictions.
