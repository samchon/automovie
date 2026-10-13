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
