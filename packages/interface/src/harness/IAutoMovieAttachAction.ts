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
