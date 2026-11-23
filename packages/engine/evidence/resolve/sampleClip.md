# src/resolve/sampleClip.ts#sampleClip

## @evidence contracts/development/implementation.md#principled-implementation

Validate finite query time and canonical clip/track shape, normalize loop/clamp time, then evaluate STEP, linear quaternion/vector or glTF cubic Hermite tracks by channelKey.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared faults own admission, segmentIndex owns binary search and quaternion/Hermite helpers own interpolation; this owner assembles samples.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Duplicates/malformed tracks throw and exact STEP keys use the new value; endpoints preserve authored payloads and unsupported extreme arithmetic can still overflow.

## @evidence contracts/development/common.md#meaningful-documentation

Docs state seconds, wrapping/clamping, tangent stride and quaternion interpolation/renormalization with endpoint ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Full key/value validation costs O(sum(K*W)) per sample; each track adds O(log K) search and O(W) returned vector storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Staging/playback share validators/interpolators; mutable clip contents are revalidated without an identity-only track cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns fresh vectors/map and borrows channels; temporary arrays release with the call and no animation host or task is held.
