import { AUTOMOVIE_HUMAN_UV_LAYOUT } from "./AUTOMOVIE_HUMAN_UV_LAYOUT";
import { AutoMovieHumanBranch } from "./AutoMovieHumanBranch";
import { AutoMovieHumanPart } from "./AutoMovieHumanPart";
import { AutoMovieHumanSide } from "./AutoMovieHumanSide";
import { IAutoMovieHumanSurfaceCoordinate } from "./IAutoMovieHumanSurfaceCoordinate";

/**
 * Types of the published skin UV layout, {@link AUTOMOVIE_HUMAN_UV_LAYOUT}, and the mapping from a face's corner addresses to their UVs in it.
 */
export namespace AutoMovieHumanUvLayout {
  /**
   * A versioned UV layout.
   *
   * @author Samchon
   */
  export interface ILayout {
    /** Layout version; a change to any chart bumps it. */
    version: 2;

    /** One chart per part instance and per branch of one. */
    charts: IChart[];
  }

  /**
   * One part instance's, or one branch's, rectangle in the atlas.
   *
   * @author Samchon
   */
  export interface IChart {
    /** The part. */
    part: AutoMovieHumanPart;

    /** Its side, or null for the trunk, neck and head. */
    side: AutoMovieHumanSide | null;

    /** The branch this chart holds, or null for the part's main chart. */
    branch: AutoMovieHumanBranch | null;

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
   * @param coordinates The face's corner addresses, all on one chart
   * @returns `[x, y]` of each corner
   * @throws {Error} When the layout has no chart for the part instance
   */
  export function map(
    coordinates: readonly IAutoMovieHumanSurfaceCoordinate[],
  ): Array<[number, number]> {
    const first: IAutoMovieHumanSurfaceCoordinate = coordinates[0]!;
    const found: IChart | undefined = AUTOMOVIE_HUMAN_UV_LAYOUT.charts.find(
      (c: IChart): boolean =>
        c.part === first.part &&
        c.side === first.side &&
        c.branch === (first.branch ?? null),
    );
    if (found === undefined)
      throw new Error(
        `UV layout has no chart for ${first.side ?? ""} ${first.part} ${first.branch ?? ""}`
          .replace(/\s+/g, " ")
          .trim(),
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
