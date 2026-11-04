import type { IAutoMovieHumanArmPiece } from "./IAutoMovieHumanArmPiece";
import { AutoMovieHumanArmRows } from "./AutoMovieHumanArmRows";
import { AutoMovieHumanUpperArmCompartments } from "./AutoMovieHumanUpperArmCompartments";

/**
 * The elbow span: from the supracondylar ridge above the joint, over the elbow
 * centre, to the elbow's distal edge a tenth of the way down the forearm.
 *
 * The span holds the joint's three bulges and its one hollow: the olecranon
 * behind, the medial epicondyle (the more prominent) and the lateral epicondyle
 * with the radial head's dimple below it at the sides, and the cubital fossa in
 * front (Gray 1918). Their sector shapes are the span's rows read in the plane
 * that bisects the corner, which is the walk's own section at the elbow centre.
 * The span owns the elbow tape, taken over the olecranon (ISO 8559-1, 3.1.10)
 * at that section; the reference skins carry no prominence measurable beyond
 * the rows, so no relief window is added until a published soft-tissue height
 * is read.
 *
 * Rows are medians of f1, f2, m1 and m2 (see `AutoMovieHumanUpperArmCompartments`
 * for the reading). The span copies the supracondylar row from the compartments
 * and owns the distal-edge row for the forearm belly to copy.
 */
export namespace AutoMovieHumanElbowSpan {
  /** The distal edge, share of the elbow centre to stylion: conventional, a tenth. */
  export const EDGE: number = 0.1;

  /**
   * The row and girth knot at the distal edge, which this span owns and the
   * forearm belly copies. A forearm thinner than the elbow is as full as its
   * belly to the belly, and a thicker one rises from the elbow there, so the
   * girth at the edge is the lesser of the two tapes (the references' edge
   * girth is 0.999 to 1.02 of it).
   *
   * @param inputs The fixed inputs.
   */
  export function end(inputs: IAutoMovieHumanArmPiece.IInputs): { row: IAutoMovieHumanArmPiece.IRow; knot: [number, number] } {
    const s: number = inputs.axis.fore(EDGE * inputs.stylion);

    return { row: AutoMovieHumanArmRows.row("f0.1", s), knot: [s, Math.min(inputs.tapes.elbow, inputs.tapes.forearm)] };
  }

  /**
   * Build the span from the fixed inputs alone.
   *
   * @param inputs The fixed inputs.
   */
  export function piece(inputs: IAutoMovieHumanArmPiece.IInputs): IAutoMovieHumanArmPiece {
    const near: { row: IAutoMovieHumanArmPiece.IRow; knot: [number, number] } = AutoMovieHumanUpperArmCompartments.end(inputs);
    const far: { row: IAutoMovieHumanArmPiece.IRow; knot: [number, number] } = end(inputs);

    return {
      name: "elbow",
      from: "supracondylar ridge",
      to: "elbow distal edge",
      walk: [near.row.s, far.row.s],
      rows: [near.row, AutoMovieHumanArmRows.row("elbow", inputs.axis.elbow), far.row],
      knots: [near.knot, [inputs.axis.elbow, inputs.tapes.elbow], far.knot],
    };
  }
}
