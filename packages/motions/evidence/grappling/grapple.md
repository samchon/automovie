# src/grappling/grapple.ts#grapple.spacing

## @evidence contracts/development/common.md#meaningful-documentation

States what is measured, from which stance and why marks read it.

## @evidence contracts/development/implementation.md#principled-implementation

The trunk pitched about the hip carries a point at height h above it forward by h sin(pitch); each body's front is the farther of its head and chest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One front per role, then their sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The pitch is the scene's own entry stance and the depths are each body's measure.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per role.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the stance from the scene's own keys.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/grappling/grapple.ts#grapple.plan

## @evidence contracts/development/common.md#meaningful-documentation

Names the result, its input and what can be refused.

## @evidence contracts/development/implementation.md#principled-implementation

The support solver fits each role's ground contacts. The initiator's palms are laid on the receiver's named moving surface frames as one arm course over the grip's reach, hold and return (`grappleArms`), on the same clock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validate participant and duration, create the role's support plan, and add the initiator's hand goals and events.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A self-pair and a named held goal beyond the limb's measured reach are refused, and the receiver's pose never reads the holder's pose.

## @evidence contracts/development/implementation.md#efficient-algorithms

Creates a fixed set of support keys and one arm course for at most two hands; the course reads the receiver once per goal sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates floor support to support and the hands to `grappleArms`, which reuses clinch placement and the shared arm course.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains the finite support fits and the arm course until it settles.
