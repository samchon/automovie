# src/kinematics/preparePoseReading.ts#preparePoseReading

## @evidence contracts/development/implementation.md#principled-implementation

The frames are `composePoseFrames`' of the admitted articulations and root, the pass the operation's own reads take, so a bone read here has the components a read of the same admission through the operation has.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lazy composition and one demand selection; admission, conversion and the frame arithmetic stay with their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every returned bone is a fresh record; an unreachable name stays absent as in the operation's reader; nothing is compared or looked up to decide validity, because the reading is made only by a completed admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the rig at the first read, then K fresh records a read; live names sort as in the operation's reader and bound indices do not.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The composed frames are shared among the readers of this one reading, whose articulations and root never change.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the articulation row, the root's two values and one workspace of frames until its holder releases it; no pose, record or operation is retained.

## @evidence contracts/development/common.md#meaningful-documentation

States what the reading holds, that it is a value of the admission and not of the records, the demand rules and the fresh ownership of what it returns.
