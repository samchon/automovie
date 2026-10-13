import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * A persistent coupling of one staged node to a bone of another, such as a
 * rider on a horse's `spine` or a passenger in a cart, declared once in staging
 * (`IAutoMovieStageActor.attach`) rather than re-attached in every shot.
 *
 * `stageScene` refuses a node riding itself and a parent that is not a placed
 * actor. In each performed shot, `coupleObjects` refuses a parent without a
 * rig or without the bone, then bakes the rider's follow clip over the whole
 * shot through `compileAttach`: the rider's origin and rotation sit exactly on
 * the posed bone frame, with no seat offset. An `attachTo` action for the same
 * rider replaces the mount for that shot. The binding is recorded in the beat
 * end state, and the next beat resumes from it in place of the authored
 * `attach`. A mount emits no grab or release events.
 *
 * @evidence contracts/common.md#principled-implementation The rider's world transform is the parent's placement composed with the bone's forward-kinematics frame at each sample, the behaviour of a fixed joint, using the same baker as `attachTo`.
 * @evidence contracts/common.md#clear-and-simple-design A parent id and a semantic bone are the whole binding; the rider is the staged actor that declares it, so the same record serves staging, the shot coupling and the beat-end state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No seat offset or per-mount correction is applied, so a rider whose origin is not its seat shows the mismatch, and a rig-less parent or absent bone is refused rather than coupled to the parent's root.
 * @evidence contracts/common.md#meaningful-documentation States where it is declared, every refusal and its owner, how and over what span the rider is baked, the `attachTo` override, how it carries to the next beat, and the absent events; members name the parent and bone requirements.
 * @author Samchon
 */
export interface IAutoMovieMountBinding {
  /** Placed actor node that carries the rider; a rigged node, not the rider itself. */
  parent: string;

  /** Bone on the parent's skeleton the rider is fixed to, such as a horse's `spine`. */
  bone: AutoMovieHumanoidBone;
}
