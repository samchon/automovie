import { AutoMovieChannelValueType } from "./AutoMovieChannelValueType";

/**
 * A channel addressing an arbitrary property by RFC-6901 JSON pointer. Honored
 * by the DRIVER graph (a prop profile's `source`/`output`, a channel limit) and
 * by a shot's `lightMotions` (`/lights/<id>/<property>`).
 *
 * A shot field admits exactly the targets its own applier writes, so
 * `cameraMotion` and `objectMotions` refuse one: those are applied node-by-node
 * and a pointer track there would validate and then do nothing (#1339). A
 * pointer no applier resolves is refused on every shot clip until one lands.
 *
 * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-contract Exposes `IAutoMoviePointerChannel` as the portable data boundary for the motion channel contract requirement.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `IAutoMoviePointerChannel` for the performance motion clip keytime interpolation system contract.
 */
export interface IAutoMoviePointerChannel {
  /**
   * Discriminator.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-contract Exposes `kind` as the portable data boundary for the motion channel contract requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `kind` for the performance motion clip keytime interpolation system contract.
   */
  kind: "pointer";

  /**
   * RFC-6901 JSON pointer to the target property, e.g. `/materials/3/baseColor`
   * or `/cameras/0/fovY`. `~0`/`~1` escaping applies.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-contract Exposes `pointer` as the portable data boundary for the motion channel contract requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `pointer` for the performance motion clip keytime interpolation system contract.
   */
  pointer: string;

  /**
   * The value width this pointer resolves to (a pointer carries no implicit
   * type).
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-contract Exposes `valueType` as the portable data boundary for the motion channel contract requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `valueType` for the performance motion clip keytime interpolation system contract.
   */
  valueType: AutoMovieChannelValueType;
}
