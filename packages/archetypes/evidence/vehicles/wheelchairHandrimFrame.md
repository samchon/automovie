# src/index.ts#wheelchairHandrimFrame

## @evidence contracts/development/common.md#meaningful-documentation

Defines the two clocks, the sign of the angle, and the material point convention.

## @evidence contracts/development/implementation.md#principled-implementation

The radial vector chosen in chair coordinates at the catch is converted once to wheel material coordinates, then rotated and translated by the posed rim frame at each sample.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Cache the two possible rim selections, then specialize those two ids in the reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Radius and rotation come from the ride's posed model. An absent rim stays absent and follows the ride's normal refusal path.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work for a two-wheel selection and constant work per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses ride.frame for articulation, Quaternion and Vector3 for rotation, and AutoMovieArchetypeFrame.facing for orientation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The reader retains two local vectors and its source ride only.
