import type { IAutoMovieHumanArmPiece } from "./IAutoMovieHumanArmPiece";
import { AutoMovieHumanArmRows } from "./AutoMovieHumanArmRows";
import { AutoMovieHumanElbowSpan } from "./AutoMovieHumanElbowSpan";

/**
 * The forearm's belly: the span from the elbow's distal edge to the
 * musculotendinous junction, the forearm's flexor and extensor masses.
 *
 * In the bind the forearm stands thumb forward, so the forward guide runs on
 * the radial border (the brachioradialis ridge), the lateral guide on the
 * extensor mass, the back guide on the subcutaneous ulnar border (a nearly flat
 * sector, its guides carrying near-zero curvature) and the medial guide on the
 * flexor mass. The girth rises once from the elbow to the belly, where the
 * forearm tape's relaxed maximum below the elbow is read (ISO 8559-1), then
 * falls once through the junction, steepest between 0.4 and 0.6 of the forearm.
 *
 * Read on f1, f2, m1 and m2 square to their own forearm (the centroid line of
 * their sections), as shares of the elbow centre to stylion, stylion taken at
 * each reference's least girth before the hand: the belly at 0.215 (45 to 63 mm
 * below the elbow on f1, m1 and m2; f2's is flat from the elbow), and the
 * girth's share of the way from the wrist tape up to the belly 0.872 at 0.4 and
 * 0.521 at 0.6. Rows are the medians. The span copies the distal-edge row from
 * the elbow span and owns the junction row, at 0.6, for the wrist span to copy.
 */
export namespace AutoMovieHumanForearmBelly {
  /** The belly, share of the elbow centre to stylion: fitted, median 0.215, spread 0.16. */
  export const BELLY: number = 0.215;

  /** The junction row, share of the elbow centre to stylion: where the girth's steep fall ends (0.6). */
  export const JUNCTION: number = 0.6;

  /** Girth at 0.4, share of the way from the wrist tape to the forearm tape: fitted, median 0.872, spread 0.11. */
  export const FALL_FORTY: number = 0.872;

  /** Girth at the junction, same basis: fitted, median 0.521, spread 0.18. */
  export const FALL_JUNCTION: number = 0.521;

  /**
   * The row and girth knot at the junction, which this span owns and the wrist
   * span copies.
   *
   * @param inputs The fixed inputs.
   */
  export function end(inputs: IAutoMovieHumanArmPiece.IInputs): { row: IAutoMovieHumanArmPiece.IRow; knot: [number, number] } {
    const s: number = inputs.axis.fore(JUNCTION * inputs.stylion);
    const { forearm, wrist } = inputs.tapes;

    return { row: AutoMovieHumanArmRows.row("f0.6", s), knot: [s, wrist + FALL_JUNCTION * (forearm - wrist)] };
  }

  /**
   * Build the span from the fixed inputs alone.
   *
   * @param inputs The fixed inputs.
   */
  export function piece(inputs: IAutoMovieHumanArmPiece.IInputs): IAutoMovieHumanArmPiece {
    const near: { row: IAutoMovieHumanArmPiece.IRow; knot: [number, number] } = AutoMovieHumanElbowSpan.end(inputs);
    const far: { row: IAutoMovieHumanArmPiece.IRow; knot: [number, number] } = end(inputs);
    const { forearm, wrist } = inputs.tapes;
    const at = (share: number): number => inputs.axis.fore(share * inputs.stylion);

    return {
      name: "forearm-belly",
      from: "elbow distal edge",
      to: "musculotendinous junction",
      walk: [near.row.s, far.row.s],
      rows: [
        near.row,
        AutoMovieHumanArmRows.row("f0.22", at(BELLY)),
        AutoMovieHumanArmRows.row("f0.4", at(0.4)),
        far.row,
      ],
      knots: [near.knot, [at(BELLY), forearm], [at(0.4), wrist + FALL_FORTY * (forearm - wrist)], far.knot],
    };
  }
}
