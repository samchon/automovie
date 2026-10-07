/**
 * Extraction-authored non-humeral axis signs; null keeps an axis immobile under its existing constraint.
 *
 * @evidence contracts/common.md#principled-implementation Carries flexion's positive sign and independently nullable abduction/twist signs, preserving the extraction-authored non-humeral sign convention.
 * @evidence contracts/common.md#clear-and-simple-design This named record owns only the extraction-authored non-humeral sign convention; computations remain at the existing consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Flexion remains literal +1; abduction and twist retain independent +1/-1 signs or null immobility, rather than converting null to an available axis.
 * @evidence contracts/common.md#meaningful-documentation Native field documentation names the retained members, their ownership and unchanged source meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source and consuming builder own the represented parts; this record transports their existing registration/evaluation.
 * @evidence contracts/modeling.md#parameter-channels The source signs preserve the meaning of named flexion, abduction and external rotation consumed by pose resolution, with null retaining an unavailable axis.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing geometry/appearance consumer owns emitted populations.
 * @evidence contracts/modeling.md#spatial-conventions Signs are dimensionless orientations of the source joint axes; flexion is positive, abduction outward and twist external in the declared joint frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source and assembly owners retain actual boundary construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming source/assembly owner observes the result.
 * @evidence contracts/anatomy.md#anatomical-source Extraction-authored signs encode rig orientation and unavailable axes; the source joint owns their convention and they establish no measured clinical range.
 * @evidence contracts/anatomy.md#permitted-range The closed +1/-1/null values preserve axis availability; the owning joint and pose resolver enforce unavailable axes and motion bounds.
 * @evidence contracts/anatomy.md#parametric-authority The source signs preserve the meaning of named flexion, abduction and external rotation consumed by pose resolution, with null retaining an unavailable axis.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyJointSigns {
  /** Existing flexion orientation is positive by construction. */
  flexion: 1;

  /** Existing outward abduction sign, or null for an immobile axis. */
  abduction: 1 | -1 | null;

  /** Existing external-rotation sign, or null for an immobile axis. */
  twist: 1 | -1 | null;
}
