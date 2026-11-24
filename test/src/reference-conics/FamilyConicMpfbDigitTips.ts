import {
  AutoMovieViewAxisJet as AxisJet,
  AutoMovieLoftViewFullSource as Full,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import {
  AutoMovieHumanConicSection as Conic,
  AutoMovieHumanTipDome as Dome,
  AutoMovieHumanConicLoft as Loft,
  AutoMovieHumanLoftStations as Stations,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanNail,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewPart,
  AutoMovieVector2Tuple as P2,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import { FamilyConicMpfbDigitTipObservation as Observation } from "./FamilyConicMpfbDigitTipObservation";
import { FamilyConicMpfbDigitTipShape as TipShape } from "./FamilyConicMpfbDigitTipShape";
import { FamilyConicMpfbDigitWalls as Walls } from "./FamilyConicMpfbDigitWalls";
import { FamilyConicMpfbDigits as Digits } from "./FamilyConicMpfbDigits";
import { FamilyConicMpfbFamilies as Families } from "./FamilyConicMpfbFamilies";
import type { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";
import { preserveFamilyConicDistalSection } from "./preserveFamilyConicDistalSection";

/** Independent caps on the measured distal HM08 contours. */
export namespace FamilyConicMpfbDigitTips {
  /** Exact source and original conic bounds on one physical plane, in mm. */
  export interface IExtent {
    station: number;
    stock: [number, number, number, number] | null;
    original: [number, number, number, number];
    candidate?: IExtent["original"];
    angular?: { touch: number[]; shoulder: number[] };
  }

  /** The source ownership and candidate for one unjoined distal cap. */
  export interface ICap {
    /** Preserved wall fields and one new distal cap declaration. */
    family: IAutoMovieHumanConicLoft.IFamily;
    /** Same original with the exact cap-axis continuation. */
    view: IAutoMovieViewPart;
    /** Distal articulation and transported anatomical dorsal direction. */
    frame: IAutoMovieHumanNail.IFrame;
    /** Exact source vertex, in mm, extreme in the terminal station direction. */
    pole: P3;
    /** Included source triangles on the owned distal side of the cut. */
    sourceIndices: number[];
    /** Optional earlier independent cut used for close wall comparisons. */
    profileSourceIndices?: number[];
    /** Root of the dome on the original wall's station chart, mm. */
    from: number;
    /** Pole on the original wall's station chart, mm. */
    tip: number;
    /** Whether the cap root was held inside the measured wall domain. */
    held: boolean;
    /** Maximum world error in mm at the admitted phase-independent pole. */
    endpointGap: number;
    /** Maximum position and station jet discrepancies at the protected ring. */
    protectedGap: [point: number, first: number, second: number];
    /** The measured field's continuity at its first unchanged distal datum. */
    distalDatumGap?: ICap["protectedGap"];
    /** Independent source support across the distal phalanx of a toe. */
    extents?: {
      joint: number;
      from: number;
      blendEnd: number;
      rows: IExtent[];
    };
  }

  /** Resolve all independent cuts against one prepared indexed skin. */
  export function prepare(
    source: Mpfb.IGeometry,
    reads: readonly Digits.IRead[],
    walls: readonly Walls.IWall[],
    toeSupport?: "observe" | "fit",
  ): (side: Digits.Side, name: string) => ICap {
    const cut: Families.Cut = Families.prepareCut(source);
    const select = Observation.distalComponent(source);
    return (side, name): ICap => {
      const read: Digits.IRead | undefined = reads.find(
        (row): boolean =>
          row.side === side && row.digits.some((d): boolean => d.name === name),
      );
      const digit: Digits.IDigit | undefined = read?.digits.find(
        (d): boolean => d.name === name,
      );
      if (read === undefined || digit === undefined)
        throw new Error(`Unknown HM08 digit ${side}.${name}`);
      const foreign: Families.Segment[] = read.digits.flatMap(
        (d): Families.Segment[] =>
          d === digit
            ? []
            : Digits.supportedSegments(
                source,
                d.joints,
                read.host.sections[0]!.frame,
              ),
      );
      const wall: Walls.IWall | undefined = walls.find(
        (row): boolean => row.side === side && row.name === name,
      );
      const family: IAutoMovieHumanConicLoft.IFamily =
        wall === undefined && name === "finger.thumb"
          ? thumb(digit, (frame): P2[] => cut(frame, foreign))
          : requireWall(wall);
      const axis: IAutoMovieViewAxis.IAxis = Loft.axis(family);
      const last: number = family.knots.at(-1)!;
      const lastFrame: IAutoMovieLoftSectionFrame = axis.at(last);
      const normal: P3 = Vec.cross(lastFrame.v, lastFrame.u);
      const outline: P2[] = cut(lastFrame, foreign);
      const actual = select(lastFrame, outline[0]!);
      const tip: number =
        last + Vec.dot(Vec.sub(actual.pole, lastFrame.origin), normal);
      const readFields = Loft.reader(family);
      const resolve = Conic.prepare(family.layout);
      const reach = (s: number): number => {
        const { input, guides } = resolve(readFields(Math.min(s, last)));
        return (
          guides.reduce(
            (sum, i): number => sum + Math.hypot(...input.points[i]!),
            0,
          ) / guides.length
        );
      };
      // The cap law reads two preceding one-millimetre sections. Keep them
      // inside the active wall and leave the protected first section intact.
      const least: number = Math.max(
        family.rootSectionMark ?? family.knots[0]!,
        family.knots[0]! + 2,
      );
      // ESTIMATE: the equal axial/reach dome follows circular end curvature
      // where no anatomical dome proportion is published for the stock digit.
      const start = Dome.start(reach, tip, 1, least);
      const from: number = Math.min(start.from, last);
      if (!(from >= least))
        throw new Error("Cap root lies outside the observed wall");
      const definition: IAutoMovieHumanConicLoft.IFamily = {
        ...family,
        name: `${side}.${name}`,
        tips: [null, { from, tip, own: true }],
      };
      const kept: { from: number; tip: number; pole: P3 } = {
        from,
        tip,
        pole: actual.pole,
      };
      const named: IAutoMovieHumanConicLoft.IFamily = {
        ...family,
        name: definition.name,
      };
      const baseline: IAutoMovieViewPart = close(named, family.knots, kept);
      const held: boolean = start.held || start.from > last;
      const extents =
        read.kind === "foot" && toeSupport !== undefined
          ? Observation.observeExtents(
              family,
              baseline,
              from,
              tip,
              held,
              (frame): P2[] => cut(frame, foreign),
            )
          : undefined;
      const view: IAutoMovieViewPart =
        extents === undefined || toeSupport !== "fit"
          ? baseline
          : close(named, family.knots, kept, extents);
      if (extents !== undefined && toeSupport === "fit") {
        const fitted = Observation.outlineBounds(view, tip);
        for (const row of extents.rows) row.candidate = fitted(row.station);
      }
      let profileSourceIndices: number[] | undefined;
      if (extents !== undefined) {
        try {
          // Retain a larger source component only when it still owns the
          // same exact pole in the terminal plane's physical direction.
          const earlier: IAutoMovieLoftSectionFrame = axis.at(extents.from);
          const profile = select(earlier, cut(earlier, foreign)[0]!, normal);
          if (Vec.norm(Vec.sub(profile.pole, actual.pole)) === 0)
            profileSourceIndices = profile.indices;
        } catch {
          // A partially shared earlier loop cannot own the isolated preview.
        }
      }
      const proximal: P3 = digit.centres.at(-2)!;
      const distal: P3 = Vec.unit(Vec.sub(digit.centres.at(-1)!, proximal))!;
      const dorsal: P3 = lastFrame.u as P3;
      const candidate = Full.create(view);
      const ordinary = Full.create(Loft.part(family, family.knots, false));
      const protectedStation: number =
        family.rootSectionMark ?? family.knots[0]!;
      const phases: number[] = Array.from(
        { length: 8 },
        (_, i): number => (Math.PI * i) / 4,
      );
      const endpointGap: number = Math.max(
        ...phases.map((phase): number =>
          Math.hypot(...Vec.sub(candidate.point(tip, phase), actual.pole)),
        ),
      );
      const protectedGap: ICap["protectedGap"] = deviation(
        ordinary,
        protectedStation,
      );
      const distalDatumGap: ICap["distalDatumGap"] =
        extents === undefined || toeSupport !== "fit"
          ? undefined
          : deviation(Full.create(baseline), extents.from);
      return {
        family: definition,
        view,
        frame: { origin: proximal, distal, dorsal },
        pole: actual.pole,
        sourceIndices: actual.indices,
        ...(profileSourceIndices === undefined ? {} : { profileSourceIndices }),
        from,
        tip,
        held,
        endpointGap,
        protectedGap,
        ...(distalDatumGap === undefined ? {} : { distalDatumGap }),
        ...(extents === undefined ? {} : { extents }),
      };

      function deviation(
        original: ReturnType<typeof Full.create>,
        station: number,
      ): ICap["protectedGap"] {
        const gap: ICap["protectedGap"] = [0, 0, 0];
        for (const phase of phases) {
          const before = original.jet(station, phase);
          const after = candidate.jet(station, phase);
          for (const [index, field] of (["p", "u", "uu"] as const).entries())
            gap[index] = Math.max(
              gap[index]!,
              Vec.norm(Vec.sub(before[field], after[field])),
            );
        }
        return gap;
      }
    };
  }

  /**
   * Apply the measured distal closure to an independently fitted prefix. The
   * supplied family still owns its original knots, phase correspondence,
   * station controls and origin line up to the cap start.
   */
  export function close(
    family: IAutoMovieHumanConicLoft.IFamily,
    stations: readonly number[],
    { from, tip, pole }: Pick<ICap, "from" | "tip" | "pole">,
    extents?: ICap["extents"],
  ): IAutoMovieViewPart {
    if (
      !(
        from > (family.rootSectionMark ?? family.knots[0]!) &&
        from <= family.knots.at(-1)! &&
        tip > from
      )
    )
      throw new Error(
        "Distal cap would overwrite a protected fan root or leave its measured domain",
      );
    const definition: IAutoMovieHumanConicLoft.IFamily = {
      ...family,
      tips: [family.tips?.[0] ?? null, { from, tip, own: true }],
    };
    const open: IAutoMovieViewPart = Loft.part(
      { ...family, tips: [family.tips?.[0] ?? null, null] },
      [...stations],
      false,
    );
    const generic: IAutoMovieViewPart = Loft.part(
      definition,
      [...stations],
      false,
    );
    const retained: number = Math.max(
      family.rootSectionMark ?? open.stations[0]!,
      ...family.knots.filter((s): boolean => s < from),
    );
    const axis = endAxis(open.axis, from, tip, pole);
    const baseline: IAutoMovieViewPart = {
      ...generic,
      axis,
      originalSection: preserveFamilyConicDistalSection(
        open,
        generic,
        retained,
        from,
      ),
    };
    if (extents === undefined) return baseline;
    const shaped: IAutoMovieViewPart = TipShape.fit(generic, extents, tip);
    // The earlier native datum is a complete local conic section, including
    // its original span. Blend that actual source, preserving the shared jet.
    const originalSection =
      extents.from === from
        ? preserveFamilyConicDistalSection(open, shaped, retained, from)
        : preserveFamilyConicDistalSection(
            baseline,
            shaped,
            extents.from,
            extents.blendEnd,
          );
    return { ...shaped, axis, originalSection };
  }

  /** A protected axial wall must be admitted by its own source adapter. */
  function requireWall(
    wall: Walls.IWall | undefined,
  ): IAutoMovieHumanConicLoft.IFamily {
    if (wall === undefined || wall.family === null || wall.refusal !== null)
      throw new Error(
        wall?.refusal ?? "No admitted independent HM08 digit wall",
      );
    return wall.family;
  }

  /** The thumb's own distal run survives the shared palm origin. */
  function thumb(
    digit: Digits.IDigit,
    cut: (f: IAutoMovieLoftSectionFrame) => P2[],
  ): IAutoMovieHumanConicLoft.IFamily {
    const observed: Digits.Section[] = digit.sections.filter(
      (section): boolean => !("refusal" in section),
    );
    const start: Digits.Section | undefined = observed[0];
    if (start === undefined)
      throw new Error("The thumb has no independent source plane");
    const nominal: number =
      digit.transitions.at(-1)?.measured.station ?? observed.at(-1)!.station;
    // The shared MCP cut does not own a standalone thumb. Begin on an
    // independently enclosed plane and keep the actual IP and tip markers.
    const course: Families.Course = Families.roundedCourse(
      [[...start.frame.origin], ...digit.centres.slice(-2)],
      cut,
      [...start.frame.u],
    );
    const axis: IAutoMovieViewAxis.IAxis = Loft.axis(course);
    const last: number = nominal - start.station;
    // Use the production wall's body pitch over the isolated thumb interval.
    const count: number = Math.ceil(last / Stations.BODY_PITCH_MM);
    type Row = { station: number; origin: P2; values: number[] };
    const runs: Row[][] = [[]];
    for (let k: number = 0; k <= count; ++k) {
      const station: number = (last * k) / count;
      try {
        const { origin, points } = Families.centred(
          cut(axis.at(station)),
          false,
        );
        const values: number[] = Families.fields(points, false);
        if (!values.every(Number.isFinite))
          throw new Error("The thumb section has no finite control row");
        runs.at(-1)!.push({ station, origin, values });
      } catch {
        if (runs.at(-1)!.length > 0) runs.push([]);
      }
    }
    const rows: Row[] | undefined = runs
      .reverse()
      .find((run): boolean => run.length >= 2);
    if (rows === undefined)
      throw new Error(
        "No consecutive independent cuts on the thumb's rounded course",
      );
    return {
      ...course,
      name: digit.name,
      layout: Conic.limb(0),
      rootSectionMark: rows[0]!.station,
      knots: rows.map((row): number => row.station),
      values: rows[0]!.values.map((_, field): number[] =>
        rows.map((row): number => row.values[field]!),
      ),
      origin: {
        u: rows.map((row): number => row.origin[0]),
        v: rows.map((row): number => row.origin[1]),
      },
    };
  }

  /** Keep the entire original germ and move only its continuation to the pole. */
  function endAxis(
    axis: IAutoMovieViewAxis.IAxis,
    from: number,
    tip: number,
    pole: P3,
  ): IAutoMovieViewAxis.IAxis {
    const offset: P3 = Vec.sub(pole, axis.at(tip).origin);
    const length: number = tip - from;
    const at = (station: number): IAutoMovieLoftSectionFrame => {
      const frame: IAutoMovieLoftSectionFrame = axis.at(station);
      if (station <= from) return frame;
      const t: number = Math.min(1, (station - from) / length);
      const weight: number = t ** 3 * (10 - 15 * t + 6 * t * t);
      return {
        ...frame,
        origin: Vec.add(frame.origin, Vec.scale(offset, weight)),
      };
    };
    return {
      at,
      jet: (station, parameter): IAutoMovieViewAxisJet.IJet | null => {
        const jet: IAutoMovieViewAxisJet.IJet | null =
          axis.jet?.(station) ?? null;
        if (jet === null) return null;
        if (station <= from || station >= tip)
          return AxisJet.parameter(
            { ...jet, value: at(station) },
            parameter,
            station,
          );
        const t: number = (station - from) / length;
        const first: number = (30 * t ** 2 * (1 - t) ** 2) / length;
        const second: number =
          (60 * t * (1 - t) * (1 - 2 * t)) / (length * length);
        return AxisJet.parameter(
          {
            value: at(station),
            first: {
              ...jet.first,
              origin: Vec.add(jet.first.origin, Vec.scale(offset, first)),
            },
            second: {
              ...jet.second,
              origin: Vec.add(jet.second.origin, Vec.scale(offset, second)),
            },
          },
          parameter,
          station,
        );
      },
    };
  }
}
