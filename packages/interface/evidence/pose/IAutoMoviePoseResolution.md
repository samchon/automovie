# src/pose/IAutoMoviePoseResolution.ts#IAutoMoviePoseResolution

## @evidence contracts/development/common.md#meaningful-documentation

States what each operation reads and returns, the one synchronous evaluation it lives for, and that genuineness is the engine's runtime check, not this shape.

## @evidence contracts/development/design.md#principled-representation

Two operations, one per forward-kinematics step (a clinical joint to a bone-local rotation, a bone's rest and parent to its world frame), over the canonical joint, axes, rest-frame and resolved-bone contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `preparePoseResolution` produces it; `prepareSkeletonPoseResolution`, the motions pose-resolution loans and the action plans' posture readers borrow it, so its shape is the one contract they share.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No cached pose, target answer or validity flag is part of the shape; a structural stand-in is refused at run time by the engine's provenance check.

# src/pose/IAutoMoviePoseResolution.ts#IAutoMoviePoseResolution.ISource

## @evidence contracts/development/common.md#meaningful-documentation

Documents the loan forms a borrower accepts.

## @evidence contracts/development/design.md#principled-representation

A reader is lent directly or through a lazy getter that creates it at the first actual demand.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The action plans' and carriers' posture readers and the motions pose-resolution loans accept exactly these two forms.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The union names the two real forms; an absent loan stays the optional parameter's own absence.
