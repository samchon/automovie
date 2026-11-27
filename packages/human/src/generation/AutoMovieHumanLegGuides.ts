import type {
  IAutoMovieHumanLegGuides,
  IAutoMovieHumanLegProfile,
  IAutoMovieHumanLegSectionRows,
  IAutoMovieHumanLegStations,
  IAutoMoviePolarSector,
} from "@automovie/interface";

import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import { AutoMovieHumanLegSectionRows } from "./AutoMovieHumanLegSectionRows";

/**
 * The leg's eight guides and eight sectors composed: at any station the guides'
 * jets (radius, tangent and curvature in the section angle) and the sectors'
 * fullness, each carried along the whole leg from the thigh's and the shank's
 * landmark rows by the natural cubic spline, so a section's guide or sector
 * crosses the knee without a seam of its own.
 *
 * The guides stand at 0, 45, ..., 315 degrees; sector `j` follows guide `j`.
 */
export namespace AutoMovieHumanLegGuides {
  /** Section angles of the guides, radians. */
  export const ANGLES: readonly number[] =
    AutoMovieHumanLegSectionRows.GUIDES.map(
      (g: IAutoMovieHumanLegSectionRows.IGuide): number => g.angle,
    );

  /**
   * The section's guides and fullness along the leg.
   *
   * @param bones The joints' heights, which place the landmark rows.
   * @param ends The neighbours' rings, each the first or last row of every
   *   guide and sector.
   * @returns The shape at a station, in units of the section's girth over 2 pi.
   */
  export function shape(
    bones: IAutoMovieHumanLegStations.IBones,
    ends: IAutoMovieHumanLegGuides.IEnds = {},
  ): IAutoMovieHumanLegGuides.ShapeResult {
    function guideEnds(j: number): IAutoMovieHumanLegProfile.IEnds {
      function row(
        e: IAutoMovieHumanLegGuides.IEnd | undefined,
      ): IAutoMovieHumanLegProfile.IEnd | undefined {
        if (e === undefined) return undefined;
        const g: IAutoMoviePolarSector.IGuide = e.shape.guides[j]!;
        return { at: e.at, values: [g.value, g.slope, g.curvature] };
      }
      return { bottom: row(ends.bottom), top: row(ends.top) };
    }
    function sectorEnds(j: number): IAutoMovieHumanLegProfile.IEnds {
      function row(
        e: IAutoMovieHumanLegGuides.IEnd | undefined,
      ): IAutoMovieHumanLegProfile.IEnd | undefined {
        return e === undefined
          ? undefined
          : { at: e.at, values: [e.shape.fullness[j]!] };
      }
      return { bottom: row(ends.bottom), top: row(ends.top) };
    }
    const guides: ((s: number) => IAutoMoviePolarSector.IGuide)[] =
      AutoMovieHumanLegSectionRows.GUIDES.map(
        (
          g: IAutoMovieHumanLegSectionRows.IGuide,
          j: number,
        ): ((s: number) => IAutoMoviePolarSector.IGuide) =>
          profile(g, bones, guideEnds(j)),
      );
    const fullness: IAutoMovieHumanLegProfile.Channel[] =
      AutoMovieHumanLegSectionRows.SECTORS.map(
        (
          sector: IAutoMovieHumanLegSectionRows.ISector,
          j: number,
        ): IAutoMovieHumanLegProfile.Channel =>
          AutoMovieHumanLegProfile.channel(
            [...sector.shankRows, ...sector.thighRows],
            bones,
            0,
            sectorEnds(j),
          ),
      );
    return (s: number): IAutoMovieHumanLegGuides.IShape => ({
      guides: guides.map(
        (
          g: (s: number) => IAutoMoviePolarSector.IGuide,
        ): IAutoMoviePolarSector.IGuide => g(s),
      ),
      fullness: fullness.map((f: IAutoMovieHumanLegProfile.Channel): number =>
        f(s),
      ),
    });
  }

  /*
   * A guide along the leg: its three channels, each carried between its
   * landmark rows by the natural cubic spline (C2).
   * Parameter guide: The guide.
   * Parameter bones: The joints' heights, which place the rows.
   * Parameter ends: The neighbours' rings as the first and last rows, `[rho,
   * rho_theta, rho_thetatheta]` each.
   * Returns: The guide at a station: its angle, radius and the two angle
   * derivatives.
   */
  function profile(
    guide: IAutoMovieHumanLegSectionRows.IGuide,
    bones: IAutoMovieHumanLegStations.IBones,
    ends: IAutoMovieHumanLegProfile.IEnds,
  ): (s: number) => IAutoMoviePolarSector.IGuide {
    const value: IAutoMovieHumanLegProfile.Channel =
      AutoMovieHumanLegProfile.channel(guide.rows, bones, 0, ends);
    const slope: IAutoMovieHumanLegProfile.Channel =
      AutoMovieHumanLegProfile.channel(guide.rows, bones, 1, ends);
    const curvature: IAutoMovieHumanLegProfile.Channel =
      AutoMovieHumanLegProfile.channel(guide.rows, bones, 2, ends);

    return (s: number): IAutoMoviePolarSector.IGuide => ({
      angle: guide.angle,
      value: value(s),
      slope: slope(s),
      curvature: curvature(s),
    });
  }
}
