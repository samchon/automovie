/**
 * The value shape a {@link IAutoMovieChannel} resolves to, mirroring the element
 * types glTF / KHR_animation_pointer animate.
 *
 * A channel is a typed, addressable value (an "lvalue"): the engine samples a
 * track, runs drivers, and clamps constraints all against a channel whose width
 * is known from this tag. `quaternion` is a `vec4` whose interpolation is slerp
 * (not lerp), so it is distinguished from a plain `vec4`. `weights` is a
 * variable-width `float[]` (one per morph target), the only non-fixed-width
 * kind.
 *
 * @evidence contracts/common.md#principled-implementation Mirrors the glTF and KHR_animation_pointer element types; the engine's `channelValueWidth` maps scalar, vec2, vec3, vec4 and quaternion to widths 1 to 4, and `channelIsRotation` selects slerp for a `quaternion` pointer channel.
 * @evidence contracts/common.md#clear-and-simple-design `quaternion` is kept apart from `vec4` only because its interpolation differs, and `weights` has no fixed width, so the width table omits it and track-shape checks skip the width assertion for it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The engine's `CHANNEL_VALUE_TYPES` set re-lists this union for runtime checks by hand; no value type is special-cased beyond the documented `weights` width exemption.
 * @evidence contracts/common.md#meaningful-documentation Documents the width each tag implies, why `quaternion` is distinct from `vec4`, and that `weights` holds one value per morph target.
 * @author Samchon
 */
export type AutoMovieChannelValueType =
  | "scalar"
  | "vec2"
  | "vec3"
  | "vec4"
  | "quaternion"
  | "weights";
