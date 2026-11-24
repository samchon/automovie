# src/physics/physicalSupportSole.ts#physicalSupportSole

## @evidence contracts/development/common.md#meaningful-documentation

States each planted limb's sole frame, its contact outline in that frame and its side among the others, for a body of any number of limbs.

## @evidence contracts/development/implementation.md#principled-implementation

The sole frame is the limb's heading relative to its authored rotation, latched where its stance began, as the capture-point planner reads a sole (`physicalIcpPlanner`); the side is the limb's place left or right of the other limbs' mean across the root's heading, so no limb count or anatomy is named.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three small functions: the frame, the foot built on it, and the side.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts or fallbacks beyond the stated premise that a heading with no horizontal part faces +z.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the limb's footprint for the outline and in the limbs for the side.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads one limb at one substep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
