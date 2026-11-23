# src/core/IAutoMoviePointerChannel.ts#IAutoMoviePointerChannel

## @evidence contracts/development/design.md#principled-representation

The pointer is matched as an exact string key in the sampled map, and only `parseLightPointer` interprets it, splitting on `/`, decoding the RFC-6901 escapes in the id segment and refusing any spelling that does not re-encode to the same text; `valueType` sets the per-keyframe width the track validator checks and selects slerp for `quaternion`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pointer arm carries its own value type because a pointer, unlike a node path, implies no width, and the `ptr:` key prefix keeps both arms in one sampled map without collisions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Stock transform-clip gates refuse pointer tracks through validateHonorableChannel. Driven outputs may be scalar pointers or node weights with one value; multi-value weights and node TRS outputs refuse rather than being narrowed to a scalar.

## @evidence contracts/development/common.md#meaningful-documentation

States the key format, the two consumers and what each does with the value, that `resolveFrame` does not return pointer values, the escape decoding, and which shot fields refuse a pointer.
