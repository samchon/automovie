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
 *   not just node TRS". Today a shot's `lightMotions` applies light pointers,
 *   and the driver graph reads and writes pointer values inside a frame, but
 *   `resolveFrame` returns none of them.
 *
 * A node channel corresponds to the pointer `/nodes/{id}/{path}` in meaning
 * only: `channelKey` keys the two forms in disjoint namespaces (`node:` and
 * `ptr:`), so a pointer spelled that way neither aliases nor moves the node.
 *
 * @author Samchon
 */
export type IAutoMovieChannel =
  | IAutoMovieNodeChannel
  | IAutoMoviePointerChannel;
