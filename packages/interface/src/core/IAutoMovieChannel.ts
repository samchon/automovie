import { IAutoMovieNodeChannel } from "./IAutoMovieNodeChannel";
import { IAutoMoviePointerChannel } from "./IAutoMoviePointerChannel";

/**
 * A channel: a typed, addressable animatable value, the universal target that
 * tracks animate, drivers compute, and constraints clamp.
 *
 * Modelled on glTF animation targets generalized by KHR_animation_pointer. Two
 * forms:
 *
 * - {@link IAutoMovieNodeChannel}: a node's TRS or morph weights, the glTF-core
 *   path that every loader supports (and the cheap, common case).
 * - {@link IAutoMoviePointerChannel}: an arbitrary property addressed by an
 *   RFC-6901 JSON pointer (a light's intensity, a material factor, a camera
 *   FOV, a rig DOF). This is the form that lets automovie address "any value,
 *   not just node TRS"; today the driver graph and a shot's `lightMotions`
 *   consume it.
 *
 * A node-TRS channel is sugar for the pointer `/nodes/{id}/{path}`; the engine
 * treats both as the same kind of addressable lvalue.
 *
 * @author Samchon
 */
export type IAutoMovieChannel =
  | IAutoMovieNodeChannel
  | IAutoMoviePointerChannel;
