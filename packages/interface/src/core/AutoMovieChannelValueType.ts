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
 */
export type AutoMovieChannelValueType =
  | "scalar"
  | "vec2"
  | "vec3"
  | "vec4"
  | "quaternion"
  | "weights";
