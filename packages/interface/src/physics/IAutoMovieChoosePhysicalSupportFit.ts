import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/**
 * Candidate ranking by metre residual admission, then joint-angle continuity.
 * The selected Fit is returned by identity, retaining any caller-specific fields.
 *
 * @evidence contracts/development/design.md#principled-representation Generic candidates carry the same pose/residual contract while preserving richer result fields; admissible fits rank by squared geodesic rotation distance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only target poses and residuals constrain Fit; joint/reference inputs supply continuity without duplicating a full planner result.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Empty candidates throw; if none meet tolerance the least-error candidate is returned without claiming success, and equal scores retain input order.
 * @evidence contracts/development/common.md#meaningful-documentation Residual units, optional reference meaning, borrowed inputs and identity-preserving selection are explicit.
 */
export namespace IAutoMovieChoosePhysicalSupportFit {
  /**
   * Choose one bounded support fit among candidates fitted from different seeds.
   *
   * A warm seed keeps temporal continuity but can trap the bounded fit in a
   * poor local solution that it then carries into every later replan; an
   * authored seed restarts from the declared posture each time. Candidates are
   * ranked by the fit's own contract: a fit whose largest residual meets the
   * declared tolerance is admissible. Among admissible fits the one closest to
   * the completed reference, summed squared joint rotation angle, wins, so an
   * equally valid solution never jumps. Without an admissible fit the smallest
   * residual wins. Ties keep the earlier candidate, so callers list the
   * authored-seed fit first.
   */
  export type IInput<
    Fit extends {
      /** Candidate world bone poses, borrowed and returned with the selected candidate. */
      targets: Readonly<Record<string, IAutoMoviePhysicalProfile.ITransform>>;
      /** Per-goal nonnegative metre errors; empty means zero maximum error. */
      residuals: Readonly<Record<string, number>>;
    },
  > = {
    /** Nonempty candidates in tie-break order. */ candidates: readonly Fit[];
    /** The fit's own metre residual tolerance. */ tolerance: number;
    /** Completed fitted placements at the replan boundary, if any. */ reference?: Readonly<
      Record<string, IAutoMoviePhysicalProfile.ITransform>
    >;
    /** Joints whose rotations measure continuity. */ joints: readonly IAutoMoviePhysicalProfile.IJoint[];
  };
}
