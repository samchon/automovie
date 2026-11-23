# src/construction/IAutoMovieSolidMeshLoop.ts#IAutoMovieSolidMeshLoop

## @evidence contracts/development/design.md#principled-representation

Classifier queries native chart coordinates with the same surface jet and a world-mm margin, returning whether every trim keeps the point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

SolidMeshLoop prepares this callback for gridAutoMovieSolidMesh; SolidSurface owns the metric jet.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The signature does not claim exact continuous offset geometry or impose a new tolerance; loop classification owns its metric admission.

## @evidence contracts/development/common.md#meaningful-documentation

Defines membership result, native chart, surface metric and margin units.

# src/construction/IAutoMovieSolidMeshLoop.ts#IAutoMovieSolidMeshLoop.Classifier

## @evidence contracts/development/design.md#principled-representation

u and v retain the surface chart units, jet is evaluated there, and margin is a world-mm distance used by the trim metric.

## @evidence contracts/development/design.md#minimal-and-owned-surface

SolidMeshLoop.prepare returns this reader to grid sampling; its closure owns any prepared loop snapshots until released.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A boolean preserves kept/rejected membership without inventing a new source boundary; unchanged source data and valid metric are caller premises.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies query coordinate/jet agreement, physical margin and prepared-reader lifetime.
