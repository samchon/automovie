import type { IAutoMovieHumanArmAxis } from "./IAutoMovieHumanArmAxis";
import type { IAutoMovieHumanArmBones } from "./IAutoMovieHumanArmBones";

/**
 * One span of the arm between two named anatomical loci, built from fixed
 * inputs alone.
 *
 * A piece owns two channels over its interval of the walk: the girth the
 * section must measure (knots of a monotone curve, one per named site) and the
 * section's normalised shape (rows of the four guides' radius jets and the four
 * sectors' fullness, read by the polar sector rule). The arm is the pieces laid
 * proximal to distal; where two meet, the proximal piece owns the shared row
 * and girth knot and the distal piece copies them (rule J3, the station rule),
 * so no piece invents its side of a boundary.
 *
 * A piece reads only {@link IAutoMovieHumanArmPiece.IInputs}: the bones, the
 * walk on them and the four tapes. It reads no skin, no other person and no
 * other piece except the boundary row its neighbour owns, which it receives
 * from that neighbour's `end` function. So a piece can be built, checked and
 * looked at alone.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation One span of the arm between two named anatomical loci, built from fixed inputs alone.
 * @evidence contracts/development/design.md#principled-representation `name`: Name of the piece, for findings and part identities. `from`: Locus at the piece's proximal end. `to`: Locus at the piece's distal end.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmPieces.build, AutoMovieHumanDeltoidSpan.piece, AutoMovieHumanElbowSpan.piece. Read by AutoMovieHumanArmGirth.knots, AutoMovieHumanArmGuides.shape. Also types AutoMovieHumanArmLaw.pieces.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `from`, `to`, `walk`, `rows`, `knots`; callers supply the complete record.
 */
export interface IAutoMovieHumanArmPiece {
  /** Name of the piece, for findings and part identities. */
  name: string;

  /** Locus at the piece's proximal end. */
  from: string;

  /** Locus at the piece's distal end. */
  to: string;

  /** Walk lengths of the proximal and distal ends, mm. */
  walk: [number, number];

  /** Section rows from the proximal end, the piece's shape channel. */
  rows: IAutoMovieHumanArmPiece.IRow[];

  /** Girth knots `[walk length, girth]` from the proximal end, mm, the piece's girth channel. */
  knots: [number, number][];
}

/** Type contracts exchanged by IAutoMovieHumanArmPiece; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanArmPiece {
  /** A landmark station of the shape channel.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A landmark station of the shape channel.
   * @evidence contracts/development/design.md#principled-representation `s`: Walk length of the landmark, mm. `channels`: Sixteen channels in units of the section's girth over 2 pi: the radius, its first and second derivative in the angle for the forward, lateral, back and medial guides in turn, then the fullness of the four sectors that follow those guides.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmRows.row, AutoMovieHumanDeltoidSpan.end, AutoMovieHumanElbowSpan.end. Also types AutoMovieHumanArmGuides.rows, AutoMovieHumanArmGuides.last.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `s`, `channels`; callers supply the complete record.
   */
  export interface IRow {
    /** Walk length of the landmark, mm. */
    s: number;

    /**
     * Sixteen channels in units of the section's girth over 2 pi: the radius,
     * its first and second derivative in the angle for the forward, lateral,
     * back and medial guides in turn, then the fullness of the four sectors
     * that follow those guides.
     */
    channels: readonly number[];
  }

  /** The four tapes the spans read, mm, each at its published site.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The four tapes the spans read, mm, each at its published site.
   * @evidence contracts/development/design.md#principled-representation `bicep`: Upper arm girth midway between acromion and olecranon. `elbow`: Elbow girth over the olecranon. `forearm`: Forearm girth at its relaxed maximum below the elbow.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanArmPieces.inputs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `bicep`, `elbow`, `forearm`, `wrist`; callers supply the complete record.
   */
  export interface ITapes {
    /** Upper arm girth midway between acromion and olecranon. */
    bicep: number;

    /** Elbow girth over the olecranon. */
    elbow: number;

    /** Forearm girth at its relaxed maximum below the elbow. */
    forearm: number;

    /** Wrist girth over stylion. */
    wrist: number;
  }

  /** What a piece is built from.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What a piece is built from.
   * @evidence contracts/development/design.md#principled-representation `bones`: The bones, left frame. `axis`: The walk on the bones. `tapes`: The tapes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmPieces.inputs. Read by AutoMovieHumanArmPieces.build, AutoMovieHumanDeltoidSpan.insertion, AutoMovieHumanDeltoidSpan.end. Also types AutoMovieHumanArmLaw.pieceInputs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `bones`, `axis`, `tapes`, `stylion`; callers supply the complete record.
   */
  export interface IInputs {
    /** The bones, left frame. */
    bones: IAutoMovieHumanArmBones.IBones;

    /** The walk on the bones. */
    axis: IAutoMovieHumanArmAxis.IAxis;

    /** The tapes. */
    tapes: ITapes;

    /** Elbow centre to stylion along the forearm, mm. */
    stylion: number;
  }

  /**
   * The size a bony prominence or a hollow is asked for. No published
   * soft-tissue height of the olecranon, the epicondyles, the styloids, the
   * cubital fossa or the flexor creases is read in this repository, so a
   * structure piece takes its size from its caller instead of holding an
   * invented one.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The size a bony prominence or a hollow is asked for.
   * @evidence contracts/development/design.md#principled-representation `height`: Height at the centre, mm; negative for a hollow. `reach`: Half width of the window along the walk, mm. `along`: Distance of the window's centre past its landmark along the walk, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanArmPiece.ISize belongs to IAutoMovieHumanArmPiece; its public declaration is reached by the Human main-entry export closure.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `height`, `reach`, `along`; callers supply the complete record.
   */
  export interface ISize {
    /** Height at the centre, mm; negative for a hollow. */
    height: number;

    /** Half width of the window along the walk, mm. */
    reach: number;

    /** Distance of the window's centre past its landmark along the walk, mm. */
    along: number;
  }
}
