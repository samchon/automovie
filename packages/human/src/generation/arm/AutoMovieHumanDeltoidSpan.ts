import type { IAutoMovieHumanArmPiece } from "./IAutoMovieHumanArmPiece";
import type { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";
import { AutoMovieHumanArmRows } from "./AutoMovieHumanArmRows";

/**
 * The deltoid span: the upper arm from the arm's first own section, below the
 * trunk's scye ring, to the deltoid insertion.
 *
 * Gray 1918 puts the deltoid's insertion, the deltoid tuberosity, at the middle
 * of the lateral humerus. This legacy span instead uses an acromion-to-elbow
 * midpoint projection; neither that convention nor the active half-AR proxy
 * independently locates olecranon or a measured deltoid insertion.
 * The span owns two observed rows, at 0.3 and at the insertion, where the
 * reference sections first stand free of the trunk on all four references
 * (nearer the root, m1's and m2's sections still merge with the chest). Above
 * the first row the section is held, so the root strip's last section is this
 * span's first row, not an invented shape; the deltoid's three heads and the
 * deltoid-pectoral groove are to be read where a reference section is free of
 * the trunk, which this sampling does not give.
 *
 * Rows are the medians of f1, f2, m1 and m2, read on each reference's skin
 * square to its own humerus (the centroid line of its upper arm sections), with
 * the guides' angle derivatives by least squares over +-12 degrees about their
 * angle; the sector model leaves 0.2 to 0.8 % of the radius unexplained. The
 * row at 0.45 of the humerus stands for the insertion row (the insertion is at
 * 0.4388 of it for a hanging arm, 0.011 of the humerus or 3 mm away).
 */
export namespace AutoMovieHumanDeltoidSpan {
  /** Share of the humerus' joint-centre length where the span's first observed row stands. */
  export const ROOT: number = 0.3;

  /**
   * Upper arm girth at {@link ROOT} over the biceps girth: fitted, the median
   * of the four references (spread 0.034).
   */
  export const ROOT_GIRTH: number = 1.026;

  /**
   * Walk length of the insertion: midway between the acromion, which stands
   * the actual downward projection above the shoulder centre, and the elbow
   * centre. This retained proxy is distinct from the active half-AR site.
   *
   * @param inputs The fixed inputs.
   */
  export function insertion(inputs: IAutoMovieHumanArmPiece.IInputs): number {
    const bones: AutoMovieHumanArmBones.IBones = inputs.bones;
    const distance: number = (bones.humerus - bones.acromionProjection) / 2;

    return inputs.axis.upper(distance);
  }

  /**
   * The row and girth knot at the insertion, which this span owns and the
   * upper-arm compartments copy.
   *
   * @param inputs The fixed inputs.
   */
  export function end(inputs: IAutoMovieHumanArmPiece.IInputs): { row: IAutoMovieHumanArmPiece.IRow; knot: [number, number] } {
    const s: number = insertion(inputs);

    return { row: AutoMovieHumanArmRows.row("u0.45", s), knot: [s, inputs.tapes.bicep] };
  }

  /**
   * Build the span from the fixed inputs alone.
   *
   * @param inputs The fixed inputs.
   */
  export function piece(inputs: IAutoMovieHumanArmPiece.IInputs): IAutoMovieHumanArmPiece {
    const first: number = inputs.axis.upper(ROOT * inputs.bones.humerus);
    const last: { row: IAutoMovieHumanArmPiece.IRow; knot: [number, number] } = end(inputs);

    return {
      name: "deltoid",
      from: "first own section",
      to: "deltoid insertion",
      walk: [first, last.row.s],
      rows: [AutoMovieHumanArmRows.row("u0.3", first), last.row],
      knots: [[first, ROOT_GIRTH * inputs.tapes.bicep], last.knot],
    };
  }
}
