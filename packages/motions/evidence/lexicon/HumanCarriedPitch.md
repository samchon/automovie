# src/lexicon/HumanCarriedPitch.ts#HumanCarriedPitch

## @evidence contracts/development/common.md#meaningful-documentation

States the defect, the condition, the pivot, the angle and the case left alone.

## @evidence contracts/development/implementation.md#principled-implementation

Static equilibrium needs the centre of mass over the support region; the least rotation about the rearmost support that puts it there is the arctangent of the centre's forward and upward lever about that support.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The supports, the centre, the rearmost support, one angle, one rotation of the placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The supports are the carry's own resting and held regions and the centre is the body's own mass model; nothing is searched or tuned.

## @evidence contracts/development/implementation.md#efficient-algorithms

One centre of mass and at most three region places, once per coupling.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per coupling.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned placement closes over one point and one turn.
