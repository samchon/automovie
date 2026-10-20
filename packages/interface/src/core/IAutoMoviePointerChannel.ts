import { AutoMovieChannelValueType } from "./AutoMovieChannelValueType";

/**
 * A channel addressing an arbitrary property by RFC-6901 JSON pointer, keyed as ptr:<pointer> so it never aliases a node channel.
 *
 * Shot lightMotions applies /lights/<id>/<property> through resolveShotLighting, decoding the light id's ~1 and ~0 escapes. Value drivers and limits also read pointer-keyed values inside resolveFrame, but its output contains no pointer-value map; those values can affect later drivers or reported limit crossings. bindProfile preserves pointer addresses unchanged.
 *
 * Stock cameraMotion and objectMotions gates refuse pointer tracks because their appliers write node channels; supported light pointers use the separate lightMotions field.
 *
 * @evidence contracts/common.md#principled-implementation The pointer is matched as an exact string key in the sampled map, and only `parseLightPointer` interprets it, splitting on `/`, decoding the RFC-6901 escapes in the id segment and refusing any spelling that does not re-encode to the same text; `valueType` sets the per-keyframe width the track validator checks and selects slerp for `quaternion`.
 * @evidence contracts/common.md#clear-and-simple-design The pointer arm carries its own value type because a pointer, unlike a node path, implies no width, and the `ptr:` key prefix keeps both arms in one sampled map without collisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stock transform-clip gates refuse pointer tracks through validateHonorableChannel. Driven outputs may be scalar pointers or node weights with one value; multi-value weights and node TRS outputs refuse rather than being narrowed to a scalar.
 * @evidence contracts/common.md#meaningful-documentation States the key format, the two consumers and what each does with the value, that `resolveFrame` does not return pointer values, the escape decoding, and which shot fields refuse a pointer.
 */
export interface IAutoMoviePointerChannel {
  /** Selects the pointer arm of `IAutoMovieChannel`. */
  kind: "pointer";

  /**
   * RFC-6901 JSON pointer, such as /lights/key/intensity; slash and tilde inside a light id use ~1 and ~0 escapes.
   */
  pointer: string;

  /**
   * Declared value shape fixing track width, except unchecked weights; quaternion selects slerp for interior linear samples.
   */
  valueType: AutoMovieChannelValueType;
}
