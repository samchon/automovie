# src/index.ts#applyLightState

## @evidence contracts/development/implementation.md#principled-implementation

Maps admitted TRS, linear RGB/intensity, point/spot range, degree cone half-angle to radians and area metre extent to Three fields; target class must match the authored kind for kind-specific properties, while this writer neither reconstructs aim children nor updates shadow configuration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the same field conversion for buildLight and absolute frame writes; existing applyTransform owns quaternion/TRS realization and buildLight owns class/aim/shadow acquisition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads authored/resolved values without time/id-specific substitutions or renderer monkeypatches; class guards limit which real Three properties are touched, rather than coercing an incompatible host object.

## @evidence contracts/development/common.md#meaningful-documentation

States supported light properties, angular units, shared build/frame writer, absolute placement and the aim-child dependency.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs a fixed-size TRS/color update and at most one kind branch, constant CPU time/storage independent of scene population or shadow raster size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the same conversion for static construction and motion; it writes current absolute values each call because an unchanged declaration does not prove a mutable target still holds them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows target/declaration and allocates no light, material, shadow map or task; no references survive the call beyond fields already owned by the target.
