import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * The deterministic answer to one authored building-support claim.
 *
 * @evidence contracts/common.md#principled-implementation Status follows the signed gap from `propSupportGap`, the minimum of underside height minus support height over footprint and face-corner probes: no probe gives `not-over-support`, within tolerance `resting`, above it `floating`, below it `sunk`.
 * @evidence contracts/common.md#clear-and-simple-design Status, gap, unresolved sides and both bases come back together so a `floating` verdict can be read against an origin-point basis without a second query.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Relief between probe points is not sampled, so a support rising between them is answered only where the probes stand; an unresolved side short-circuits to `unresolved` with no gap rather than a guessed one.
 * @evidence contracts/common.md#meaningful-documentation States each status condition, the gap sign and its null cases, the meaning of the unresolved list, and what a null basis means.
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
