/**
 * Extraction-authored non-humeral axis signs; null keeps an axis immobile under its existing constraint.
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
