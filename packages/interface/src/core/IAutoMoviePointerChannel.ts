import type { AutoMovieChannelValueType } from "./AutoMovieChannelValueType";

/**
 * A channel addressing an arbitrary property by RFC-6901 JSON pointer, keyed as
 * ptr:<pointer> so it never aliases a node channel.
 *
 * Shot lightMotions applies /lights/<id>/<property> through
 * resolveShotLighting, decoding the light id's ~1 and ~0 escapes. Value drivers
 * and limits also read pointer-keyed values inside resolveFrame, but its output
 * contains no pointer-value map; those values can affect later drivers or
 * reported limit crossings. bindProfile preserves pointer addresses unchanged.
 *
 * Stock cameraMotion and objectMotions gates refuse pointer tracks because
 * their appliers write node channels; supported light pointers use the separate
 * lightMotions field.
 */
export interface IAutoMoviePointerChannel {
  /** Selects the pointer arm of `IAutoMovieChannel`. */
  kind: "pointer";

  /**
   * RFC-6901 JSON pointer, such as /lights/key/intensity; slash and tilde
   * inside a light id use ~1 and ~0 escapes.
   */
  pointer: string;

  /**
   * Declared value shape fixing track width, except unchecked weights;
   * quaternion selects slerp for interior linear samples.
   */
  valueType: AutoMovieChannelValueType;
}
