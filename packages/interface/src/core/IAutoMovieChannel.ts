import { IAutoMovieNodeChannel } from "./IAutoMovieNodeChannel";
import { IAutoMoviePointerChannel } from "./IAutoMoviePointerChannel";

/**
 * A channel: a typed, addressable animatable value, the universal target that
 * tracks animate, drivers compute, and limits clamp.
 *
 * Modelled on glTF animation targets generalized by KHR_animation_pointer. Two
 * forms:
 *
 * - {@link IAutoMovieNodeChannel}: a node's TRS or morph weights, the glTF-core
 *   path that every loader supports and the cheap, common case.
 * - {@link IAutoMoviePointerChannel}: an arbitrary property addressed by an
 *   RFC-6901 JSON pointer (a light's intensity, a material factor, a camera
 *   field of view, a rig degree of freedom). This is the form that lets
 *   automovie address any value, not just node TRS. Today a shot's
 *   `lightMotions` applies light pointers, and the driver graph reads and
 *   writes pointer values inside a frame, but `resolveFrame` returns none of
 *   them.
 *
 * A node channel corresponds to the pointer `/nodes/{id}/{path}` in meaning
 * only: `channelKey` keys the two forms in disjoint namespaces (`node:` and
 * `ptr:`), so a pointer spelled that way neither aliases nor moves the node.
 *
 * @evidence contracts/common.md#principled-implementation Follows glTF's split between core node targets and KHR_animation_pointer targets; `channelKey` gives every channel one string identity, `node:<id>:<path>` or `ptr:<pointer>`, that sampling, drivers and limits all key by, and it throws on an unknown kind.
 * @evidence contracts/common.md#clear-and-simple-design A two-member union discriminated on `kind`, so the common node case needs no pointer parsing and every other property goes through one pointer form instead of a member per property family.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A node path spelled as a pointer is kept distinct rather than aliased to the node, and the documentation states which consumers actually apply pointer values instead of implying all of them do.
 * @evidence contracts/common.md#meaningful-documentation States the two forms and when to use each, which consumers apply pointer values today, and that the namespaces are disjoint.
 */
export type IAutoMovieChannel =
  | IAutoMovieNodeChannel
  | IAutoMoviePointerChannel;
