import { AutoMovieChannelValueType } from "./AutoMovieChannelValueType";

/**
 * A channel addressing an arbitrary property by RFC-6901 JSON pointer, keyed by
 * `channelKey` as `ptr:<pointer>` so it never aliases a node channel.
 *
 * Two consumers read it. A shot's `lightMotions` applies
 * `/lights/<id>/<property>` pointers through `resolveShotLighting`, which
 * decodes the `~1` and `~0` escapes in the light id. The driver graph (a
 * profile's `driven` source and output, a channel limit) reads and writes
 * pointer values in `resolveFrame`'s sampled map, but `resolveFrame` returns
 * only node matrices and weights, so a pointer value there is visible only to a
 * later driver or a limit violation in the same frame. `bindProfile` passes
 * pointers through without mapping.
 *
 * A shot field admits exactly the targets its own applier writes, so
 * `cameraMotion` and `objectMotions` refuse a pointer track: they are applied
 * node by node, and a pointer there would validate and then do nothing
 * (#1339). A pointer no applier resolves is refused on every shot clip until
 * one lands.
 *
 * @evidence contracts/common.md#principled-implementation The pointer is matched as an exact string key in the sampled map, and only `parseLightPointer` interprets it, splitting on `/`, decoding the RFC-6901 escapes in the id segment and refusing any spelling that does not re-encode to the same text; `valueType` sets the per-keyframe width the track validator checks and selects slerp for `quaternion`.
 * @evidence contracts/common.md#clear-and-simple-design The pointer arm carries its own value type because a pointer, unlike a node path, implies no width, and the `ptr:` key prefix keeps both arms in one sampled map without collisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shot fields whose applier writes only nodes refuse pointer tracks through `validateHonorableChannel` instead of accepting and dropping them, and a driven output must be a scalar pointer rather than being narrowed.
 * @evidence contracts/common.md#meaningful-documentation States the key format, the two consumers and what each does with the value, that `resolveFrame` does not return pointer values, the escape decoding, and which shot fields refuse a pointer.
 * @author Samchon
 */
export interface IAutoMoviePointerChannel {
  /** Selects the pointer arm of `IAutoMovieChannel`. */
  kind: "pointer";

  /**
   * RFC-6901 JSON pointer to the target property, such as
   * `/lights/key/intensity`; a light id containing `/` or `~` is written with
   * the `~1` and `~0` escapes.
   */
  pointer: string;

  /**
   * Value shape this pointer resolves to. It fixes the per-keyframe track width
   * (unchecked for `weights`), and `quaternion` makes linear tracks slerp.
   */
  valueType: AutoMovieChannelValueType;
}
