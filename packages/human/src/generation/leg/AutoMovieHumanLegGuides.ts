import type { AutoMoviePolarSector } from "@automovie/engine";
import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import { AutoMovieHumanLegSectionRows } from "./AutoMovieHumanLegSectionRows";
import type { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The leg's eight guides and eight sectors composed: at any station the
 * guides' jets (radius, tangent and curvature in the section angle) and the
 * sectors' fullness, each carried along the whole leg from the thigh's and the
 * shank's landmark rows by the natural cubic spline, so a section's guide or
 * sector crosses the knee without a seam of its own.
 *
 * The guides stand at 0, 45, ..., 315 degrees; sector `j` follows guide `j`.
 */
export namespace AutoMovieHumanLegGuides {
  /** The guides and the sectors of a section at one station. */
  export interface IShape {
    /** The eight guides by increasing angle. */
    guides: AutoMoviePolarSector.IGuide[];

    /** One fullness per guide: sector `j` follows guide `j`. */
    fullness: number[];
  }

  /** Section angles of the guides, radians. */
  export const ANGLES: readonly number[] = AutoMovieHumanLegSectionRows.GUIDES.map((g: AutoMovieHumanLegSectionRows.IGuide): number => g.angle);

  /** A neighbour's ring read as the shape's row at its own station. */
  export interface IEnd {
    /** Station of the ring, mm. */
    at: number;

    /** The ring's guides and fullness, in units of its girth over 2 pi. */
    shape: IShape;
  }

  /** The rings the shape ends on. */
  export interface IEnds {
    /** The foot's ankle ring. */
    bottom?: IEnd;

    /** The trunk's crotch ring. */
    top?: IEnd;
  }

  /**
   * The section's guides and fullness along the leg.
   *
   * @param bones The joints' heights, which place the landmark rows.
   * @param ends The neighbours' rings, each the first or last row of every guide and sector.
   * @returns The shape at a station, in units of the section's girth over 2 pi.
   */
  export function shape(bones: AutoMovieHumanLegStations.IBones, ends: IEnds = {}): (s: number) => IShape {
    const guideEnds: (j: number) => AutoMovieHumanLegProfile.IEnds = (j: number): AutoMovieHumanLegProfile.IEnds => {
      const row: (e: IEnd | undefined) => AutoMovieHumanLegProfile.IEnd | undefined = (e: IEnd | undefined): AutoMovieHumanLegProfile.IEnd | undefined => {
        if (e === undefined) return undefined;
        const g: AutoMoviePolarSector.IGuide = e.shape.guides[j]!;
        return { at: e.at, values: [g.value, g.slope, g.curvature] };
      };
      return { bottom: row(ends.bottom), top: row(ends.top) };
    };
    const sectorEnds: (j: number) => AutoMovieHumanLegProfile.IEnds = (j: number): AutoMovieHumanLegProfile.IEnds => {
      const row: (e: IEnd | undefined) => AutoMovieHumanLegProfile.IEnd | undefined = (e: IEnd | undefined): AutoMovieHumanLegProfile.IEnd | undefined =>
        e === undefined ? undefined : { at: e.at, values: [e.shape.fullness[j]!] };
      return { bottom: row(ends.bottom), top: row(ends.top) };
    };
    const guides: ((s: number) => AutoMoviePolarSector.IGuide)[] = AutoMovieHumanLegSectionRows.GUIDES.map(
      (g: AutoMovieHumanLegSectionRows.IGuide, j: number): ((s: number) => AutoMoviePolarSector.IGuide) => profile(g, bones, guideEnds(j)),
    );
    const fullness: AutoMovieHumanLegProfile.Channel[] = AutoMovieHumanLegSectionRows.SECTORS.map(
      (sector: AutoMovieHumanLegSectionRows.ISector, j: number): AutoMovieHumanLegProfile.Channel =>
        AutoMovieHumanLegProfile.channel([...sector.shankRows, ...sector.thighRows], bones, 0, sectorEnds(j)),
    );
    return (s: number): IShape => ({
      guides: guides.map((g: (s: number) => AutoMoviePolarSector.IGuide): AutoMoviePolarSector.IGuide => g(s)),
      fullness: fullness.map((f: AutoMovieHumanLegProfile.Channel): number => f(s)),
    });
  }

  /**
   * A guide along the leg: its three channels, each carried between its
   * landmark rows by the natural cubic spline (C2).
   *
   * @param guide The guide.
   * @param bones The joints' heights, which place the rows.
   * @param ends The neighbours' rings as the first and last rows, `[rho, rho_theta, rho_thetatheta]` each.
   * @returns The guide at a station: its angle, radius and the two angle derivatives.
   */
  function profile(
    guide: AutoMovieHumanLegSectionRows.IGuide,
    bones: AutoMovieHumanLegStations.IBones,
    ends: AutoMovieHumanLegProfile.IEnds,
  ): (s: number) => AutoMoviePolarSector.IGuide {
    const value: AutoMovieHumanLegProfile.Channel = AutoMovieHumanLegProfile.channel(guide.rows, bones, 0, ends);
    const slope: AutoMovieHumanLegProfile.Channel = AutoMovieHumanLegProfile.channel(guide.rows, bones, 1, ends);
    const curvature: AutoMovieHumanLegProfile.Channel = AutoMovieHumanLegProfile.channel(guide.rows, bones, 2, ends);

    return (s: number): AutoMoviePolarSector.IGuide => ({
      angle: guide.angle,
      value: value(s),
      slope: slope(s),
      curvature: curvature(s),
    });
  }
}
