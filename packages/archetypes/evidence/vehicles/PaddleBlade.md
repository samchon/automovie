# src/vehicles/PaddleBlade.ts#PaddleBlade.draw

## @evidence contracts/development/common.md#meaningful-documentation

States which dimensions control silhouette and dihedral, in metres.

## @evidence contracts/development/implementation.md#principled-implementation

Each convex thin panel shares boundary stations with its neighbors and tapers towards the tip.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Define stations, then add one wall cell for each pair of stations and half width.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The rendered blade and its collider share identical panel geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Six small convex cells per blade.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each paired cross section and the repeated half construction use one table.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Construction state goes to the caller's builder.

# src/vehicles/PaddleBlade.ts#PaddleBlade.grip

## @evidence contracts/development/common.md#meaningful-documentation

States the handle frame convention and physical grip site.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the drawn center and tangent with the same rounded grip affordance as other hand tools.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Records one handle with the supplied shaft measurements.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The caller supplies the exact center of its shaft or T-bar and real aperture.

## @evidence contracts/development/implementation.md#efficient-algorithms

One frame construction and append.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call declares a distinct physical handle.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The builder owns the resulting contact data.

# src/vehicles/PaddleBlade.ts#PaddleBlade.tip

## @evidence contracts/development/common.md#meaningful-documentation

Names the physical witness and outward axis.

## @evidence contracts/development/implementation.md#principled-implementation

Faces the extreme blade section's plane with the width and thickness of that section.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame and one surface.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tip position and width are the values used to construct the visible final station.

## @evidence contracts/development/implementation.md#efficient-algorithms

No search or mesh traversal.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each tip has its own named site and orientation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The builder owns the resulting contact data.
