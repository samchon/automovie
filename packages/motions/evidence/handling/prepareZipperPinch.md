# src/handling/prepareZipperPinch.ts#prepareZipperPinch

## @evidence contracts/development/common.md#meaningful-documentation

States the neutral-frame geometry, coupled targets and use of the resulting seed.

## @evidence contracts/development/implementation.md#principled-implementation

Fits both digits to a rigid point pair and updates the pair's translation from the mean of the achieved tips.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds the pinching hand, reads its two surfaces, then refines their common midpoint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both tips and joint limits use the body's canonical rig. The seed does not certify the world contacts.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most twenty fits of two digits, with no solve inside the playback reader.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The posed direction and thickness are fixed for the translating slider and the prepared angles and offset serve the full stroke.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the seed data escape the synchronous fit.
