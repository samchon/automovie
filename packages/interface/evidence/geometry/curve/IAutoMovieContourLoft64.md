# src/geometry/curve/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64

## @evidence contracts/development/design.md#principled-representation

Complete cubic coefficients and signed event incidence define a contour loft independently of any source mesh.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Sections, event relationships and a physical chord tolerance are the input; output mesh and actual sampled construction remain separate records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No original surface vertices, triangle indices, normals or anatomical defaults are admitted by this contract.

## @evidence contracts/development/common.md#meaningful-documentation

States chart units, ordering, orientation, topology ownership and the absence of a fold guarantee.

# src/geometry/curve/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IInterval

## @evidence contracts/development/design.md#principled-representation

Exact saved-cut coordinates and local curve ordinals carry observed incidence without source mesh addresses or geometric rematching.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One interval partitions both boundary loop lists into independent surface groups.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unsupported groups carry an explicit reason and are never silently assigned to a nearby contour or capped.

## @evidence contracts/development/common.md#meaningful-documentation

States complete coverage, local indices, physical millimetres and the limits of a supported declaration.

# src/geometry/curve/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.ISection

## @evidence contracts/development/design.md#principled-representation

A physical coordinate groups the complete generating curves of one cut.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The coordinate and ordered loop list carry the section without a second sampled definition.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A loop index is local to this section and is not a source mesh vertex address.

## @evidence contracts/development/common.md#meaningful-documentation

States coordinate units, orientation meaning and curve ownership.

# src/geometry/curve/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IEvent

## @evidence contracts/development/design.md#principled-representation

Explicit incident-contour relationships preserve split, merge and cavity events even when loop counts do not change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One event publishes both sides and its extremum or saddle kind.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Proximity alone does not invent a topology event, and a missing continuation is not permission to close a cavity.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes local contour indices, physical event coordinates, regularity and terminal use.

# src/geometry/curve/IAutoMovieContourLoft64.ts#IAutoMovieContourLoft64.IResult

## @evidence contracts/development/design.md#principled-representation

The result separates emitted geometry, generating construction and unresolved topology.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One result lets rendering and provenance consume the same generation without reevaluation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Normals derive from the new mesh and no missing surface is replaced by another mesh.

## @evidence contracts/development/common.md#meaningful-documentation

States metre output, construction meaning and unresolved-boundary behavior.
