/**
 * Extraction-authored non-humeral axis signs; null keeps an axis immobile under its existing constraint.
 *
 * @evidence contracts/common.md#principled-implementation Literal positive or negative signs map source axes to declared clinical directions; null denotes an immobile constrained axis.
 * @evidence contracts/common.md#clear-and-simple-design The sign record is separate from neutral angles and range admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An immobile axis remains explicit rather than receiving a fabricated sign.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish constructed positive flexion from optional abduction and twist signs.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The joint sign contract has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The joint sign contract schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The joint sign contract declaration allocates no runtime state or handles.
 *
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
