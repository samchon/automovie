import { AutoMovieViewOutline } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanFootFrame,
  IAutoMovieHumanFootHost,
  IAutoMovieHumanFootPart,
  IAutoMovieHumanReferenceOutlineTypes,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanFootPlaces } from "../AutoMovieHumanFootPlaces";
import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import { AutoMovieHumanReferenceOutlines } from "../AutoMovieHumanReferenceOutlines";
import { AutoMovieHumanTrunkRows } from "../AutoMovieHumanTrunkRows";

/**
 * Pure local foot input, floor placement and original station/support plans.
 * These retained aggregate laws precede control preparation, breadth closure
 * and explicit part publication. Both unit and final transverse families
 * consume this same plan without constructing a parent part or loft.
 */
export namespace AutoMovieHumanFootHost {
  /**
   * Construct the same source family at one across scale; public breadth
   * belongs to the group, not this bare host.
   */
  export function create(
    name: "left" | "right",
    d: IAutoMovieHumanFootFrame.IDimensions,
    frame: IAutoMovieHumanFootHost.IFrame,
    plan: IAutoMovieHumanFootHost.IPlan,
    support: IAutoMovieHumanFootHost.ITransverse,
    transverse: number,
  ): IAutoMovieHumanFootPart.IInput {
    const L: number = d.length;
    const T: typeof AutoMovieHumanReferenceOutlines =
      AutoMovieHumanReferenceOutlines;
    function read(column: string, share: number): number {
      return (
        T.at(T.FOOT, column, share) *
        (column === "lateral" || column === "medial" ? transverse : L)
      );
    }

    // Keep each named measurement and every distinct outline-table row.
    const kept: [string, number][] = plan.named;
    const height: number =
      Math.min(
        ...kept.map(([, s]: [string, number]): number => read("dorsum", s)),
      ) / 2;

    // Each site's box about the axis, its sides in the law's order (up,
    // lateral, down, medial).
    const sites: { site: string; law: IAutoMovieHumanFootPart.ISiteLaw }[] =
      kept.map(
        ([site, s]: [string, number]): {
          site: string;
          law: IAutoMovieHumanFootPart.ISiteLaw;
        } => ({
          site,
          law: {
            share: s,
            edges: [
              read("dorsum", s) - height,
              read("lateral", s),
              -height,
              -read("medial", s),
            ],
            fullness: { shoulder: Math.SQRT2 - 1 },
            plantarJet: { first: 0, second: 0 },
          },
        }),
      );

    // A standing central sole is planar between its contact sites. Shared

    // zero jets express that plane; the closed scalar range includes both

    // heel/forefoot caps without altering a computed loft or skin point.
    return {
      name: `foot.${name}`,
      heel: frame.heel,
      along: frame.along,
      height,
      length: L,
      poles: [0, plan.end],
      sites,
      plantarRange: { minimum: -height, maximum: 0 },
      metatarsal: {
        span: [plan.fifth * L, plan.first * L],
        breadth: d.breadth,
        supports: {
          lateral: support.lateral * transverse,
          medial: support.medial * transverse,
        },
        transverseScale: transverse,
      },
      side: name,
      order: 128,
      gap: AutoMovieHumanTrunkRows.MAX_GAP,
    };
  }

  /**
   * The foot's frame: the axis turned out by its yaw, the heel behind the ankle
   * centre by the ankle's place along the foot (`AutoMovieHumanFootPlaces`).
   *
   * @param name The side.
   * @param d The foot's dimensions, calibration mm.
   * @param ankle The ankle centre.
   * @param scale Calibration millimetres per world millimetre.
   * @returns The frame.
   */
  export function place(
    name: "left" | "right",
    d: IAutoMovieHumanFootFrame.IDimensions,
    ankle: AutoMovieVector3Tuple,
    scale: number,
  ): IAutoMovieHumanFootHost.IFrame {
    const sign: number = name === "left" ? 1 : -1;
    const yaw: number = (AutoMovieHumanFootPlaces.YAW * Math.PI) / 180;
    const along: AutoMovieVector3Tuple = [
      Math.cos(yaw),
      0,
      sign * Math.sin(yaw),
    ];
    const back: number =
      AutoMovieHumanFootPlaces.ankle(d.length / scale) * scale;
    const heel: AutoMovieVector3Tuple = [
      ankle[0] - along[0] * back,
      0,
      ankle[2] - along[2] * back,
    ];
    return {
      heel,
      along,
      lateral: [-sign * along[2], 0, sign * along[0]],
      back,
    };
  }

