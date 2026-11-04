import type { IAutoMovieHumanArmPiece } from "./IAutoMovieHumanArmPiece";
import { AutoMovieHumanArmRows } from "./AutoMovieHumanArmRows";
import { AutoMovieHumanForearmBelly } from "./AutoMovieHumanForearmBelly";

/**
 * The wrist span: from the musculotendinous junction to the wrist crease, where
 * the hand's heel takes over.
 *
 * Past the junction the forearm becomes tendon: the girth falls to the wrist
 * tape, which is read over the radial styloid (ISO 8559-1) at stylion, and the
 * section flattens into the wrist's oval, wide across the radius and ulna and
 * about half as thick (the forward guide's radius 1.44 of the mean against
 * 0.58 to 0.74 at the other three). Rows are medians of f1, f2, m1 and m2 at 0.8
 * and 0.95 of the elbow centre to stylion, read square to each reference's own
 * forearm; the sector model leaves 0.5 % of the radius unexplained there. The
 * girth's share of the way from the wrist tape up to the forearm tape is 0.201
 * at 0.8 (spread 0.06). The span copies the junction row from the forearm belly;
 * the crease layer at its distal end belongs to the hand, which publishes its
 * jet, so the span holds the last row to the crease.
 */
export namespace AutoMovieHumanWristSpan {
  /** Girth at 0.8, share of the way from the wrist tape to the forearm tape: fitted, median 0.201, spread 0.06. */
  export const FALL_EIGHTY: number = 0.201;

  /**
   * The row and girth knot at the wrist crease, which this span owns and the
   * hand's heel copies: the heel takes the crease layer's section, its four
   * guides' radius jets at knots 0, 40, 80 and 120 of the arm's 160 control
   * points (forward: the radial border at the styloid, lateral: the dorsum,
   * back: the ulnar border, medial: the palmar side) and the wrist tape over
   * stylion, and builds the skin of the heel, from the crease to the thumb's
   * branch, on them. The heel and the crease layer's jet are the hand's;
   * this span only publishes where its tube ends.
   *
   * @param inputs The fixed inputs.
   */
  export function end(inputs: IAutoMovieHumanArmPiece.IInputs): { row: IAutoMovieHumanArmPiece.IRow; knot: [number, number] } {
    const s: number = inputs.axis.fore(inputs.stylion);

    return { row: AutoMovieHumanArmRows.row("f0.95", s), knot: [s, inputs.tapes.wrist] };
  }

  /**
   * Build the span from the fixed inputs alone.
   *
   * @param inputs The fixed inputs.
   */
  export function piece(inputs: IAutoMovieHumanArmPiece.IInputs): IAutoMovieHumanArmPiece {
    const near: { row: IAutoMovieHumanArmPiece.IRow; knot: [number, number] } = AutoMovieHumanForearmBelly.end(inputs);
    const far: { row: IAutoMovieHumanArmPiece.IRow; knot: [number, number] } = end(inputs);
    const { forearm, wrist } = inputs.tapes;
    const eighty: number = inputs.axis.fore(0.8 * inputs.stylion);
    const flat: number = inputs.axis.fore(0.95 * inputs.stylion);

    return {
      name: "wrist",
      from: "musculotendinous junction",
      to: "wrist crease",
      walk: [near.row.s, far.row.s],
      rows: [near.row, AutoMovieHumanArmRows.row("f0.8", eighty), AutoMovieHumanArmRows.row("f0.95", flat), far.row],
      knots: [near.knot, [eighty, wrist + FALL_EIGHTY * (forearm - wrist)], far.knot],
    };
  }
}
