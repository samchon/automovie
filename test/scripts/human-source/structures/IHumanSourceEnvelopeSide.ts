/**
 * One extended side of a body channel the envelope producer writes a
 * corrective for, with the published receipt's readings kept for comparison.
 *
 * @author Samchon
 */
export interface IHumanSourceEnvelopeSide {
  /** Corrective id and target. */
  id: string;

  /** Body channel. */
  channel: string;

  /** Extended side. */
  side: "positive" | "negative";

  /** Weight (magnitude) where the corrective reaches full activation. */
  end: number;

  /** The published receipt's detail fraction, a comparison reading only. */
  receiptDetailFraction: number;

  /** The published receipt's largest removal at the end, millimetres, a comparison reading only. */
  receiptWorstRemovedAtEndMillimetres: number;
}
