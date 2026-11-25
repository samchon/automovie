import {
  AutoMovieLoftAdmissionError,
  AutoMovieLoftViewFullSource,
  AutoMovieSolidIntersection,
  AutoMovieSolidTraceLaw,
  AutoMovieSolidTraceSolve,
  AutoMovieSolidVector as Vector,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionSharedLoop,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * The auricle's two level intersections with the actual head original. Their
 * phases meet at the upper and lower turn stations. Reading the two branches
 * gives a closed guide even when the footprint runs across one ray more than
 * once. The kernel corrects that guide on the native charts and supplies both
 * derivative orders for the paired join.
 */
export namespace AutoMovieHumanHeadEarContact {
  // At most the existing turn search's 44 ternary reductions. A bracket two
  // native phase steps wide then contracts by (2/3)^44 even without a witness.
  const TURN_REDUCTIONS: number = 44;

  interface IPhaseProbe {
    phase: number;
    gap: number;
  }

  /** Both scalp intersections of one horizontal level, when it meets the ear. */
  export interface ILevel {
    /** Shared world-height station in calibration millimetres. */
    station: number;
    /** Authored name when this level is a named ear guide. */
    site?: string;
    /** Signed lateral scalp distance at the anterior ear guide, millimetres. */
    anteriorClearance: number;
    /** Signed lateral scalp distance at the posterior ear guide, millimetres. */
    posteriorClearance: number;
    /**
     * Smallest signed scalp distance among the native phase observations and
     * refined witnesses, millimetres.
     */
    inwardClearance: number;
    /** World intersection points in phase order, calibration millimetres. */
    crossings: AutoMovieVector3Tuple[];
    /** The same intersection points on the ear chart, radians. */
    contactPhases: number[];
  }

  /** One paired original point on the closed guide, in mm and radians. */
  export interface ISample {
    /** Angle of the two-branch guide over one turn, radians. */
    angle: number;
    /** Common world-height station in calibration millimetres. */
    station: number;
    /** Native ear-section phase at the contact, radians. */
    partPhase: number;
    /** Native scalp-section phase at the contact, radians. */
    hostPhase: number;
    /** Contact position in world calibration millimetres. */
    point: AutoMovieVector3Tuple;
    /** Signed lateral difference between the native charts, millimetres. */
    gap: number;
  }

  /** The physically closed native guide or its first unavailable premise. */
  export type Observation =
    | { refusal: string; samples?: undefined }
    | {
        maximumScalpGap: number;
        closingChord: number;
        biggestChord: number;
        samples: ISample[];
        refusal?: undefined;
      };

  /** Each source's side is already part of the authored auricle identity. */
  export function sideOf(name: string): 1 | -1 | null {
    if (name === "auricle.left") return 1;
    if (name === "auricle.right") return -1;
    return null;
  }

  /** Bind the actual outer ear joins to one shared scalp original. */
  export function context(
    mass: IAutoMovieViewPart,
    parts: readonly IAutoMovieViewPart[],
    tolerance: number,
  ): ReadonlyMap<string, IAutoMovieConstructionSharedLoop.ISource> {
    const loops: Map<string, IAutoMovieConstructionSharedLoop.ISource> =
      new Map();
    const ears = parts.flatMap((part) => {
      const side: 1 | -1 | null = sideOf(part.name);
      return side === null ? [] : [{ part, side }];
    });
    if (ears.length === 0) return loops;
    const scalp: IAutoMovieLoftViewFullSource.IReader =
      AutoMovieLoftViewFullSource.create(mass);
    const host: IAutoMovieSolidSurface = surface(mass.name, scalp);
    for (const { part, side } of ears)
      loops.set(
        `blend.${part.name}`,
        prepare(host, scalp, part, side, tolerance),
      );
    return loops;
  }

  /** Observe the actual footprint on the living stations of both originals. */
  export function levels(
    part: IAutoMovieViewPart,
    ear: IAutoMovieLoftViewFullSource.IReader,
    scalp: IAutoMovieLoftViewFullSource.IReader,
    side: 1 | -1,
  ): ILevel[] {
    const named: readonly IAutoMovieViewPart.IKnot[] =
      part.front.positive.knots;
    const [bottom, top] = ear.domain;
    const samples: number[] = [
      ...new Set([
        ...named.map(({ station }) => station),
        ...part.stations,
        // A coarse whole-span observation supplements the nonuniform native
        // section rows so a lobe near a cap has an exterior bracket.
        ...Array.from(
          { length: 33 },
          (_, i): number => bottom + ((top - bottom) * i) / 32,
        ),
      ]),
    ]
      .filter((y: number): boolean => y >= bottom && y <= top)
      .sort((a, b) => a - b);
    const count: number = part.samples;
    const phases: number[] = Array.from(
      { length: count + 1 },
      (_, i): number => (2 * Math.PI * i) / count,
    );
    return samples.map((station: number): ILevel => {
      const head = scalp.pointAt(station);
      const pinna = ear.pointAt(station);
      const gap = (point: AutoMovieVector3Tuple): number =>
        scalpGap(head, point, side).gap;
      const at = (phase: number): number => gap(pinna(phase));
      const probes: IPhaseProbe[] = phases.map((phase) => ({
        phase,
        gap: at(phase),
      }));
      const { contactPhases, inwardClearance } = crossingsAt(at, probes);
      const site: string | undefined = named.find(
        (knot) => knot.station === station,
      )?.site;
      return {
        station,
        ...(site === undefined ? {} : { site }),
        anteriorClearance: at(Math.PI),
        posteriorClearance: probes[0]!.gap,
        inwardClearance,
        crossings: contactPhases.map(pinna),
        contactPhases,
      };
    });
  }

  /** Refine a sampled extremum only to obtain an actual opposite-sign witness. */
  function crossingsAt(
    gap: (phase: number) => number,
    probes: readonly IPhaseProbe[],
  ): Pick<ILevel, "contactPhases" | "inwardClearance"> {
    const witnesses: IPhaseProbe[] = [];
    for (let i: number = 1; i + 1 < probes.length; i++) {
      const [before, middle, after] = [
        probes[i - 1]!,
        probes[i]!,
        probes[i + 1]!,
      ];
      const orientation: number = Math.sign(before.gap);
      const nearest: number = orientation * middle.gap;
      if (
        !(
          nearest >= 0 &&
          nearest < orientation * before.gap &&
          nearest <= orientation * after.gap
        )
      )
        continue;
      const witness: IPhaseProbe = phaseMinimum(
        (phase) => ({ phase, gap: gap(phase) }),
        before.phase,
        after.phase,
        orientation,
      );
      if (orientation * witness.gap < 0) witnesses.push(witness);
    }
    const ordered: readonly IPhaseProbe[] =
      witnesses.length === 0
        ? probes
        : [...probes, ...witnesses].sort((a, b) => a.phase - b.phase);
    const contactPhases: number[] = [];
    let previous: IPhaseProbe | undefined;
    for (const probe of ordered) {
      // A zero could be a tangency. It contributes only when the nonzero
      // neighbours establish a crossing, including a root at a sampled phase.
      if (probe.gap === 0) continue;
      const outside: boolean = probe.gap > 0;
      if (previous !== undefined && previous.gap > 0 !== outside) {
        let a: number = previous.phase;
        let b: number = probe.phase;
        for (let k: number = 0; k < 40; k++) {
          const m: number = (a + b) / 2;
          if (gap(m) > 0 === outside) b = m;
          else a = m;
        }
        contactPhases.push((a + b) / 2);
      }
      previous = probe;
    }
    return {
      contactPhases,
      inwardClearance: Math.min(...ordered.map(({ gap }) => gap)),
    };
  }

  /**
   * Contract an existing local bracket. A requested opposite sign can stop it
   * early.
   */
  function phaseMinimum<T extends { gap: number }>(
    read: (phase: number) => T,
    low: number,
    high: number,
    opposite?: number,
  ): T {
    const sign: number = opposite ?? 1;
    for (let k: number = 0; k < TURN_REDUCTIONS; k++) {
      const stride: number = (high - low) / 3;
      const a: T = read(low + stride);
      const b: T = read(high - stride);
      const best: T = sign * a.gap < sign * b.gap ? a : b;
      if (opposite !== undefined && sign * best.gap < 0) return best;
      if (best === a) high -= stride;
      else low += stride;
    }
    return read((low + high) / 2);
  }

  /** Read both branches and locate the two stations at which their phases meet. */
  export function observe(
    ear: IAutoMovieLoftViewFullSource.IReader,
    scalp: IAutoMovieLoftViewFullSource.IReader,
    side: 1 | -1,
    sites: readonly ILevel[],
    count: number,
  ): Observation {
    const first: number = sites.findIndex(
      ({ contactPhases }) => contactPhases.length > 0,
    );
    let last: number = sites.length - 1;
    while (last > first && sites[last]!.contactPhases.length === 0) last--;
    const active: readonly ILevel[] = sites.slice(first, last + 1);
    // Both branches use 0/2π as their exterior endpoint. Require it on the
    // active interval and the two adjacent samples that bracket its turns.
    if (
      first >= 0 &&
      sites
        .slice(Math.max(0, first - 1), last + 2)
        .some(({ posteriorClearance }) => !(posteriorClearance > 0))
    )
      return { refusal: "The native posterior phase is not exterior" };
    if (
      !(first > 0 && last < sites.length - 1 && last > first) ||
      active.some(({ contactPhases }) => contactPhases.length !== 2)
    )
      return {
        refusal:
          "The sampled source has no single interval with two level branches",
      };
    const level = (
      station: number,
    ): ((partPhase: number) => Omit<ISample, "angle">) => {
      const pinna = ear.pointAt(station);
      const head = scalp.pointAt(station);
      return (partPhase: number): Omit<ISample, "angle"> => {
        const point: AutoMovieVector3Tuple = pinna(partPhase);
        const { phase, gap } = scalpGap(head, point, side);
        return { station, partPhase, hostPhase: phase, point, gap };
      };
    };
    const turn = (
      outside: number,
      sample: ILevel,
    ): Omit<ISample, "angle"> | null => {
      const pad: number = (2 * Math.PI) / count;
      const left: number = sample.contactPhases[0]! - pad;
      const right: number = sample.contactPhases[1]! + pad;
      // The adjacent crossing phases bracket the gap minimum at the turn.
      const centre = (station: number): Omit<ISample, "angle"> =>
        phaseMinimum(level(station), left, right);
      let inside: number = sample.station;
      if (!(centre(outside).gap > 0 && centre(inside).gap < 0)) return null;
      for (let i: number = 0; i < 44; i++) {
        const s: number = (inside + outside) / 2;
        if (centre(s).gap > 0) outside = s;
        else inside = s;
      }
      return centre((inside + outside) / 2);
    };
    const bottom = turn(sites[first - 1]!.station, sites[first]!);
    const top = turn(sites[last + 1]!.station, sites[last]!);
    if (bottom === null || top === null)
      return {
        refusal: "The sampled extremes do not bracket both source turns",
      };
    const centre = [
      { station: bottom.station, phase: bottom.partPhase },
      ...active.map(({ station, contactPhases }) => ({
        station,
        phase: (contactPhases[0]! + contactPhases[1]!) / 2,
      })),
      { station: top.station, phase: top.partPhase },
    ];
    const samples: ISample[] = [];
    for (let i: number = 0; i <= count; i++) {
      const angle: number = (2 * Math.PI * i) / count;
      if (i === 0 || i === count) {
        samples.push({ angle, ...bottom });
        continue;
      }
      if (2 * i === count) {
        samples.push({ angle, ...top });
        continue;
      }
      // The cosine changes branch at each turn while the station approaches
      // it quadratically, keeping spacing bounded as the two phases meet.
      const station: number =
        bottom.station +
        ((top.station - bottom.station) * (1 - Math.cos(angle))) / 2;
      const at = level(station);
      const before: number = centre.findIndex((p) => p.station >= station) - 1;
      const [a, b] = [centre[before]!, centre[before + 1]!];
      const share: number = (station - a.station) / (b.station - a.station);
      let inward: number = a.phase + share * (b.phase - a.phase);
      let outward: number = 2 * i < count ? 0 : 2 * Math.PI;
      if (!(at(inward).gap < 0 && at(outward).gap > 0))
        return { refusal: `No level branch bracket at ${station} mm` };
      for (let q: number = 0; q < 44; q++) {
        const middle: number = (inward + outward) / 2;
        if (at(middle).gap > 0) outward = middle;
        else inward = middle;
      }
      samples.push({ angle, ...at((inward + outward) / 2) });
    }
    return {
      maximumScalpGap: Math.max(
        ...samples.map(({ gap }): number => Math.abs(gap)),
      ),
      closingChord: Vector.norm(
        Vector.sub(samples[0]!.point, samples.at(-1)!.point),
      ),
      biggestChord: Math.max(
        ...samples
          .slice(1)
          .map(({ point }, i): number =>
            Vector.norm(Vector.sub(point, samples[i]!.point)),
          ),
      ),
      samples,
    };
  }

  /** Prepare the caller's shared loop. Both readers correct on the same guide. */
  function prepare(
    host: IAutoMovieSolidSurface,
    scalp: IAutoMovieLoftViewFullSource.IReader,
    original: IAutoMovieViewPart,
    side: 1 | -1,
    tolerance: number,
  ): IAutoMovieConstructionSharedLoop.ISource {
    const names = { hostFace: host.name, partFace: original.name };
    const ear = AutoMovieLoftViewFullSource.create(original);
    const observed: Observation = observe(
      ear,
      scalp,
      side,
      levels(original, ear, scalp, side),
      original.samples,
    );
    if (observed.samples === undefined)
      return { ...names, kind: "refused", detail: observed.refusal };
    const samples: ISample[] = observed.samples;
    const length: number = samples.length - 1;
    const law = AutoMovieSolidTraceLaw.arc(
      samples.slice(0, -1).map(({ point }) => point),
    );
    const part: IAutoMovieSolidSurface = surface(original.name, ear);
    const atlas = AutoMovieSolidIntersection.atlas(host);
    const meet = (t: number) => {
      const turn: number = 2 * Math.PI;
      const clock: number = ((t % turn) + turn) % turn;
      const station: number = (clock * length) / turn;
      const index: number = Math.min(length - 1, Math.floor(station));
      const before: ISample = samples[index]!;
      const after: ISample = samples[index + 1]!;
      const share: number = station - index;
      const mix = (a: number, b: number): number => a + share * (b - a);
      const y: number = mix(before.station, after.station);
      const point = AutoMovieSolidTraceSolve.solve(
        part,
        atlas,
        law,
        clock,
        [
          y,
          mix(before.partPhase, after.partPhase),
          y,
          mix(before.hostPhase, after.hostPhase),
        ],
        0,
        tolerance,
      );
      if (point === null)
        throw new AutoMovieLoftAdmissionError(
          `${original.name} closed native guide lost its contact at ${clock} rad`,
        );
      return point;
    };
    return {
      ...names,
      kind: "ready",
      // ESTIMATE. Request the body's 0.01 mm overlap budget as a local chord
      // target. Emitted crossing and continuity checks use the actual mesh.
      railChord: 0.01,
      at: (t) => {
        const p = meet(t);
        return {
          point: [p.y, p.theta],
          first: [p.rate[2], p.rate[3]],
          second: [p.rate2[2], p.rate2[3]],
        };
      },
      partAt: (t) => {
        const p = meet(t);
        return {
          point: [p.s, p.phi],
          first: [p.rate[0], p.rate[1]],
          second: [p.rate2[0], p.rate2[1]],
        };
      },
    };
  }

  /** Adapt original section reads for the paired solver's surface equations. */
  function surface(
    name: string,
    read: IAutoMovieLoftViewFullSource.IReader,
  ): IAutoMovieSolidSurface {
    return {
      name,
      jet: read.jet,
      point: read.point,
      pointAt: read.pointAt,
      orientation: 1,
      period: 2 * Math.PI,
      domain: [...read.domain],
    };
  }

  /** Signed lateral distance at the same station and sagittal coordinate. */
  function scalpGap(
    scalp: (phase: number) => AutoMovieVector3Tuple,
    point: AutoMovieVector3Tuple,
    side: 1 | -1,
  ): { phase: number; gap: number } {
    let a: number = 0;
    let b: number = Math.PI;
    for (let i: number = 0; i < 40; i++) {
      const phase: number = (a + b) / 2;
      if (scalp(side * phase)[0] > point[0]) a = phase;
      else b = phase;
    }
    const phase: number = (side * (a + b)) / 2;
    return { phase, gap: side * (point[2] - scalp(phase)[2]) };
  }
}
