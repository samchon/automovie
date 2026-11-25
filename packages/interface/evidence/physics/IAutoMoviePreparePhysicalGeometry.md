# src/physics/IAutoMoviePreparePhysicalGeometry.ts#IAutoMoviePreparePhysicalGeometry.ICollider

## @evidence contracts/development/common.md#meaningful-documentation

Associates one profile shape with its owning scene body, segment and current bone placement.

## @evidence contracts/development/design.md#principled-representation

Canonical shape-local geometry is composed with a world-metre/unit-quaternion bone transform.

## @evidence contracts/development/design.md#minimal-and-owned-surface

preparePhysicalGeometry uses the same collider descriptor for contact, projection and minimum-height queries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shape/profile admission and coherent identities are caller responsibilities; the record owns no native collider or world handle.

# src/physics/IAutoMoviePreparePhysicalGeometry.ts#IAutoMoviePreparePhysicalGeometry.IQueries

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes geometric contact receipts, lowest world height and native surface projection.

## @evidence contracts/development/design.md#principled-representation

Queries accept canonical placed colliders and world-metre points; contact uses a finite second label and nonnegative metre prediction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

preparePhysicalGeometry supplies these reusable closures over the engine's convex geometry without building a dynamics world.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Receipts keep null impulse and positive separation remains separation; queries run in float64 and may throw admission failures.
