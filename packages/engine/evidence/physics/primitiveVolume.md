# src/physics/primitiveVolume.ts#primitiveVolume

## @evidence contracts/development/implementation.md#principled-implementation

Use closed-form solid volumes for box, sphere, cylinder, cone, capsule and torus in cubic metres; plane and mesh contribute zero because no closed solid volume is declared.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One primitive-kind dispatch keeps volume semantics independent of triangulation and aggregate placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Capsule volume includes cylinder plus sphere under the declared dimensions even where render approximation differs; mesh zero is an explicit missing-measurement policy, not a claimed physical volume.

## @evidence contracts/development/common.md#meaningful-documentation

Docs give cubic-metre units and enumerate unsupported zero-volume cases; valid finite dimensions are a caller admission premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

All cases use constant arithmetic rather than tessellation or surface integration, with no output collection.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

deriveCenterOfMass reuses this owner for every part; no identity cache would be valid after dimension mutation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a number is returned; no vectors, mesh storage, handles or tasks survive the call.
