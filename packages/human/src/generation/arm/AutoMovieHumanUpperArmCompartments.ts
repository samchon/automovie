import type { IAutoMovieHumanArmPiece } from "./IAutoMovieHumanArmPiece";
import { AutoMovieHumanArmRows } from "./AutoMovieHumanArmRows";
import { AutoMovieHumanDeltoidSpan } from "./AutoMovieHumanDeltoidSpan";

/**
 * The upper arm's compartments: the span from the deltoid insertion to the
 * supracondylar least girth above the elbow.
 *
 * The four guides run on the compartments' boundaries: forward on the biceps
 * crest, lateral on the lateral intermuscular septum, back on the triceps and
 * medial on the medial septum with the neurovascular course; the sectors
 * between them are the anterior compartment (biceps and brachialis) split in
 * two, and the posterior compartment (triceps) split in two. The span only
 * falls in girth from the insertion to the supracondylar ridge: in a relaxed arm
 * the biceps belly is a sector's shape, not a girth maximum (Gray 1918).
 *
 * Rows are medians of f1, f2, m1 and m2, read on each reference's skin square
 * to its own humerus, at 0.6 and 0.75 of the humerus' joint-centre length and at
 * the supracondylar least girth. The span copies the insertion row from the
 * deltoid span, which owns it, and owns the supracondylar row for the elbow
 * span to copy.
 */
export namespace AutoMovieHumanUpperArmCompartments {
  /**
   * The supracondylar least girth's distance above the elbow centre as a share
   * of the humerus: fitted, the median of the four references (16.6 mm, spread
   * 8.2 mm).
   */
  export const SUPRACONDYLAR: number = 0.0625;

  /** Girth at the supracondylar ridge over the elbow girth: fitted, median 1.011, spread 0.025. */
  export const SUPRACONDYLAR_GIRTH: number = 1.011;

  /** Station of the girth's middle knot, share of the humerus. */
  export const LOWER: number = 0.7;

  /**
   * Girth at {@link LOWER} as a share of the way from the supracondylar girth up
   * to the biceps girth: fitted, median 0.58, spread 0.21.
   */
  export const LOWER_GIRTH: number = 0.58;

  /**
   * The row and girth knot at the supracondylar ridge, which this span owns and
   * the elbow span copies.
   *
   * @param inputs The fixed inputs.
   */
  export function end(inputs: IAutoMovieHumanArmPiece.IInputs): { row: IAutoMovieHumanArmPiece.IRow; knot: [number, number] } {
    const s: number = inputs.axis.upper((1 - SUPRACONDYLAR) * inputs.bones.humerus);

    return { row: AutoMovieHumanArmRows.row("ridge", s), knot: [s, SUPRACONDYLAR_GIRTH * inputs.tapes.elbow] };
  }

  /**
   * Build the span from the fixed inputs alone.
   *
   * @param inputs The fixed inputs.
   */
  export function piece(inputs: IAutoMovieHumanArmPiece.IInputs): IAutoMovieHumanArmPiece {
    const humerus: number = inputs.bones.humerus;
    const near: { row: IAutoMovieHumanArmPiece.IRow; knot: [number, number] } = AutoMovieHumanDeltoidSpan.end(inputs);
    const far: { row: IAutoMovieHumanArmPiece.IRow; knot: [number, number] } = end(inputs);
    const ridge: number = far.knot[1];

    return {
      name: "upper-arm-compartments",
      from: "deltoid insertion",
      to: "supracondylar ridge",
      walk: [near.row.s, far.row.s],
      rows: [
        near.row,
        AutoMovieHumanArmRows.row("u0.6", inputs.axis.upper(0.6 * humerus)),
        AutoMovieHumanArmRows.row("u0.75", inputs.axis.upper(0.75 * humerus)),
        far.row,
      ],
      knots: [
        near.knot,
        // Between the biceps girth and the ridge's, one monotone fall.
        [inputs.axis.upper(LOWER * humerus), ridge + LOWER_GIRTH * (inputs.tapes.bicep - ridge)],
        far.knot,
      ],
    };
  }
}
