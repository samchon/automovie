import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * The deterministic answer to one authored building-support claim.
 *
 * @author Samchon
 */
export interface IAutoMovieBuiltSupportResult {
  /**
   * The classified relationship between the subject and its named support.
   *
   * `resting` when the gap is within the tolerance, `floating` above it,
   * `sunk` below it, `not-over-support` when no probe of the subject lies over
   * the support face, `suspended` for a resolved suspension claim, and
   * `unresolved` when either side has no extent.
   */
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
   * is unresolved. Positive means the underside stands above the support face
   * and negative that it sinks into it; the deepest probe answers.
   */
  gap: number | null;

  /** Unresolved inputs, empty for every conclusive result. */
  unresolved: ("subject" | "support")[];

  /** Subject measurement basis, or null when its bounds cannot be resolved. */
  subjectBasis: AutoMovieBuiltPlacementBasis | null;

  /** Support measurement basis, or null when its face cannot be resolved. */
  supportBasis: AutoMovieBuiltPlacementBasis | null;
}
