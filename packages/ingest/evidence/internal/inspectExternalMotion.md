# src/internal/inspectExternalMotion.ts#inspectExternalMotion

## @evidence contracts/development/implementation.md#principled-implementation

Validated FLOAT accessors, strictly increasing nonnegative times, supported interpolation and target-specific arity determine copied clips.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Motion normalization owns sampler/channel relationships while hierarchy, node TRS and byte readers remain separate owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Duplicate targets and non-finite values throw; quaternion value groups outside the 1e-4 magnitude tolerance are refused, while accepted keyframes are copied without normalization. Weight counts are checked only for a nonempty whole keyframe group, not against a target mesh's morph count.

## @evidence contracts/development/common.md#meaningful-documentation

Prose describes clip/channel ordering, exact keyframe ownership, interpolation, arity and quaternion checks.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost follows node/channel counts and decoded/copied keyframe values; shared accessors are decoded once but each track owns a copy.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Accessor index plus expected shape keys per-call decoding; immutable source/payload dependencies justify reuse and track arrays remain independent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The decode cache lives only for one inspection; returned clips retain arrays proportional to keyframe counts without raw payload bytes.
