# src/physics/physicalAuthoredCenter.ts#physicalAuthoredCenter

## @evidence contracts/development/common.md#meaningful-documentation

States the centre and velocity formulas and their units.

## @evidence contracts/development/implementation.md#principled-implementation

The mass-weighted sum of each segment's centre carried by its sampled pose, p + R c, moving with v + w x (R c), the rigid-body velocity of that point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the segments.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-null assertion reads each segment's sampled goal, which the sampler gives for every segment.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the segments.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one sample.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
