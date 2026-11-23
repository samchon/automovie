# src/lexicon/respondHumanMounted.ts#respondHumanMounted

## @evidence contracts/development/common.md#meaningful-documentation

States the response, its frame, its share and how it is spread.

## @evidence contracts/development/implementation.md#principled-implementation

The carrier's relative rotation read as pitch and roll, and its surge as the inclination of gravity plus the inertial force (atan of the acceleration over g); the trunk's flexion takes the surge lean less the pitch and its lateral bend the negative roll, scaled by the share and spread over two joints, each clamped to its range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One relative rotation, one pass over two joints, then the reach lean the ride uses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A joint at its range stops there; the pelvis stays on the saddle, carried as it is.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read per sample.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
