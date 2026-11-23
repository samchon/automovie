# src/geometry/IAutoMovieVector3.ts#IAutoMovieVector3

## @evidence contracts/development/design.md#principled-representation

Three Cartesian components in the right-handed y-up frame glTF and `three.js` use, so engine values pass to the viewer and to imported clips without an axis swap or handedness flip.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One plain three-number record serves points, directions and scale factors, with meaning stated at each field rather than split into nominal point and direction types that interface's no-wrapper rule forbids.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type promises no unit length or finiteness it cannot enforce; each owning validator, such as `validateTransformScalars` for a transform, checks the values its field needs.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and handedness, that one shape carries several meanings decided by the field, and where ranges are enforced; members give each axis's direction relative to a character at zero heading.
