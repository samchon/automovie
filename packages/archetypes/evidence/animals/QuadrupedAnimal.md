# src/animals/QuadrupedAnimal.ts#QuadrupedAnimal

## @evidence contracts/development/implementation.md#principled-implementation

The existing shared rig, body layout and mass builder consume one coherent profile.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read dimensions, lay the body, add the producer's parts and finish.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No equine mass law or unknown paw coefficient is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed-size rig and one pass over its parts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The producer's one draw session supplies every recorded dimension.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned model owns its data and no process resource is opened.

## @evidence contracts/development/common.md#meaningful-documentation

States the construction and the two physical approximations.
