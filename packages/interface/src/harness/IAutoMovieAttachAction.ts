import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/**
 * Rigidly couple this actor to another node's bone for the action's span: a
 * sword in a hand, a prop carried. A persistent mount, such as a rider on a
 * horse, belongs in staging (`IAutoMovieStageActor.attach`) rather than in an
 * action repeated every shot.
 *
 * `performShot` refuses an actor attaching to itself, a parent that is not a
 * staged node or has no rig, and a bone missing from the parent's skeleton.
 * `compileAttach` then bakes the child's node clip: at each sample
 * `resolveAttachment` poses the parent and the child's origin and rotation
 * land exactly on the bone frame, with no grip offset. The clip holds the
 * bone's start frame before the coupling and its last frame after, and an
 * `"auto"` duration keeps the coupling to the shot end.
 *
 * @evidence contracts/common.md#principled-implementation The child's world transform is the parent's placement composed with the bone's model-space frame from forward kinematics, `translation = parentPos + parentRot · bone.translation` and `rotation = parentRot ∘ bone.rotation`, the behavior of a fixed joint.
 * @evidence contracts/common.md#clear-and-simple-design The action adds only the parent node and bone to the shared base; the child is the action's actor, and the coupling becomes an ordinary node clip so the renderer needs no attachment concept.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No grip offset or per-prop correction is applied, so a prop whose origin is not its grip point shows that mismatch instead of a hidden fix, and an unrigged parent is refused rather than attached to its root.
 * @evidence contracts/common.md#meaningful-documentation States the use, where a persistent mount belongs instead, every refusal, how the clip is baked and held outside the span, the absent grip offset, and what `"auto"` means; members name the parent and bone requirements.
 * @author Samchon
 */
export interface IAutoMovieAttachAction extends IAutoMovieActionBase {
  /** Selects an attachment as the action family. */
  verb: "attachTo";

  /** Staged, rigged scene node that owns the attachment bone; not the actor. */
  parent: string;

  /** Semantic bone on the parent's skeleton to which the actor is attached. */
  bone: AutoMovieHumanoidBone;
}
