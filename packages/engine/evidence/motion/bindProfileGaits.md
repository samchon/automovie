# src/motion/bindProfileGaits.ts#bindProfileGaits

## @evidence contracts/development/implementation.md#principled-implementation

Checks gait-name uniqueness then delegates each declared gait to gaitMotion with the requested sampling count and skeleton id; binding preserves profile gait semantics rather than deriving body-specific angles from an unavailable rig.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The binder owns profile-scoped clip identity and name indexing while gaitMotion owns sampling, phase and scalar gait admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Duplicate names refuse before synthesis, and own data-property definition preserves names such as __proto__ without mutating the result prototype or silently losing a clip.

## @evidence contracts/development/common.md#meaningful-documentation

States exact-name keys, empty-gait behavior, skeleton-id binding and the absence of geometry-dependent retargeting.

## @evidence contracts/development/implementation.md#efficient-algorithms

Name admission is O(G) with a set; synthesis is O(sum of sampled gait keyframes times declared limb rows), and the output stores one clip per gait without extra entry arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each declared gait is synthesized once per call; different skeleton ids produce independently identified clips rather than reusing a mutable cache by profile name.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The result owns its clips and keyframe populations; the temporary name set is released after return/throw and no profile object or resource handle is retained.
