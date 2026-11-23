# src/environment/IAutoMovieTerrainRecipe.ts#IAutoMovieTerrainRecipe

## @evidence contracts/development/design.md#principled-representation

Bounded local XZ metre geometry and relative height share the placed module origin. A closed relief union describes the base, and named pads and paths supply geometry or anchor references for grading. The producer admits dimensions, topology and conflicts at build time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The author states an extent, optional relief and only the features the parcel needs. Existing surface, route and population records carry the result. Internal tessellation and sample counts are derived.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer refuses a rotated parcel so a stored XZ lattice keeps its world frame. Topology, resolved anchors, representable coordinates and the mesh error limit are checked when the module runs.

## @evidence contracts/development/common.md#meaningful-documentation

States the coordinate frame, units, defaults and opacity, hard grade sources, holes, variable relief and bounded tessellation error.

# src/environment/IAutoMovieTerrainRecipe.ts#IAutoMovieTerrainRecipe.Point

## @evidence contracts/development/design.md#principled-representation

A fixed two-number tuple excludes missing or extra plan axes. The producer checks finiteness and bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shares one plan spelling for the parcel's size, points, outlines and slope axes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Grade tuples document their dimensionless interpretation at their field. Geometry points retain metre units.

## @evidence contracts/development/common.md#meaningful-documentation

Names axis order, frame and units.

# src/environment/IAutoMovieTerrainRecipe.ts#IAutoMovieTerrainRecipe.Relief

## @evidence contracts/development/design.md#principled-representation

Three closed variants select a constant, planar grade or bounded waves. Stored heights and wavelength are metres, with grades in metres of rise per metre in their local axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Preserves constant and plane rules without allocating a lattice when no grade constraints exist. Rolling ground needs amplitude and wavelength to express spatial size independently of extent.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No shape-dependent parameter is shared across meaningless variants. The producer checks finite values, positive wavelength and representable sampling.

## @evidence contracts/development/common.md#meaningful-documentation

Defines variants, local height datum, grade axes, amplitude, wavelength and omitted height.

# src/environment/IAutoMovieTerrainRecipe.ts#IAutoMovieTerrainRecipe.IPad

## @evidence contracts/development/design.md#principled-representation

A local simple plan ring and one explicit local height or named world anchor define a plateau. Equal grade constraints can overlap. Shoulders are positive widths in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the pad supplies its plan geometry and vertical authority. Paths and terrain consume that result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An anchor supplies the level of an independently placed occurrence. The resolver refuses cyclic dependencies and the terrain producer names incompatible levels.

## @evidence contracts/development/common.md#meaningful-documentation

Gives polygon form, the height datum and the default shoulder.

# src/environment/IAutoMovieTerrainRecipe.ts#IAutoMovieTerrainRecipe.IPath

## @evidence contracts/development/design.md#principled-representation

Local XZ points take their elevation from the base ground or an intersecting pad. A named frame provides an exact world point and elevation. Width and shoulders use metres, with unsigned maximum slope in metres per metre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The resolved path feeds the world route and the grade function. Stable start and end anchors expose the finished approach to consumers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer checks finite coordinates, full segment and turn clearance, usable segment lengths and any maximum slope. A missing anchor has no fallback.

## @evidence contracts/development/common.md#meaningful-documentation

Gives point variants, width, shoulder default and optional grade limit.

# src/environment/IAutoMovieTerrainRecipe.ts#IAutoMovieTerrainRecipe.IRegion

## @evidence contracts/development/design.md#principled-representation

A simple local plan ring determines the material footprint and an admitted opaque linear RGB color determines its appearance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The inlay reuses the parcel's height and supplies only the outline and color.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer requires inlays to be strictly interior and disjoint. Their shared rims use one height rule.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the local outline's topology and how color and height are owned.

# src/environment/IAutoMovieTerrainRecipe.ts#IAutoMovieTerrainRecipe.IWater

## @evidence contracts/development/design.md#principled-representation

The same ring in local XZ defines the water, surrounding terrain cut and level grade constraint. Height is an offset in metres from the module origin.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses normal surface material and nonwalkable membership without introducing fluid simulation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer refuses intersecting inlay and void rings. The water provides a visible surface without granting walking support.

## @evidence contracts/development/common.md#meaningful-documentation

Gives ring, level, color, shoulder and support semantics.

# src/environment/IAutoMovieTerrainRecipe.ts#IAutoMovieTerrainRecipe.ITrees

## @evidence contracts/development/design.md#principled-representation

Center and radius define a local metre disk, count selects an integer population and a dimensionless scale sizes one shared tree prototype.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The authored disk guarantees compact uniformly scattered placement without a per-tree input list or per-seed rejection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer refuses disks whose trunks can reach a protected region. A separate amenity provides named interaction.

## @evidence contracts/development/common.md#meaningful-documentation

States the disk geometry, count bounds and visual scale.
