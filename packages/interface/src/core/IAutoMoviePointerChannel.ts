import { AutoMovieChannelValueType } from "./AutoMovieChannelValueType";

/**
 * A channel addressing an arbitrary property by RFC-6901 JSON pointer, keyed by
 * `channelKey` as `ptr:<pointer>` so it never aliases a node channel.
 *
 * Two consumers read it. A shot's `lightMotions` applies
 * `/lights/<id>/<property>` pointers through `resolveShotLighting`. The DRIVER
 * graph (a prop profile's `source`/`output`, a channel limit) reads and writes
 * pointer values in `resolveFrame`'s sampled map, but `resolveFrame` returns
 * only node matrices and weights, so a pointer value there is visible only to a
 * later driver or a limit violation in the same frame. `bindProfile` passes
 * pointers through without mapping.
 *
 * A shot field admits exactly the targets its own applier writes, so
 * `cameraMotion` and `objectMotions` refuse one: those are applied node-by-node
 * and a pointer track there would validate and then do nothing (#1339). A
 * pointer no applier resolves is refused on every shot clip until one lands.
 *
 * @evidence contracts/common.md#principled-implementation RFC 6901 addressing with an explicit `valueType`, because a pointer string carries no width; `parseLightPointer` decodes `~1` then `~0` and rejects any pointer that is not the canonical encoding of what it decodes to.
 * @evidence contracts/common.md#clear-and-simple-design The pointer and its width are the whole record; what a target means lives in the applier that parses it, such as `parseLightPointer`, rather than in extra fields here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shot transform clips refuse pointer tracks because no applier writes them, yet the driver graph still accepts pointer outputs whose values `resolveFrame` never returns, the validated-but-unapplied pattern #1339 names, reported as a finding.
 * @evidence contracts/common.md#meaningful-documentation States the key namespace, which consumers apply pointers, that `resolveFrame` does not return pointer values, that profile binding leaves them unmapped, and which shot fields refuse them.
 * @author Samchon
 */
export interface IAutoMoviePointerChannel {
  /** Discriminator. */
  kind: "pointer";

  /**
   * RFC-6901 JSON pointer to the target property, e.g. `/materials/3/baseColor`
   * or `/cameras/0/fovY`. `~0`/`~1` escaping applies.
   */
  pointer: string;

  /**
   * The value width this pointer resolves to (a pointer carries no implicit
   * type).
   */
  valueType: AutoMovieChannelValueType;
}
