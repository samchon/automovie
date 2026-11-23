# src/scene/IAutoMovieSceneObject.ts#IAutoMovieSceneObject

## @evidence contracts/development/design.md#principled-representation

Keeps the built scene with ordered cameras and an id-keyed light map; leading node-child order preserves mask addressing while light motion resolves semantic ids independently of child position.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Scene mounting, default camera selection and light animation each receive their existing lookup. The optional soft-prop handle owns further updates and retirement of the opted-in layer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Lights are never found by counting scene children, and authored camera order remains intact rather than selecting a preferred fixture camera.

## @evidence contracts/development/common.md#meaningful-documentation

Documents leading compiled node order, first-camera default and id-based light animation lookup rationale.
