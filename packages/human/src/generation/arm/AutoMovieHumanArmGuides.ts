import { AutoMovieNaturalSpline, type AutoMoviePolarSector } from "@automovie/engine";
import type { IAutoMovieHumanArmPiece } from "./IAutoMovieHumanArmPiece";
import type { AutoMovieHumanArmTube } from "./AutoMovieHumanArmTube";

/**
 * The arm's four guides and four sectors as functions of the walk: the spans'
 * rows laid end to end, each of the sixteen channels carried between them by
 * the natural cubic spline (the station rule, C2 along the walk).
 *
 * The guides stand at fixed section angles, forward, lateral, back and medial,
 * and each owns its radius and both angle derivatives along the whole arm; each
 * sector between two guides owns its fullness. A row a span copies from its
 * neighbour is the neighbour's, and is kept once. Past the first and last rows
 * the channels are held.
 */
export namespace AutoMovieHumanArmGuides {
  /** Section angles of the guides, radians: forward, lateral, back, medial. */
  export const ANGLES: readonly number[] = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

  /**
   * The normalised section at any walk length.
   *
   * @param pieces The spans, proximal to distal.
   */
  export function shape(pieces: readonly IAutoMovieHumanArmPiece[]): (s: number) => AutoMovieHumanArmTube.IShape {
    const rows: IAutoMovieHumanArmPiece.IRow[] = [];

    for (const piece of pieces)
      for (const row of piece.rows) {
        const last: IAutoMovieHumanArmPiece.IRow | undefined = rows[rows.length - 1];

        // The distal span's first row is the proximal span's last.
        if (last === undefined || row.s - last.s > MERGE) rows.push(row);
      }

    const xs: number[] = rows.map((r: IAutoMovieHumanArmPiece.IRow): number => r.s);
    const splines: AutoMovieNaturalSpline.ISpline[] = Array.from(
      { length: CHANNELS },
      (_: unknown, k: number): AutoMovieNaturalSpline.ISpline =>
        AutoMovieNaturalSpline.create(
          xs,
          rows.map((r: IAutoMovieHumanArmPiece.IRow): number => r.channels[k]!),
        ),
    );
    const lo: number = xs[0]!;
    const hi: number = xs[xs.length - 1]!;

    return (s: number): AutoMovieHumanArmTube.IShape => {
      const at: number = Math.min(hi, Math.max(lo, s));
      const v: number[] = splines.map((sp: AutoMovieNaturalSpline.ISpline): number => AutoMovieNaturalSpline.evaluate(sp, at));

      return {
        guides: ANGLES.map(
          (angle: number, j: number): AutoMoviePolarSector.IGuide => ({
            angle,
            value: v[3 * j]!,
            slope: v[3 * j + 1]!,
            curvature: v[3 * j + 2]!,
          }),
        ),
        fullness: [v[12]!, v[13]!, v[14]!, v[15]!],
      };
    };
  }
}

/** Channels of a row: four guides' three numbers and four sectors' one. */
const CHANNELS: number = 16;

/** Walk lengths closer than this are one row, mm: a copied boundary row is exact to rounding. */
const MERGE: number = 1e-6;
