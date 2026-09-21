import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * The deterministic answer to one authored building-support claim.
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Reports resting, floating, sunk, off-support, legitimate suspension, or unresolved placement without claiming capacity or safety.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Carries the classified gap, unresolved side, and measurement basis required by the support output contract.
 * @author Samchon
 */
export interface IAutoMovieBuiltSupportResult {
  /** The classified relationship between the subject and its named support. */
  status:
    | "resting"
    | "floating"
    | "sunk"
    | "not-over-support"
    | "suspended"
    | "unresolved";

  /**
   * Signed underside gap in metres for a resolved bearing relation, or null
   * when no bearing sample exists, the relation is suspended, or either side
   * is unresolved.
   */
  gap: number | null;

  /** Unresolved inputs, empty for every conclusive result. */
  unresolved: ("subject" | "support")[];

  /** Subject measurement basis, or null when its bounds cannot be resolved. */
  subjectBasis: AutoMovieBuiltPlacementBasis | null;

  /** Support measurement basis, or null when its face cannot be resolved. */
  supportBasis: AutoMovieBuiltPlacementBasis | null;
}
