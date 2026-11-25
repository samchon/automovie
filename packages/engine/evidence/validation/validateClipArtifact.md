# src/validation/validateClipArtifact.ts#validateClipArtifact

## @evidence contracts/development/implementation.md#principled-implementation

Admit clip duration, track uniqueness, channel addressing and shared sampler track-shape faults.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

clipTrackShapeFaults owns keyframe stride rules and the supplied channelGate owns addressability.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Committed duration stays strictly positive while the sampler permits zero, and channel-key serialization assumes JSON-representable artifact values.

## @evidence contracts/development/common.md#meaningful-documentation

Default node channel gate versus light gate is explicit, and faults remain attached to exact track fields.

## @evidence contracts/development/implementation.md#efficient-algorithms

T tracks plus their keyframe buffers require proportional traversal; serialized channel keys also cost channel text length.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Sampler predicates are reused instead of maintaining another stride specification.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns violation rows; clip buffers are borrowed and no playback task or decoder is created.
