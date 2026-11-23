# src/kinematics/immobileAxisSwivels.ts#immobileAxisSwivels

## @evidence contracts/development/common.md#meaningful-documentation

States the premise, both readings' equations, that the result is candidates and every case that returns null.

## @evidence contracts/development/implementation.md#principled-implementation

A two-degree joint meets a three-degree rotation only where the third reads neutral; each reading is an exact sinusoid of the swivel, so the swivels are its roots (Tolani, Goswami and Badler 2000).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading, one sinusoid and its roots.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact roots, never a search or a sample; a joint the analysis does not cover returns null rather than a guess, and the caller's own measure decides every candidate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three rotations, nine dot products each, and one arccos.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The readings are `swivelJointReadings`'s and the roots `swivelArcs`'s, shared with a range's refused arcs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
