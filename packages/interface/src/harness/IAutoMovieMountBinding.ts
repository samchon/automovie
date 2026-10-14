import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * A persistent coupling of one staged node to a bone of another, such as a
 * rider on a horse's `spine` or a passenger in a cart, declared once in staging
 * (`IAutoMovieStageActor.attach`) rather than re-attached in every shot.
 *
 * `stageScene` refuses self-riding and a parent that is not a placed actor. `coupleObjects` refuses a missing parent rig or bone and coupling cycles, orders parents before riders, and uses `compileAttach` to bake the full shot at 30 Hz by default. At each key the rider's origin and rotation follow the posed bone without a seat offset; interpolated keys approximate nonlinear motion. Parent scale is omitted under staging's unit-scale actor premise, and matching clinical axes/rest frames are required to agree with the displayed skeleton. An explicit `attachTo` for the rider replaces its mount for the shot. The binding carries into the next beat's staging and emits no grab or release events.
 *
 * @evidence contracts/common.md#principled-implementation The baker composes parent translation/rotation with the sampled FK bone frame, using a previously baked parent path for chained couplings. It shares `attachTo`'s sampled fixed-joint model, safe advancing interval-count guard and caller-owned feasible memory/distinct-key-time premises; it does not solve continuous rigid-body contact or apply parent scale.
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
