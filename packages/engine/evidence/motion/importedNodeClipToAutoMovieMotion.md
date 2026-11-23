# src/motion/importedNodeClipToAutoMovieMotion.ts#importedNodeClipToAutoMovieMotion

## @evidence contracts/development/implementation.md#principled-implementation

Samples the union of authored times, removes source rest rotation, and decomposes local quaternions into clinical axes/rest frames under actual rig domains; hips translation subtracts hips rest offset. One common law is representable by keyframe easing, but only step is identical throughout each source interval in general.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Conversion owns explicit channel/mapping admission and source clinical lowering; target-rig contact retargeting remains a subsequent operation, while existing sampleClip and decomposeJointRotation own interpolation/inversion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unmapped channels, non-hips translation, scale/weights, mixed/cubic laws and malformed quaternions refuse; no inferred mapping or denser approximating bake hides these differences. Finite normalized source rig and well-formed track buffers remain the imported-clip caller's admission premise.

## @evidence contracts/development/common.md#meaningful-documentation

States retained key times, supported channels/laws, named refusal, clinical inversion tolerance and the inter-key quaternion-versus-axis limitation without claiming lossless linear-curve preservation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Indexes source bones/mappings/tracks once, unions/sorts K source times, then samples T tracks and decomposes M mapped bones per output time; output stores O(KM) joint records and no full frame-rate bake.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Source bone and channel maps are reused at all key times, each sampleClip result supplies every mapped rotation/root value for that time, and no conversion cache survives mutable clip/skeleton edits.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary maps/sets and key-time union live for this conversion; the caller owns new keyframes/root/joint records and no source buffer, native resource or callback is retained independently.