  /**
   * Brannock horizontal breadth is the distance between across support planes
   * at the metatarsal heads, not one cut or their oblique chord (ANSUR II
   * handbook pp.83/84/112/113). The first head's public length and the retained
   * cascade convention bound the head region. The complete retained host uses
   * the same named knots and two-pole parameter as the foot builder. These
   * independent, dimensionless host supports transfer head-u before the
   * complete group's one common scale is solved. They are not themselves the
   * target public breadth. No section or skin is read.
   */
  export function acrossSupport(
    d: IAutoMovieHumanFootFrame.IDimensions,
    plan: IAutoMovieHumanFootHost.IPlan,
  ): IAutoMovieHumanFootHost.ITransverse {
    const T: typeof AutoMovieHumanReferenceOutlines =
      AutoMovieHumanReferenceOutlines;
    function supportOf(column: string): number {
      const knots: IAutoMovieViewPart.IKnot[] = [
        { site: "bottom pole", station: 0, value: 0 },
        ...plan.named.map(
          ([site, share]: [string, number]): IAutoMovieViewPart.IKnot => ({
            site,
            station: share * d.length,
            value: T.at(T.FOOT, column, share),
          }),
        ),
        { site: "top pole", station: plan.end * d.length, value: 0 },
      ];
      const source:
        | IAutoMovieViewOutline.IOutline
        | IAutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
        { knots },
        { bottom: 0, top: plan.end * d.length },
      );
      if ("detail" in source)
        throw new Error(`The foot's ${column} source failed: ${source.detail}`);
      const from: number = plan.fifth * d.length;
      const to: number = plan.first * d.length;
      const stations: number[] = [
        from,
        to,
        ...AutoMovieViewOutline.criticalStations(source).filter(
          (station: number): boolean => station > from && station < to,
        ),
      ];
      return Math.max(
        ...stations.map((station: number): number => {
          const value: number | string = AutoMovieViewOutline.value(
            source,
            station,
          );
          if (typeof value === "string")
            throw new Error(
              `The foot's ${column} source support failed: ${value}`,
            );
          return value;
        }),
      );
    }
    const lateral: number = supportOf("lateral");
    const medial: number = supportOf("medial");
    const support: number = lateral + medial;
    if (!(support > 0))
      throw new Error(
        "The foot's metatarsal source supports must span positive breadth",
      );
    return { lateral, medial };
  }

  /**
   * Preserve every anatomical/table station once, so inserting the public ball
   * or instep cannot make normalization use a different source spline.
   */
  export function sourcePlan(
    d: IAutoMovieHumanFootFrame.IDimensions,
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
    back: number,
  ): IAutoMovieHumanFootHost.IPlan {
    const L: number = d.length;
    const first: number = (measures.ballOfFootLength * scale) / L;
    const longest: number = Math.max(
      ...AutoMovieHumanFootPlaces.TOES.map(
        (tip: { tip: number }): number => tip.tip,
      ),
    );
    const shortest: number = Math.min(
      ...AutoMovieHumanFootPlaces.TOES.map(
        (tip: { tip: number }): number => tip.tip / longest,
      ),
    );
    const end: number = Math.max(
      (first + shortest) / 2,
      first + AutoMovieHumanTrunkRows.MAX_GAP / L,
    );
    const named: [string, number][] = [
      ["heel", back / L / 2],
      ["ankle", back / L],
      ["instep", (measures.instepLength * scale) / L],
      ["ball", first],
      ...AutoMovieHumanReferenceOutlines.FOOT.rows
        .filter(
          (row: IAutoMovieHumanReferenceOutlineTypes.IRow): boolean =>
            row.share > 0 && row.share < end,
        )
        .map(
          (
            row: IAutoMovieHumanReferenceOutlineTypes.IRow,
          ): [string, number] => [`outline ${row.share}`, row.share],
        ),
    ];
    named.sort(
      (a: [string, number], b: [string, number]): number => a[1] - b[1],
    );
    const kept: [string, number][] = named.filter(
      (row: [string, number], index: number): boolean =>
        index === 0 || row[1] !== named[index - 1]![1],
    );
    const cascade: readonly number[] = AutoMovieHumanFootPrior.PRIOR.cascade;
    const fifth: number =
      first +
      (cascade[0]! -
        cascade
          .slice(1)
          .reduce((sum: number, value: number): number => sum + value, 0)) /
        AutoMovieHumanFootPrior.CASCADE_FOOT;
    return { named: kept, end, first, fifth };
  }
}
