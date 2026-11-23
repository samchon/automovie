# src/index.ts#IApplyAutoMovieInspectionProps

## @evidence contracts/development/design.md#principled-representation

A built scene and request define a picture. Supplied marks contain the current frame's geometry, lifetime kind declarations admit selection independent of that geometry, and the renderer supplies the optional clipping switch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The subject supplies mark geometry and its declaration, the builder owns the scene, the parser owns the request and the renderer owns its clipping switch.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A handle may serve multiple views/frames only while its concrete inspected objects remain. Marks on those objects update through the handle; replacing the object graph requires restoring it and applying a new inspection.

## @evidence contracts/development/common.md#meaningful-documentation

Each member states who supplies it and what its absence means.
