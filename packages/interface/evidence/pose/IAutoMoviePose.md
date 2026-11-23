# src/pose/IAutoMoviePose.ts#IAutoMoviePose

## @evidence contracts/development/design.md#principled-representation

validatePose checks rig identity, root transform scalars, declared joint membership, duplicates and each available effective ROM constraint. resolvePose composes sparse articulation over reachable rest hierarchy with root translation/rotation; it does not apply root or rest scale.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Skeleton identity, optional root placement and sparse joint angles separate rig selection, whole-body movement and articulation, and the same record is reused by static staging and timed keyframes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unlisted bones use rest articulation. validatePose reports duplicate declared bones, while direct ungated resolvePose keeps the last joint and omits unreachable bones; this type does not make those low-level conventions disappear or certify a complete rendered pose.

## @evidence contracts/development/common.md#meaningful-documentation

States sparse rest behavior, target-rig validation, parent-space root placement and null identity, plus the single-entry rule for each articulated bone.
