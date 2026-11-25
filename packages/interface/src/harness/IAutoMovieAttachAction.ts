import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/**
 * Rigidly couple this actor to another node's bone for the action's span: a
 * sword in a hand, a prop carried. A persistent mount, such as a rider on a
 * horse, belongs in staging (`IAutoMovieStageActor.attach`) rather than in an
 * action repeated every shot.
 *
 * `performShot` refuses an actor attaching to itself, a parent that is not a
 * staged node or has no rig, and a bone missing from the parent's skeleton.
 * `compileAttach` bakes the child's translation and rotation from the parent's
 * posed bone and the optional bone-local offset. The authored offset determines
 * the child's pose at the first key, including when switching parents. Playback
 * writes nothing before the first key and holds the last key afterward. An auto
 * duration keeps coupling to the shot end.
 */
export interface IAutoMovieAttachAction extends IAutoMovieActionBase {
  /** Selects an attachment as the action family. */
  verb: "attachTo";

  /** Staged, rigged scene node that owns the attachment bone; not the actor. */
  parent: string;

  /** Semantic bone on the parent's skeleton to which the actor is attached. */
  bone: AutoMovieHumanoidBone;

  /**
   * Child frame in the posed bone, in metres with a unit rotation. The child
   * uses the bone frame when omitted.
   */
  offset?: IAutoMovieRigidTransform;
}
