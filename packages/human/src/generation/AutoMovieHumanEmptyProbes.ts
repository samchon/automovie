import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
} from "@automovie/interface";

import { AutoMovieHumanEmptyProbeWalls } from "./conic/AutoMovieHumanEmptyProbeWalls";

/**
 * Points a figure's skin must leave empty, read from its families' own courses
 * and sections without realizing a skin.
 *
 * A cutter's course runs through space the finished skin is cut away from, so
 * its middle station is a probe. Between two families whose walls face each
 * other across a gap, such as the two legs below the crotch or two neighbouring
 * fingers, the midpoint between their facing walls is a probe once those walls
 * stand far enough apart that the realized skin cannot reach it: at least twice
 * the larger ring phase spacing of the two families there, since a ring's chord
 * strays from the wall it samples by less than one phase step. Wall points are
 * read on the families' original sections by `AutoMovieHumanEmptyProbeWalls`,
 * along the ray toward the other family's course, so the skin is measured
 * against the construction's intent.
 *
 * Every point is millimetres in the families' frame (forward +X, up +Y, left
 * +Z). A probe that cannot be placed keeps its name and says why, so a listing
 * names every probe the figure owes.
 */
export namespace AutoMovieHumanEmptyProbes {
  /**
   * One empty probe: placed at a point, or listed with the reason it could not
   * be placed.
   */
  export type IProbe = IPlaced | IUnplaced;

  /** A placed probe. */
  export interface IPlaced {
    /**
     * The probe's name, unique in its listing; a mirrored twin's ends in
     * `.mirror`.
     */
    name: string;

    /**
     * How the point was derived: the families, the stations and the measured
     * wall gap.
     */
    derivation: string;

    /** The point, millimetres in the families' frame. */
    point: AutoMovieVector3Tuple;
  }

  /** A probe that could not be placed. */
  export interface IUnplaced {
    /** The probe's name, unique in its listing. */
    name: string;

    /** Where the probe was sought. */
    derivation: string;

    /** Why no point qualifies, with the measured numbers. */
    reason: string;
  }

  /**
   * One side of a gap: a family as stored, or its twin across the median plane
   * `z = 0`, which the figure reflects and never fits on its own
   * (`AutoMovieHumanConicLoft.mirror`), so the twin's course and walls are the
   * stored family's reflected.
   */
  export interface ISide {
    /** The stored family. */
    family: IAutoMovieHumanConicLoft.IFamily;

    /** Whether this side is the family's reflected twin. */
    reflected: boolean;
  }

  /**
   * What a person's listing reads: its cutters, the family split below the
   * crotch into two legs, and its adjacent fingers.
   */
  export interface IListing {
    /**
     * The stored cutters, each with its mirroring and the cut the figure lofts
     * from it.
     */
    cutters: IAutoMovieHumanF1.Cutters;

    /** The leg family; its twin is the other leg. */
    leg: IAutoMovieHumanConicLoft.IFamily;

    /**
     * The fingers in order across the hand, each pair of neighbours a gap; both
     * hands are listed, the second as the twin.
     */
    fingers: readonly IAutoMovieHumanConicLoft.IFamily[];
  }

  /*
   * Station step, mm, at which a gap's walls are first sought along a course
   * before the qualifying station is bisected.
   */
  const STEP_MM: number = 1;

  /**
   * Every empty probe of a person: one per cutter and side it is mirrored to,
   * one between the legs, and one between each pair of adjacent fingers on each
   * hand.
   *
   * @param listing The person's cutters, leg and fingers.
   * @returns The probes, cutters first, then the legs, then the fingers of the
   *   stored hand and of its twin.
   */
  export function list(listing: IListing): IProbe[] {
    const probes: IProbe[] = [];
    for (const cutter of listing.cutters) {
      const probe: IProbe = middle(
        cutter.family.name,
        cutter.cut(cutter.family),
      );
      probes.push(probe);
      if (cutter.mirrored) probes.push(reflect(probe));
    }
    probes.push(
      split(
        "legs",
        { family: listing.leg, reflected: false },
        { family: listing.leg, reflected: true },
      ),
    );
    const fingers: IProbe[] = [];
    for (let k: number = 0; k + 1 < listing.fingers.length; ++k) {
      const [a, b]: [
        IAutoMovieHumanConicLoft.IFamily,
        IAutoMovieHumanConicLoft.IFamily,
      ] = [listing.fingers[k]!, listing.fingers[k + 1]!];
      fingers.push(between(`${a.name}-${b.name.split(".").at(-1)}`, a, b));
    }
    probes.push(...fingers, ...fingers.map(reflect));
    return probes;
  }

  /**
   * A cutter's probe: the origin of its course at the middle of its fields'
   * station domain, from its first knot to its last.
   *
   * @param name The probe's name.
   * @param family The family the figure cuts with, as `cut` returns it.
   * @returns The placed probe.
   */
  export function middle(
    name: string,
    family: IAutoMovieHumanConicLoft.IFamily,
  ): IProbe {
    const station: number = (family.knots[0]! + family.knots.at(-1)!) / 2;
    return {
      name,
      derivation: `the middle station ${round(station)} mm of the course of ${family.name}`,
      point: [
        ...AutoMovieHumanEmptyProbeWalls.axisOf(family).at(station).origin,
      ] as AutoMovieVector3Tuple,
    };
  }

