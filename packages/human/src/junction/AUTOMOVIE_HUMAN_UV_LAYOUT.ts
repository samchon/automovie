import { AutoMovieHumanPart } from "./AutoMovieHumanPart";
import { AutoMovieHumanSide } from "./AutoMovieHumanSide";
import { IAutoMovieHumanSurfaceCoordinate } from "./IAutoMovieHumanSurfaceCoordinate";

/**
 * The published UV layout of the human profile's skin, version 1.
 *
 * Every part instance owns one rectangle of the unit atlas, and a face corner's UV is a fixed function of its semantic address: `x` runs across the rectangle with `v`, starting at the chart's seam meridian, and `y` runs up it with `u`. UVs therefore never depend on vertex indices or on the identity, so one texture authored for this layout fits every person. Rectangles share one texel density, about 1.8 m of skin per atlas width, sized from the rounded girths and lengths of the generator's median 30-year-old adult; an identity of other proportions stretches its charts instead of changing the layout. The rectangles leave gaps of at least 0.01 for mip filtering.
 *
 * Seams are where the layout cuts the surface. Each junction ring is a chart boundary, and each chart's wrap seam lies on a low-visibility meridian, where Lévy et al. (2002, ACM TOG 21(3):362-371, "Least squares conformal maps") place cuts so texture discontinuity does not show: the posterior midline of the trunk, neck and head, under the hair and along the spinal furrow; the medial side of each arm, hand and leg, against the body; the back of the heel and the sole of each foot; and behind each ear.
 *
 * A change to any rectangle or seam breaks textures authored against the layout, so it bumps `version`.
 */
export const AUTOMOVIE_HUMAN_UV_LAYOUT: AutoMovieHumanUvLayout.ILayout = {
  version: 1,
  charts: [
    chart("trunk", null, 0.5, [0.0, 0.0, 0.556, 0.5]),
    chart("leg", "left", 0.25, [0.57, 0.0, 0.25, 0.303]),
    chart("leg", "right", 0.75, [0.57, 0.32, 0.25, 0.303]),
    chart("arm", "left", 0.25, [0.832, 0.0, 0.167, 0.239]),
    chart("arm", "right", 0.75, [0.832, 0.25, 0.167, 0.239]),
    chart("head", null, 0.5, [0.0, 0.52, 0.317, 0.167]),
    chart("neck", null, 0.5, [0.33, 0.52, 0.222, 0.056]),
    chart("ear", "left", 0.75, [0.33, 0.59, 0.083, 0.033]),
    chart("ear", "right", 0.25, [0.425, 0.59, 0.083, 0.033]),
    chart("hand", "left", 0.25, [0.0, 0.7, 0.111, 0.106]),
    chart("hand", "right", 0.75, [0.12, 0.7, 0.111, 0.106]),
    chart("foot", "left", 0.5, [0.24, 0.7, 0.139, 0.167]),
    chart("foot", "right", 0.5, [0.39, 0.7, 0.139, 0.167]),
  ],
};
export namespace AutoMovieHumanUvLayout {
  /**
   * A versioned UV layout.
   *
   * @author Samchon
   */
  export interface ILayout {
    /** Layout version; a change to any chart bumps it. */
    version: 1;

    /** One chart per part instance. */
    charts: IChart[];
  }

  /**
   * One part instance's rectangle in the atlas.
   *
   * @author Samchon
   */
  export interface IChart {
    /** The part. */
    part: AutoMovieHumanPart;

    /** Its side, or null for the trunk, neck and head. */
    side: AutoMovieHumanSide | null;

    /** Chart `v` of the wrap seam, where `x` starts and ends. */
    seam: number;

    /** Left edge, atlas units. */
    x: number;

    /** Bottom edge, atlas units. */
    y: number;

    /** Width, spanned by one turn of `v`. */
    width: number;

    /** Height, spanned by `u` from 0 to 1. */
    height: number;
  }

  /**
   * UVs of one face's corners.
   *
   * The corners' turns past the seam are unwrapped together, so a face that touches the seam from below writes the chart's right edge there and a face that leaves it upward writes the left edge; the seam is cut exactly along its meridian.
   *
   * @param coordinates The face's corner addresses, all on one part's chart
   * @returns `[x, y]` of each corner
   * @throws {Error} When the layout has no chart for the part instance
   */
  export function map(
    coordinates: readonly IAutoMovieHumanSurfaceCoordinate[],
  ): Array<[number, number]> {
    const first: IAutoMovieHumanSurfaceCoordinate = coordinates[0]!;
    const found: IChart | undefined = AUTOMOVIE_HUMAN_UV_LAYOUT.charts.find(
      (c: IChart): boolean => c.part === first.part && c.side === first.side,
    );
    if (found === undefined)
      throw new Error(
        `UV layout has no chart for ${first.side ?? ""} ${first.part}`.trim(),
      );
    const turns: number[] = coordinates.map(
      (c: IAutoMovieHumanSurfaceCoordinate): number =>
        (((c.v - found.seam) % 1) + 1) % 1,
    );
    const wrap: boolean = Math.max(...turns) - Math.min(...turns) > 0.5;
    return coordinates.map(
      (c: IAutoMovieHumanSurfaceCoordinate, k: number): [number, number] => {
        const t: number = wrap && turns[k]! < 0.5 ? turns[k]! + 1 : turns[k]!;
        return [found.x + found.width * t, found.y + found.height * c.u];
      },
    );
  }
}

function chart(
  part: AutoMovieHumanPart,
  side: AutoMovieHumanSide | null,
  seam: number,
  [x, y, width, height]: [number, number, number, number],
): AutoMovieHumanUvLayout.IChart {
  return { part, side, seam, x, y, width, height };
}
