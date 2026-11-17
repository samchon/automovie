import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMoviePhysicalJoint } from "./IAutoMoviePhysicalJoint";

/**
 * Candidate ranking by metre residual admission, then joint-angle continuity.
 * The selected Fit is returned by identity, retaining any caller-specific fields.
 *
 * @evidence contracts/development/design.md#principled-representation Generic candidates carry the same pose/residual contract while preserving richer result fields; admissible fits rank by squared geodesic rotation distance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface choosePhysicalSupportFit returns one original candidate, so its generic preserves fields consumed by the caller instead of copying a parallel result shape.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Empty candidates throw; if none meet tolerance the least-error candidate is returned without claiming success, and equal scores retain input order.
 * @evidence contracts/development/common.md#meaningful-documentation States candidate ordering, residual admission, reference continuity and earlier-candidate tie handling.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States candidate ordering, residual admission, reference continuity and earlier-candidate tie handling.
   * @evidence contracts/development/design.md#principled-representation Fit retains the candidate's complete subtype while requiring world transforms and metre residuals; tolerance and nonempty candidates are runtime premises.
   * @evidence contracts/development/design.md#minimal-and-owned-surface choosePhysicalSupportFit returns one original candidate, so its generic preserves fields consumed by the caller instead of copying a parallel result shape.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Without an admissible candidate the lowest residual remains visible; an absent completed reference cannot establish temporal continuity.
   */
  export type IInput<
    Fit extends {
      /** Candidate world bone poses, borrowed and returned with the selected candidate. */
      targets: Readonly<Record<string, IAutoMovieRigidTransform>>;
      /** Per-goal nonnegative metre errors; empty means zero maximum error. */
      residuals: Readonly<Record<string, number>>;
    },
  > = {
    /** Nonempty candidates in tie-break order. */ candidates: readonly Fit[];
    /** The fit's own metre residual tolerance. */ tolerance: number;
    /** Completed fitted placements at the replan boundary, if any. */ reference?: Readonly<
      Record<string, IAutoMovieRigidTransform>
    >;
    /** Joints whose rotations measure continuity. */ joints: readonly IAutoMoviePhysicalJoint[];
  };
}
