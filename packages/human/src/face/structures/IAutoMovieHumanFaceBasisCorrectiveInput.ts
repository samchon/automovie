/**
 * One driving side of a combination corrective: a channel, which of its two
 * endpoints the corrective answers for, and the optional in-between tent over
 * that driver's weight (`IAutoMovieHumanFaceBasis.correctives`).
 *
 * @evidence contracts/common.md#principled-implementation A declared channel side and optional peak/span define the admitted clamped piecewise-linear activation factor. Omitted peak/span retain one and [0,1]; an upper span equal to the peak has no falling branch and retains factor one above that peak.
 * @evidence contracts/common.md#clear-and-simple-design One driver owns its sign and local in-between support rather than embedding a separate corrective geometry record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent side cannot silently contribute zero, a zero peak cannot authorize division, and broad overlapping tents are not guaranteed to preserve clear intermediate poses.
 * @evidence contracts/common.md#meaningful-documentation Members state defaults, dimensionless driver weights, lower < peak <= upper ordering and the equal-upper case that retains full activation above the peak.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type computes no tent factor or corrective activation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Driver support identity defines no cached activation or repeated evaluation coordination.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record contains channel/side and scalar support only, acquiring no endpoints or solver resource.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisCorrectiveInput {
  /** The driving channel's id. */
  channel: string;

  /** Which endpoint of that channel this corrective answers for. */
  side: "positive" | "negative";

  /**
   * The driver weight this input is fully present at, in (0,1]; omitted
   * is 1. Below it the factor rises linearly from zero at `between[0]`;
   * above it, when `between[1]` exceeds the peak, it falls linearly to zero
   * at that upper bound. If the upper bound equals the peak, the evaluator
   * instead retains factor one above the peak. Use an upper bound greater
   * than the peak for an in-between that fades out of the full pose.
   */
  peak?: number;

  /**
   * The lower zero and upper support bound, `[below, above]` with
   * `below < peak <= above`; an upper bound equal to peak disables falling.
   * Omitted is `[0, 1]`. Two in-betweens on one driver whose tents both
   * span the whole envelope fire into each other's poses, and a tongue
   * solved at three quarters was measured to re-cross at a half that had
   * been clear; naming the neighbouring peaks as the span is what makes
   * each in-between whole at its own weight and absent at its neighbours'
   * when the upper bound exceeds the peak.
   */
  between?: [number, number];
}
