/**
 * The value shape a pointer {@link IAutoMovieChannel} resolves to, mirroring the
 * element types glTF and KHR_animation_pointer animate.
 *
 * A channel is a typed, addressable value: the engine samples a track, runs
 * drivers, and clamps limits against a channel whose width this tag fixes
 * (`scalar` 1, `vec2` 2, `vec3` 3, `vec4` and `quaternion` 4). `quaternion` is
 * distinguished from a plain `vec4` because linear tracks interpolate it by
 * slerp, and cubic tracks renormalize it. `weights` is a variable-width
 * `float[]` with one entry per morph target, the only kind whose width the
 * track validator cannot check.
 *
 * @evidence contracts/common.md#principled-implementation Mirrors the glTF accessor element types; `channelValueWidth` reads the fixed widths from one table that both the sampler and the artifact gate use, and `channelIsRotation` selects slerp for `quaternion` exactly as glTF requires for rotation tracks.
 * @evidence contracts/common.md#clear-and-simple-design A closed literal union carries the one fact a pointer cannot express by itself, its width and interpolation family, while a node channel derives both from its `path` instead of repeating this tag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown value type throws in `channelIsRotation` rather than defaulting to lerp, and `weights` is left unchecked by width instead of being assumed to hold one entry.
 * @evidence contracts/common.md#meaningful-documentation States the width each member fixes, why `quaternion` is separate from `vec4`, and that `weights` is variable-width and unchecked.
 * @author Samchon
 */
export type AutoMovieChannelValueType =
  | "scalar"
  | "vec2"
  | "vec3"
  | "vec4"
  | "quaternion"
  | "weights";
