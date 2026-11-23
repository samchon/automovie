# src/posture/prepareHumanArmRoom.ts#prepareHumanArmRoom

## @evidence contracts/development/common.md#meaningful-documentation

States what is fixed at preparation, what each candidate recomputes, the unit and the lifetime of the reader.

## @evidence contracts/development/implementation.md#principled-implementation

A bone's frame depends only on its own and its ancestors' joints and the root, so the arm's three joints move only the shoulder's subtree. The fixed-source reader admits the pose once and composes that subtree from each candidate's edits through the same parent-first recurrence and arithmetic as a whole-pose read of the edited pose, and a profile segment's placement reads only its own bone, so each candidate's bones and placed segments hold the values `room` computes from the whole pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preparation reads and places the body; the returned reader edits, replaces the subtree's bones and segments in their original places and takes the two readings in `room`'s order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An arm joint the pose does not carry is not written, as `HumanArmClearance.posed` leaves it; the placed segments keep the profile's order, and a subtree placement whose count differs from the body's own falls back to placing the whole body. No reading is kept between candidates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation costs one whole-pose read and placement, O(B+S) for B bones and S segments, none where the caller hands them. An exactly unchanged arm may reuse the base bones after every matching joint record is checked. A decision-bound query stops at the first observed violation. An ordinary changed candidate costs three admitted edits, the subtree's bones (the arm and its hand), a B-entry map copy, the subtree's segments and an S-entry array copy, then the two readings' own queries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The pose, body, side, external colliders and baseline are fixed for the reader's life; bones and segments outside the shoulder's subtree are shared across candidates because no candidate changes a joint above or beside them; what the tangle reading prepares of a still placed segment is kept across candidates with that same placed record, and a moved segment's is cleared when it is replaced.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader owns one bone map, one placement, one fixed-source workspace and the subtree's names until its search releases it; it stores no candidate, reading or reader beyond that.
