/**
 * The source joint's three rest coordinates in degrees; the rig owner retains axes, frame and clinical qualification.
 *
 * @evidence contracts/common.md#principled-implementation Carries the three source-rest degree coordinates, preserving the original joint rest-angle record.
 * @evidence contracts/common.md#clear-and-simple-design This named record owns only the original joint rest-angle record; computations remain at the existing consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The three separate source rest angles remain degrees; rest coordinates do not become measured motion capacity.
 * @evidence contracts/common.md#meaningful-documentation Native field documentation names the retained members, their ownership and unchanged source meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source and consuming builder own the represented parts; this record transports their existing registration/evaluation.
 * @evidence contracts/modeling.md#parameter-channels Source neutral coordinates preserve the existing named motion axes and the authored document pose remains distinct from its rest reference.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing geometry/appearance consumer owns emitted populations.
 * @evidence contracts/modeling.md#spatial-conventions Flexion, abduction and twist are degrees on the source joint axes in the rest rig; no radians conversion occurs in this record.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source and assembly owners retain actual boundary construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming source/assembly owner observes the result.
 * @evidence contracts/anatomy.md#anatomical-source These are source-rig rest coordinates, not measured clinical neutral or personal capacity; the basis joint retains extraction and registration qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source/document admission remains authoritative; this carrier changes no value or bound.
 * @evidence contracts/anatomy.md#parametric-authority Source neutral coordinates preserve the existing named motion axes and the authored document pose remains distinct from its rest reference.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyJointNeutral {
  /** Source rest flexion degrees. */
  flexion: number;

  /** Source rest abduction degrees. */
  abduction: number;

  /** Source rest axial-rotation degrees. */
  twist: number;
}
