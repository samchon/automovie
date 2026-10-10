/**
 * One driving side of a combination corrective: a channel, which of its two
 * endpoints the corrective answers for, and the optional in-between tent over
 * that driver's weight (`IAutoMovieHumanFaceBasis.correctives`).
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
   * above it, when the peak is under one, it falls linearly to zero at
   * `between[1]`, so an in-between corrective is absent from the full
   * pose it was not solved for.
   */
  peak?: number;

  /**
   * The driver weights on either side of the peak at which this input
   * fades to nothing, `[below, above]` with `below < peak <= above`;
   * omitted is `[0, 1]`. Two in-betweens on one driver whose tents both
   * span the whole envelope fire into each other's poses, and a tongue
   * solved at three quarters was measured to re-cross at a half that had
   * been clear; naming the neighbouring peaks as the span is what makes
   * each in-between whole at its own weight and absent at its neighbours'.
   */
  between?: [number, number];
}
