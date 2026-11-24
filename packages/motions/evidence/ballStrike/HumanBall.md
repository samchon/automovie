# src/ballStrike/HumanBall.ts#HumanBall

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The grip's translation carried into the world by the prop's frame; half its aperture the radius.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A prop without a sized grip is refused with its contacts, never met at a guessed size.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the prop's few contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/ballStrike/HumanBall.ts#HumanBall.placed

## @evidence contracts/development/common.md#meaningful-documentation

Names the admissible grip, world output and frame read order.

## @evidence contracts/development/implementation.md#principled-implementation

Transforms the sized grip's model-space centre by the world frame and uses half the aperture as the radius.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares the same grip admission and transform for initial and final flight samples.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects an absent or unsized grip without sampling the frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans the prop's affordances once and reads one frame.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The caller supplies each frame reader.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no frame or reader.
