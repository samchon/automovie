import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/**
 * Rigidly couple this actor to another node's bone for the action's span: a
 * sword in a hand, a prop carried. Engine: `resolveAttachment`. (A _persistent_
 * mount, e.g. a rider on a horse, is better declared once in staging than
 * repeated as an action every shot.)
 *
 * `performShot` refuses an actor attaching to itself, a parent that is not a
 * staged rigged node, and a bone missing from the parent's skeleton.
 * `compileAttach` puts the child's origin exactly on the bone frame with no
 * grip offset, and an `"auto"` duration keeps the coupling to the shot end.
 *
 * @evidence contracts/common.md#principled-implementation A rigid fixed-joint coupling baked by `compileAttach`: each sample runs the parent's FK through `resolveAttachment` and composes the bone frame onto the parent's world placement, so the child inherits position and orientation together.
 * @evidence contracts/common.md#clear-and-simple-design Adds only `parent` and `bone` to the shared base, because the coupling carries no offset; a persistent rider belongs in staging mounts rather than a repeated per-shot action.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No parent or bone is special-cased; with no grip offset field the child's origin lands on the bone origin, so a carried prop must be modelled with its grip at its own origin.
 * @evidence contracts/common.md#meaningful-documentation States what is coupled to what, the refusals, that the child's origin rides the bone with no offset, how `"auto"` spans, and when to prefer a staged mount.
 * @author Samchon
 */
export interface IAutoMovieAttachAction extends IAutoMovieActionBase {
  /** Selects an attachment as the action family. */
  verb: "attachTo";

  /** Staged, rigged scene node that owns the attachment bone. */
  parent: string;

  /** Semantic bone on the parent's skeleton to which the actor is attached. */
  bone: AutoMovieHumanoidBone;
}
