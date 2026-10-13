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
 * @evidence contracts/common.md#principled-implementation A union discriminated on `kind` that follows glTF's split between core node targets and KHR_animation_pointer; `channelKey` maps each arm into its own key namespace and throws on an unknown kind, path or value type, so the two arms never address one sampled entry.
 * @evidence contracts/common.md#clear-and-simple-design Two arms only: the node arm covers the TRS and morph-weight paths the frame resolver folds into nodes, and the pointer arm carries its own `valueType` because a pointer string implies no width.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither arm is rewritten into the other; a `/nodes/...` pointer stays under its `ptr:` key instead of being quietly treated as the node channel it resembles.
 * @evidence contracts/common.md#meaningful-documentation States both forms, which consumers apply pointer channels today, that `resolveFrame` returns no pointer values, and that node and pointer keys never alias.
 * @author Samchon
 */
export type IAutoMovieChannel =
  | IAutoMovieNodeChannel
  | IAutoMoviePointerChannel;