  /**
   * The probe between two families that run side by side, at the middle of the
   * shorter one's course: the midpoint between their facing walls, where the
   * longer family's course comes nearest that station's course point.
   *
   * @param name The probe's name.
   * @param a One family.
   * @param b The other family.
   * @returns The probe, or the walls' gap and the required gap when they stand
   *   too close.
   */
  export function between(
    name: string,
    a: IAutoMovieHumanConicLoft.IFamily,
    b: IAutoMovieHumanConicLoft.IFamily,
  ): IProbe {
    const [short, long]: [
      IAutoMovieHumanConicLoft.IFamily,
      IAutoMovieHumanConicLoft.IFamily,
    ] = span(a) <= span(b) ? [a, b] : [b, a];
    const station: number = (short.knots[0]! + short.knots.at(-1)!) / 2;
    const gap: AutoMovieHumanEmptyProbeWalls.IGap =
      AutoMovieHumanEmptyProbeWalls.facing(
        { family: short, reflected: false },
        station,
        {
          family: long,
          reflected: false,
        },
      );
    const derivation: string = `between ${short.name} at the middle station ${round(station)} mm of its course and ${long.name} at ${round(gap.other)} mm, where its course comes nearest`;
    return gap.gap >= gap.required
      ? { name, derivation, point: gap.middle }
      : {
          name,
          derivation,
          reason: `the facing walls stand ${round(gap.gap)} mm apart, under the ${round(gap.required)} mm that twice the larger ring phase spacing requires`,
        };
  }

  /**
   * The probe between two sides that part along a course from a common root,
   * such as the two legs below the crotch: at the station of `a`'s course
   * nearest its first knot where the facing walls first stand the required gap
   * apart, the midpoint between them.
   *
   * @param name The probe's name.
   * @param a The side whose course is walked from its first knot.
   * @param b The other side.
   * @returns The probe, or the widest gap found when none is wide enough.
   */
  export function split(name: string, a: ISide, b: ISide): IProbe {
    const [first, last]: [number, number] = [
      a.family.knots[0]!,
      a.family.knots.at(-1)!,
    ];
    const derivation: string = `between ${label(a)} and ${label(b)}, walking ${label(a)}'s course from its first station ${round(first)} mm`;
    function enough(
      station: number,
    ): AutoMovieHumanEmptyProbeWalls.IGap | null {
      const gap: AutoMovieHumanEmptyProbeWalls.IGap =
        AutoMovieHumanEmptyProbeWalls.facing(a, station, b);
      return gap.gap >= gap.required ? gap : null;
    }
    let below: number = first;
    let widest: AutoMovieHumanEmptyProbeWalls.IGap | null = null;
    for (let station: number = first; station <= last; station += STEP_MM) {
      const gap: AutoMovieHumanEmptyProbeWalls.IGap =
        AutoMovieHumanEmptyProbeWalls.facing(a, station, b);
      if (
        widest === null ||
        gap.gap - gap.required > widest.gap - widest.required
      )
        widest = gap;
      if (gap.gap < gap.required) {
        below = station;
        continue;
      }

      // Bisect between the last station too narrow and the first wide enough; the wide end always qualifies.
      let above: number = station;
      let found: AutoMovieHumanEmptyProbeWalls.IGap = gap;
      if (station > first)
        for (let k: number = 0; k < 40; ++k) {
          const mid: number = (below + above) / 2;
          const at: AutoMovieHumanEmptyProbeWalls.IGap | null = enough(mid);
          if (at === null) below = mid;
          else [above, found] = [mid, at];
        }
      return {
        name,
        derivation: `${derivation}: the first station where the walls stand ${round(found.gap)} mm apart against ${round(found.required)} mm required, ${round(above)} mm`,
        point: found.middle,
      };
    }
    return {
      name,
      derivation,
      reason:
        widest === null
          ? "the course has no station"
          : `no station's walls stand far enough apart; the widest stand ${round(widest.gap)} mm apart against ${round(widest.required)} mm required`,
    };
  }

  /**
   * A probe's twin across the median plane `z = 0`: its point reflected and its
   * name followed by `.mirror`.
   *
   * @param probe The stored side's probe.
   * @returns The twin's probe.
   */
  export function reflect(probe: IProbe): IProbe {
    const name: string = `${probe.name}.mirror`;
    const derivation: string = `the reflection in the median plane of ${probe.name}, ${probe.derivation}`;
    return "point" in probe
      ? {
          name,
          derivation,
          point: [probe.point[0], probe.point[1], -probe.point[2]],
        }
      : { name, derivation, reason: probe.reason };
  }

  /*
   * The length of a family's fields' station domain, mm.
   */
  function span(family: IAutoMovieHumanConicLoft.IFamily): number {
    return family.knots.at(-1)! - family.knots[0]!;
  }

  /*
   * A side's name: the family's, followed by `.mirror` for the twin.
   */
  function label(side: ISide): string {
    return side.reflected ? `${side.family.name}.mirror` : side.family.name;
  }

  /*
   * A number to a hundredth, for a derivation's text.
   */
  function round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
