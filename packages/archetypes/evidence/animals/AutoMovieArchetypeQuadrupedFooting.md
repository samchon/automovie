# src/animals/AutoMovieArchetypeQuadrupedFooting.ts#AutoMovieArchetypeQuadrupedFooting.IPlane

## @evidence contracts/development/common.md#meaningful-documentation

Exact bounded plane expressed by world origin, intervals and unitless rise/run slopes.

## @evidence contracts/development/design.md#principled-representation

The rectangular footprint and independent slopes supply a single-valued finite surface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the existing world vector and transform contracts and exposes only values consumed along the route.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Authoring gives the physical terrain values, and query results do not use a renderer cache or fixture constants.

# src/animals/AutoMovieArchetypeQuadrupedFooting.ts#AutoMovieArchetypeQuadrupedFooting.IYield

## @evidence contracts/development/common.md#meaningful-documentation

States the material, the depth's unit and its provenance.

## @evidence contracts/development/design.md#principled-representation

A depth below the surface plane, with its source.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by landing, verification and the ride's admission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The depth is authored or cited, never inferred from a material name.

# src/animals/AutoMovieArchetypeQuadrupedFooting.ts#AutoMovieArchetypeQuadrupedFooting.Material

## @evidence contracts/development/common.md#meaningful-documentation

Names the four yielding materials.

## @evidence contracts/development/design.md#principled-representation

A closed union of `sand`, `mud`, `bog` and `snow`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the footing plan names its material with it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed literals, not free text.

# src/animals/AutoMovieArchetypeQuadrupedFooting.ts#AutoMovieArchetypeQuadrupedFooting.IPole

## @evidence contracts/development/common.md#meaningful-documentation

A named physical pole is a finite capsule with its endpoint geometry.

## @evidence contracts/development/design.md#principled-representation

A closed segment and positive radius describe that solid without a hidden route cue.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the existing world vector and transform contracts and exposes only values consumed along the route.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Authoring gives the physical terrain values, and query results do not use a renderer cache or fixture constants.

# src/animals/AutoMovieArchetypeQuadrupedFooting.ts#AutoMovieArchetypeQuadrupedFooting.IScene

## @evidence contracts/development/common.md#meaningful-documentation

The scene owns a finite list of named landing regions and optional pole geometry.

## @evidence contracts/development/design.md#principled-representation

Input data contains the authored surfaces, obstacles and extra clearance control, each with its own units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the existing world vector and transform contracts and exposes only values consumed along the route.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Authoring gives the physical terrain values, and query results do not use a renderer cache or fixture constants.

# src/animals/AutoMovieArchetypeQuadrupedFooting.ts#AutoMovieArchetypeQuadrupedFooting.ISurface

## @evidence contracts/development/common.md#meaningful-documentation

Names one exact contact-plane point and unit normal in a caller's current frame.

## @evidence contracts/development/design.md#principled-representation

The normal determines physical tangent and signed separation without a floor proxy.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the existing world vector and transform contracts and exposes only values consumed along the route.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Authoring gives the physical terrain values, and query results do not use a renderer cache or fixture constants.

# src/animals/AutoMovieArchetypeQuadrupedFooting.ts#AutoMovieArchetypeQuadrupedFooting.ILanding

## @evidence contracts/development/common.md#meaningful-documentation

Names the same authored plane and the neutral terminal orientation at landing.

## @evidence contracts/development/design.md#principled-representation

The rigid rotation independently carries the course's heading onto the surface normal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the existing world vector and transform contracts and exposes only values consumed along the route.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Authoring gives the physical terrain values, and query results do not use a renderer cache or fixture constants.

# src/animals/AutoMovieArchetypeQuadrupedFooting.ts#AutoMovieArchetypeQuadrupedFooting.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

Offers independent surface queries and observed geometry admissibility for one route.

## @evidence contracts/development/design.md#principled-representation

Snapshot queries expose landings and whole-body checking without storing any current time state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the existing world vector and transform contracts and exposes only values consumed along the route.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Authoring gives the physical terrain values, and query results do not use a renderer cache or fixture constants.

# src/animals/AutoMovieArchetypeQuadrupedFooting.ts#AutoMovieArchetypeQuadrupedFooting.IPlan.landing

## @evidence contracts/development/common.md#meaningful-documentation

Receives the world footprint and its current unadjusted orientation and returns one new assigned plane frame.

## @evidence contracts/development/implementation.md#principled-implementation

Select the highest assigned plane and align the transported hoof attitude to its up normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read each bounded region and emit the one concrete landing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unassigned foothold refuses with its world coordinate.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the scene's S authored patches.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the admitted authored planes and uses existing quaternion and vector arithmetic.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns independent current vectors. No frame or sample is retained.

# src/animals/AutoMovieArchetypeQuadrupedFooting.ts#AutoMovieArchetypeQuadrupedFooting.IPlan.verify

## @evidence contracts/development/common.md#meaningful-documentation

Receives the primitive body and its world transform and refuses obstructed surfaces.

## @evidence contracts/development/implementation.md#principled-implementation

Project surfaces onto the authored plane normal and compare complete physical bounds against each pole segment.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Measure world part bounds, then check only relevant patches and any configured poles.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sole points, expected joint coordinates and flag labels do not stand in for whole shapes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Probes O(P) parts, each against at most S surfaces and K poles.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses existing primitive supports and the native segment-to-shape distance.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

All per-query geometry remains call-local.

# src/animals/AutoMovieArchetypeQuadrupedFooting.ts#AutoMovieArchetypeQuadrupedFooting.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Spells out units, authored bounds, whole-geometry verification and typed refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Convert rise over run to a unit tilted normal. Read the highest authored region under each named landing. Later measure rigid part support against all spatially relevant planes and conservative pole clearances.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit geometry once, then retain helpers for landing and pose verification.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing floor or obstructed body refuses. Pole checks bound complete cylindrical parts by containing physical capsules.

## @evidence contracts/development/implementation.md#efficient-algorithms

Landing reads each of S authored planes once. Verification reads P parts against S planes and K poles with a horizontal overlap test first.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuse primitive support and the engine's finite segment-to-solid distance, retaining plane-frame transforms across samples.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the caller's independent copied world geometry for one route's lifetime and no current frame or external resource.
