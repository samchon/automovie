# src/posture/prepareHumanFootAt.ts#prepareHumanFootAt

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body/socket/articulation, angular defaults and the moving world contact.

## @evidence contracts/development/implementation.md#principled-implementation

Calls the existing rotation and articulated offset owners once, rotates that fixed socket once, then uses the original ankle translation for every contact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed rotation and rotated offset precede one contact reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves quaternion multiplication/normalization and Vector3.subtract grouping; no contact or angle is approximated, and outputs expose no retained mutable rotation or offset.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation and evaluation; repeated contact trials omit fixed quaternion construction, articulation lookup and socket rotation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Body, side, socket, heading, pitch, toe flexion and roll determine one fixed rotated offset; changing any requires a new reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One reader retains one private rotation and offset until its owning contact solve releases it, without a contact history or external handle.
