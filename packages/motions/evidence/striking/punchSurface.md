# src/striking/punchSurface.ts#punchSurface

## @evidence contracts/development/common.md#meaningful-documentation

States each technique's surface, travel and hand attitude with its source and the hammerfist's approximation.

## @evidence contracts/development/implementation.md#principled-implementation

The hand's attitude aligns the rest finger axis and palm normal to the technique's directions (`StrikingBody.fist`), and the surface is the body's own socket, region or rest joint carried by that rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per technique, each a direction, a rotation and a surface.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every surface is read from the canonical body; the hammerfist's edge is stated as a joint-centre approximation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
