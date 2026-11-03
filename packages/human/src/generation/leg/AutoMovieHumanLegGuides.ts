import type { AutoMovieHumanPolarSector } from "../../lofting/AutoMovieHumanPolarSector";
import { AutoMovieHumanLegGuideAnterior } from "./AutoMovieHumanLegGuideAnterior";
import { AutoMovieHumanLegGuideAnterolateral } from "./AutoMovieHumanLegGuideAnterolateral";
import { AutoMovieHumanLegGuideAnteromedial } from "./AutoMovieHumanLegGuideAnteromedial";
import { AutoMovieHumanLegGuideLateral } from "./AutoMovieHumanLegGuideLateral";
import { AutoMovieHumanLegGuideMedial } from "./AutoMovieHumanLegGuideMedial";
import { AutoMovieHumanLegGuidePosterior } from "./AutoMovieHumanLegGuidePosterior";
import { AutoMovieHumanLegGuidePosterolateral } from "./AutoMovieHumanLegGuidePosterolateral";
import { AutoMovieHumanLegGuidePosteromedial } from "./AutoMovieHumanLegGuidePosteromedial";
import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import type { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";
import { AutoMovieHumanLegShankExtensorMass } from "./AutoMovieHumanLegShankExtensorMass";
import { AutoMovieHumanLegShankGastrocnemiusLateral } from "./AutoMovieHumanLegShankGastrocnemiusLateral";
import { AutoMovieHumanLegShankGastrocnemiusMedial } from "./AutoMovieHumanLegShankGastrocnemiusMedial";
import { AutoMovieHumanLegShankMedialBorder } from "./AutoMovieHumanLegShankMedialBorder";
import { AutoMovieHumanLegShankPeroneals } from "./AutoMovieHumanLegShankPeroneals";
import { AutoMovieHumanLegShankSoleusMedial } from "./AutoMovieHumanLegShankSoleusMedial";
import { AutoMovieHumanLegShankTibialFace } from "./AutoMovieHumanLegShankTibialFace";
import { AutoMovieHumanLegShankTibialisAnterior } from "./AutoMovieHumanLegShankTibialisAnterior";
import { AutoMovieHumanLegThighAdductorLongus } from "./AutoMovieHumanLegThighAdductorLongus";
import { AutoMovieHumanLegThighBicepsFemoris } from "./AutoMovieHumanLegThighBicepsFemoris";
import { AutoMovieHumanLegThighGracilisMagnus } from "./AutoMovieHumanLegThighGracilisMagnus";
import { AutoMovieHumanLegThighHamstringMedial } from "./AutoMovieHumanLegThighHamstringMedial";
import { AutoMovieHumanLegThighIliotibialBand } from "./AutoMovieHumanLegThighIliotibialBand";
import { AutoMovieHumanLegThighQuadricepsAnterior } from "./AutoMovieHumanLegThighQuadricepsAnterior";
import { AutoMovieHumanLegThighVastusLateralis } from "./AutoMovieHumanLegThighVastusLateralis";
import { AutoMovieHumanLegThighVastusMedialis } from "./AutoMovieHumanLegThighVastusMedialis";

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
    guides: AutoMovieHumanPolarSector.IGuide[];

    /** One fullness per guide: sector `j` follows guide `j`. */
    fullness: number[];
  }

  /** Section angles of the guides, radians. */
  export const ANGLES: readonly number[] = [
    AutoMovieHumanLegGuideAnterior.ANGLE,
    AutoMovieHumanLegGuideAnterolateral.ANGLE,
    AutoMovieHumanLegGuideLateral.ANGLE,
    AutoMovieHumanLegGuidePosterolateral.ANGLE,
    AutoMovieHumanLegGuidePosterior.ANGLE,
    AutoMovieHumanLegGuidePosteromedial.ANGLE,
    AutoMovieHumanLegGuideMedial.ANGLE,
    AutoMovieHumanLegGuideAnteromedial.ANGLE,
  ];

  /** The thigh's and the shank's rows of each sector, by index. */
  const SECTORS: readonly (readonly [readonly AutoMovieHumanLegProfile.IRow[], readonly AutoMovieHumanLegProfile.IRow[]])[] = [
    [AutoMovieHumanLegThighQuadricepsAnterior.ROWS, AutoMovieHumanLegShankTibialisAnterior.ROWS],
    [AutoMovieHumanLegThighVastusLateralis.ROWS, AutoMovieHumanLegShankExtensorMass.ROWS],
    [AutoMovieHumanLegThighIliotibialBand.ROWS, AutoMovieHumanLegShankPeroneals.ROWS],
    [AutoMovieHumanLegThighBicepsFemoris.ROWS, AutoMovieHumanLegShankGastrocnemiusLateral.ROWS],
    [AutoMovieHumanLegThighHamstringMedial.ROWS, AutoMovieHumanLegShankGastrocnemiusMedial.ROWS],
    [AutoMovieHumanLegThighGracilisMagnus.ROWS, AutoMovieHumanLegShankSoleusMedial.ROWS],
    [AutoMovieHumanLegThighAdductorLongus.ROWS, AutoMovieHumanLegShankMedialBorder.ROWS],
    [AutoMovieHumanLegThighVastusMedialis.ROWS, AutoMovieHumanLegShankTibialFace.ROWS],
  ];

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
        const g: AutoMovieHumanPolarSector.IGuide = e.shape.guides[j]!;
        return { at: e.at, values: [g.value, g.slope, g.curvature] };
      };
      return { bottom: row(ends.bottom), top: row(ends.top) };
    };
    const sectorEnds: (j: number) => AutoMovieHumanLegProfile.IEnds = (j: number): AutoMovieHumanLegProfile.IEnds => {
      const row: (e: IEnd | undefined) => AutoMovieHumanLegProfile.IEnd | undefined = (e: IEnd | undefined): AutoMovieHumanLegProfile.IEnd | undefined =>
        e === undefined ? undefined : { at: e.at, values: [e.shape.fullness[j]!] };
      return { bottom: row(ends.bottom), top: row(ends.top) };
    };
    const guides: ((s: number) => AutoMovieHumanPolarSector.IGuide)[] = [
      AutoMovieHumanLegGuideAnterior.profile(bones, guideEnds(0)),
      AutoMovieHumanLegGuideAnterolateral.profile(bones, guideEnds(1)),
      AutoMovieHumanLegGuideLateral.profile(bones, guideEnds(2)),
      AutoMovieHumanLegGuidePosterolateral.profile(bones, guideEnds(3)),
      AutoMovieHumanLegGuidePosterior.profile(bones, guideEnds(4)),
      AutoMovieHumanLegGuidePosteromedial.profile(bones, guideEnds(5)),
      AutoMovieHumanLegGuideMedial.profile(bones, guideEnds(6)),
      AutoMovieHumanLegGuideAnteromedial.profile(bones, guideEnds(7)),
    ];
    const fullness: AutoMovieHumanLegProfile.Channel[] = SECTORS.map(
      (
        [thigh, shank]: readonly [readonly AutoMovieHumanLegProfile.IRow[], readonly AutoMovieHumanLegProfile.IRow[]],
        j: number,
      ): AutoMovieHumanLegProfile.Channel => AutoMovieHumanLegProfile.channel([...shank, ...thigh], bones, 0, sectorEnds(j)),
    );
    return (s: number): IShape => ({
      guides: guides.map((g: (s: number) => AutoMovieHumanPolarSector.IGuide): AutoMovieHumanPolarSector.IGuide => g(s)),
      fullness: fullness.map((f: AutoMovieHumanLegProfile.Channel): number => f(s)),
    });
  }
}
