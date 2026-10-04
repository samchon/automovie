/**
 * What the two partitions' own fields asked of the shared neck boundary on one
 * evaluation, in metres.
 *
 * `faceFieldMetres` is the largest displacement the face document's channels
 * give a boundary sample from its neutral. `bodyFieldMetres` is the largest
 * displacement the body document gives a boundary sample beyond the rigid
 * carry of the head joint: the body's own non-rigid change of the neck at the
 * cut. The one-skin evaluator sums both at the shared samples, so the
 * head-side ring next to the boundary takes the body value as a step and the
 * body-side ring takes the face value; these two numbers bound that step.
 *
 * @evidence contracts/common.md#principled-implementation Both are the actual per-partition displacements at the shared samples, measured on the evaluation that used them.
 * @evidence contracts/common.md#clear-and-simple-design Two maxima.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts They are readings, not thresholds; nothing refuses or is corrected from them.
 * @evidence contracts/common.md#meaningful-documentation States what each measures and why it bounds the step the boundary rings take.
 * @evidence contracts/modeling.md#shared-boundaries Reads the two partitions' disagreement at the registered boundary.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the shared rest frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reading defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reading is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reading emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation Rendering is observed separately.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The reading is not an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reading admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reading is an output.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBoundaryReading {
  /** Largest face-field displacement of a shared boundary sample, metres. */
  faceFieldMetres: number;

  /** Largest body-field displacement of a shared boundary sample beyond the head carry, metres. */
  bodyFieldMetres: number;
}
