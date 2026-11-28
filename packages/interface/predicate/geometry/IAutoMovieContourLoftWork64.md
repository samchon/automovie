# src/geometry/IAutoMovieContourLoftWork64.ts#IAutoMovieContourLoftWork64.Ring

## @evidence contracts/development/common.md#meaningful-documentation

The work record describes generated identity, mutable millimetre points and authored winding.

## @evidence contracts/development/design.md#principled-representation

The generator samples each saved loop, uses the retained section and loop ordinals in its identity, and reverses point order for negative winding while preserving phase registration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ring owns one sampled boundary and local qualification. The generator keeps source phase and knot ownership in separate maps.

# src/geometry/IAutoMovieContourLoftWork64.ts#IAutoMovieContourLoftWork64.Ring.id

## @evidence contracts/development/common.md#meaningful-documentation

The generated identity distinguishes the saved loop within its retained section and invocation.

# src/geometry/IAutoMovieContourLoftWork64.ts#IAutoMovieContourLoftWork64.Ring.points

## @evidence contracts/development/common.md#meaningful-documentation

The cyclic sample array carries generated points in millimetres and is shared by later refinement and construction delivery.

# src/geometry/IAutoMovieContourLoftWork64.ts#IAutoMovieContourLoftWork64.Ring.winding

## @evidence contracts/development/common.md#meaningful-documentation

The authored sign determines sampled ring order and source refinement insertion direction.

# src/geometry/IAutoMovieContourLoftWork64.ts#IAutoMovieContourLoftWork64.Ring.period

## @evidence contracts/development/common.md#meaningful-documentation

The period carries admitted source phase extent, with zero on a tessellation refusal.

# src/geometry/IAutoMovieContourLoftWork64.ts#IAutoMovieContourLoftWork64.Ring.unsupported

## @evidence contracts/development/common.md#meaningful-documentation

The optional local representation reason remains attached to work on this ring.

# src/geometry/IAutoMovieContourLoftWork64.ts#IAutoMovieContourLoftWork64.Group

## @evidence contracts/development/common.md#meaningful-documentation

The group documents lower and upper side indices, borrowed critical records and local omission.

## @evidence contracts/development/design.md#principled-representation

Slab planning builds the incidence array, and boundary preparation can set a refusal on the same group before face generation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The group links existing saved rings and prepared events without copying geometry.

# src/geometry/IAutoMovieContourLoftWork64.ts#IAutoMovieContourLoftWork64.Group.a

## @evidence contracts/development/common.md#meaningful-documentation

The local ring indices address the lower section at k - 1.

# src/geometry/IAutoMovieContourLoftWork64.ts#IAutoMovieContourLoftWork64.Group.b

## @evidence contracts/development/common.md#meaningful-documentation

The local ring indices address the upper section at k.

# src/geometry/IAutoMovieContourLoftWork64.ts#IAutoMovieContourLoftWork64.Group.critical

## @evidence contracts/development/common.md#meaningful-documentation

The prepared document owns the event objects borrowed for this group.

# src/geometry/IAutoMovieContourLoftWork64.ts#IAutoMovieContourLoftWork64.Group.unsupported

## @evidence contracts/development/common.md#meaningful-documentation

A local reason prevents this group from reaching ordinary tiled emission.

# src/geometry/IAutoMovieContourLoftWork64.ts#IAutoMovieContourLoftWork64.Slab

## @evidence contracts/development/common.md#meaningful-documentation

The record explains the upper retained index and the owning group array.

## @evidence contracts/development/design.md#principled-representation

The generator uses slices[k - 1] and slices[k] when reading the ring intervals and assigning refusal diagnostics.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The slab holds the single index needed to calculate both section addresses, while each group carries its incidence records.

# src/geometry/IAutoMovieContourLoftWork64.ts#IAutoMovieContourLoftWork64.Slab.k

## @evidence contracts/development/common.md#meaningful-documentation

The value is the upper retained section index. The lower retained section is k - 1.

# src/geometry/IAutoMovieContourLoftWork64.ts#IAutoMovieContourLoftWork64.Slab.groups

## @evidence contracts/development/common.md#meaningful-documentation

The groups retain their local omissions and original side relationships for this interval.
