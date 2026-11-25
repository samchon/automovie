# src/construction/IAutoMovieSolidBody.ts#IAutoMovieSolidBody

## @evidence contracts/development/design.md#principled-representation

Body faces retain original surface charts while shared mesh IDs and neighbor cycles connect their boundaries.

## @evidence contracts/development/design.md#minimal-and-owned-surface

SolidBody creates, draws and publishes this state; BodyMerge owns atlas snapshots and merge/diff updates.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Assembly records are not certificates of closure or manifoldness; callers preserve source/chart ownership and the append-only mutation protocol.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes live body ownership, sampled grids and serialized source addresses.

# src/construction/IAutoMovieSolidBody.ts#IAutoMovieSolidBody.IFace

## @evidence contracts/development/design.md#principled-representation

A borrowed surface, tessellation grid and mutable trim cycles describe one body face with an optional cutter orientation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record keeps source geometry and current chart boundaries together while shared vertices remain in the body's mesh.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record validates neither grid order nor boundary correspondence, regularity or inclusive cycle ownership.

## @evidence contracts/development/common.md#meaningful-documentation

Fields identify chart grids, cycle ownership and the optional inward cutter flag.

# src/construction/IAutoMovieSolidBody.ts#IAutoMovieSolidBody.IBody

## @evidence contracts/development/design.md#principled-representation

Faces share one indexed mesh, while the original blend publications identify the surfaces later joins can use.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One mutable aggregate holds assembly order and its published geometric records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type proves no manifoldness, closure or mutation safety; draw appends to the current buffers rather than resetting them.

## @evidence contracts/development/common.md#meaningful-documentation

Members distinguish face, mesh and publication ownership.

# src/construction/IAutoMovieSolidBody.ts#IAutoMovieSolidBody.IFaceInput

## @evidence contracts/development/design.md#principled-representation

A surface and two chart grids describe a face before assembly supplies its cycles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the same surface/grid meanings as the eventual face without pretending it already owns trims.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Finite ordered grids and an appropriate source surface remain caller premises, not validated by the shape.

## @evidence contracts/development/common.md#meaningful-documentation

States that grid coordinates belong to the source surface chart.

# src/construction/IAutoMovieSolidBody.ts#IAutoMovieSolidBody.IMerge

## @evidence contracts/development/design.md#principled-representation

One request names merge/diff, an existing or new part and the original join/publication grid inputs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates body face ownership from the join's surfaces by omitting part/host in the borrowed join request.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Valid indices, count/rows and callbacks remain caller/operator premises; the type adds no numeric fallback.

## @evidence contracts/development/common.md#meaningful-documentation

States index versus descriptor input, column and row meaning, and original callback ownership. The paired traced mode uses the declared millimetre chord and gives its source curves both chart boundaries.

# src/construction/IAutoMovieSolidBody.ts#IAutoMovieSolidBody.IMerged

## @evidence contracts/development/design.md#principled-representation

A nullable blend/join pair and ordered diagnostics report the original body operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps failure information with the exact accepted join and publication without inferring success from empty diagnostics.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The shape does not turn a thrown callback into a returned rollback result or certify global geometry.

## @evidence contracts/development/common.md#meaningful-documentation

Members distinguish nullable geometry from diagnostics.

# src/construction/IAutoMovieSolidBody.ts#IAutoMovieSolidBody.IPublished

## @evidence contracts/development/design.md#principled-representation

Renumbers shared cycle vertex indices into boundary point identities and names each evaluating chain/chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A serializable boundary projection omits surface callbacks and full interior tessellation buffers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Preserves domain versus cut roles through serialization; carries inversion without proving closed topology, standalone source availability or repaired geometry.

## @evidence contracts/development/common.md#meaningful-documentation

States chain/chart correspondence and that faces reference shared point identifiers.

# src/construction/IAutoMovieSolidBody.ts#IAutoMovieSolidBody.IAtlasResult

## @evidence contracts/development/design.md#principled-representation

Separates compact solver face indices from mutable body assembly indices without changing any surface chart units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

BodyMerge passes the atlas to joins and the reverse index to rail clipping.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The snapshot isolates later cycle edits but cannot isolate mutations to borrowed surfaces or callbacks.

## @evidence contracts/development/common.md#meaningful-documentation

States index direction and copied versus retained dependencies.
