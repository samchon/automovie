import { AutoMovieCurveMath64, AutoMovieViewAxis, AutoMovieViewLoft, type IAutoMovieLoftChain, type IAutoMovieLoftRelief, type IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanHorizontalChain } from "../../lofting/AutoMovieHumanHorizontalChain";
import conics from "./AutoMovieHumanHeadF1Conics.json";
import guides from "./AutoMovieHumanHeadF1Guides.json";
import type { AutoMovieHumanHeadMass } from "./AutoMovieHumanHeadMass";
import { AutoMovieHumanHeadMassCurves } from "./AutoMovieHumanHeadMassCurves";

type Knot = AutoMovieHumanHeadMassCurves.IKnot;

/** Largest change of any outline between neighbouring layers, mm. */
const MOVE: number = 2;

/** Deepest halving of a layer step (a step of the gap over 2^8). */
const DEPTH: number = 8;

/**
 * head.mass's pure loft constructor: its view curves become one
 * `IAutoMovieViewPart` lofted by the engine's view-to-section operator
 * (`AutoMovieViewLoft`), classic conic lofting, on the head/neck course
 * (`AutoMovieHumanHeadNeckCourse`, given here in the world). The chart's `u`
 * pair is the side view (anterior, posterior) and its `v` pair the front view
 * (right, left half breadths, mirrored). The vertex is the top pole; the
 * neck-base end is open, continuing the trunk's S00 end; the jaw reliefs
 * are composed into the chain, their rows added to the layer keys.
 *
 * Jets: the outlines' root-parameter jets are the engine's own parameter
 * (`-sqrt(L - s)`), normalized by the whole source span `sqrt(L - s0)` (`s0`
 * the port's station) as `AutoMovieViewHermite` requires; the fullness knots
 * are in station and normalized by `L - s0`. Head-frame stations shift by the
 * axis frame's height of FH; the root parameter and the station jets do not
 * change under that shift.
 */
export namespace AutoMovieHumanHeadMassLoft {
  /**
   * Rebuild the accepted fixed F1 head charts from their original world
   * frames, measured signed supports and dimensionless conic shoulders.
   * The other chains use the exact ordered ordinary guide rows. Local
   * anatomical joins own the open rims left by these independent lofts.
   */
  export function f1(): { chains: IAutoMovieLoftChain[]; neck: AutoMovieViewAxis.IAxis } {
    const neck: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(
      conics.neck.centres.map(AutoMovieCurveMath64.clone), conics.neck.halves, AutoMovieCurveMath64.clone(conics.neck.forward),
    );
    if (typeof neck === "string") throw new Error(neck);
    const quarter = <T>(values: readonly T[]): IAutoMovieViewPart.IQuarters<T> => [values[0]!, values[1]!, values[2]!, values[3]!];
    const chains: IAutoMovieLoftChain[] = conics.parts.map((data): IAutoMovieLoftChain => {
      const level = conics.level.find(({ name, stations }): boolean =>
        data.name.startsWith(name) && data.stations[0]! >= stations[0]! && data.stations.at(-1)! <= stations.at(-1)!);
      const axis: AutoMovieViewAxis.IAxis = data.name.startsWith("head.neck.") ? neck : (() => {
        if (level === undefined) throw new Error(`Missing fixed axis for ${data.name}`);
        return AutoMovieViewAxis.level(
          level.stations.map((station: number, i: number) => ({ station, value: level.centres[i]![0]! })),
          level.stations.map((station: number, i: number) => ({ station, value: level.centres[i]![2]! })),
        );
      })();
      const { shoulders, touch, splits } = data.fullness;
      const part: IAutoMovieViewPart = {
        name: data.name, axis, stations: data.stations, front: data.front, side: data.side, order: data.order, samples: data.samples,
        fullness: {
          kind: "top", shoulders: quarter(shoulders),
          ...(touch === undefined ? {} : { touch: quarter(touch) }),
          ...(splits === undefined ? {} : { splits: quarter(splits) }),
        },
      };
      const { chain }: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
      if (chain === null) throw new Error(`The recorded fixed F1 conic refused ${data.name}`);
      return chain;
    });
    // The measured forehead branch supplants the old overlapping guide
    // completely. The remaining guide contours preserve their actual phase.
    for (const { name, order, samples, profiles, stations } of guides) {
      if (name === "head.face-linked.2686") continue;
      chains.push(AutoMovieHumanHorizontalChain.build(
        { name, order, samples, rule: "sagittal" },
        profiles.map((row) => row.map(AutoMovieCurveMath64.clone)), undefined, stations,
      ));
    }
    return { chains, neck };
  }

  /** What the loft reads. */
  export interface IInput {
    /** The head mass's view curves. */
    curves: AutoMovieHumanHeadMass.IOutput;

    /** The course in the world. */
    axis: AutoMovieViewAxis.IAxis;

    /** The axis's station of the head frame's station 0 (FH): the head frame's height in the axis's frame, mm. */
    shift: number;

    /** Section control points (multiple of 4). */
    order: number;

    /** Ring phases of the chain, at least; the reliefs' phase spacing raises it (the sampling rule). */
    samples: number;

    /** Widest layer spacing, mm. */
    gap: number;
  }

  /** The lofted part. */
  export interface IOutput {
    /** The view part handed to the engine. */
    part: IAutoMovieViewPart;

    /** The engine's loft. */
    loft: AutoMovieViewLoft.IResult;
  }

  /** Build and loft head.mass. */
  export function create(input: IInput): IOutput {
    const c: AutoMovieHumanHeadMass.IOutput = input.curves;
    const height: number = c.length - c.start;
    const span: number = Math.sqrt(height);
    const at: (s: number) => number = (s: number): number => s + input.shift;
    const signed: (knots: Knot[], sign: 1 | -1) => IAutoMovieViewPart.IOutline = (knots: Knot[], sign: 1 | -1): IAutoMovieViewPart.IOutline => ({
      knots: knots.map((k: Knot): IAutoMovieViewPart.IKnot => ({ site: k.site, station: at(k.station), value: sign * k.value, jet: { first: sign * k.first * span, second: sign * k.second * span * span } })),
    });
    const shoulder: (knots: Knot[]) => IAutoMovieViewPart.IOutline = (knots: Knot[]): IAutoMovieViewPart.IOutline => ({
      knots: knots.map((k: Knot): IAutoMovieViewPart.IKnot => ({ site: k.site, station: at(k.station), value: k.value, jet: { first: k.first * height, second: k.second * height * height } })),
    });

    // Layers: every knot station; each run between them cut into equal steps
    // no wider than the gap, and each step halved where an outline moves fast,
    // only there, until no outline changes by more than `MOVE` across it (the
    // submental band, where the anterior outline crosses from the throat to
    // the chin within a few millimetres of height). Halving whole runs
    // instead gave 1057 layers (render 2026-11-08 06:12).
    const keys: number[] = [];
    const reliefRows: number[] = c.reliefs.flatMap((r: IAutoMovieLoftRelief): number[] => Array.from({ length: r.rows }, (_: unknown, i: number): number => r.stations[0] + ((r.stations[1] - r.stations[0]) * i) / (r.rows - 1))).filter((s: number): boolean => s > c.start && s < c.length);
    for (const s of [...[...Object.values(c.outlines).flat(), ...c.fullness.anterior, ...c.fullness.posterior].map((k: Knot): number => k.station), ...reliefRows].sort((a: number, b: number): number => a - b))
      if (keys.length === 0 || s - keys[keys.length - 1]! > 1e-6) keys.push(s);
    const reading: (s: number) => number[] = (s: number): number[] => Object.values(c.outlines).map((knots: Knot[]): number => AutoMovieHumanHeadMassCurves.value(knots, s, c.length)[0]);
    const stations: number[] = [keys[0]!];
    const step: (a: number, b: number, va: number[], vb: number[], depth: number) => void = (a: number, b: number, va: number[], vb: number[], depth: number): void => {
      if (depth < DEPTH && va.some((v: number, k: number): boolean => Math.abs(vb[k]! - v) > MOVE)) {
        const m: number = (a + b) / 2;
        const vm: number[] = reading(m);
        step(a, m, va, vm, depth + 1);
        step(m, b, vm, vb, depth + 1);
      } else stations.push(b);
    };
    for (let i: number = 0; i + 1 < keys.length; ++i) {
      const n: number = Math.max(1, Math.ceil((keys[i + 1]! - keys[i]!) / input.gap));
      let a: number = keys[i]!;
      let va: number[] = reading(a);
      for (let j: number = 1; j <= n; ++j) {
        const b: number = j === n ? keys[i + 1]! : keys[i]! + ((keys[i + 1]! - keys[i]!) * j) / n;
        const vb: number[] = reading(b);
        step(a, b, va, vb, 0);
        a = b;
        va = vb;
      }
    }
    const part: IAutoMovieViewPart = {
      name: "head.mass",
      axis: input.axis,
      stations: stations.map(at),
      front: { positive: signed(c.outlines.anterior, 1), negative: signed(c.outlines.posterior, -1) },
      side: { positive: signed(c.outlines.lateral, 1), negative: signed(c.outlines.lateral, -1) },
      // Quarters by increasing angle from +u (anterior): anterior-right, right-posterior, posterior-left, left-anterior.
      fullness: { kind: "top", shoulders: [shoulder(c.fullness.anterior), shoulder(c.fullness.posterior), shoulder(c.fullness.posterior), shoulder(c.fullness.anterior)] },
      pole: "top",
      order: input.order,
      // Ring samples: at least the reliefs' own phase spacing all around (the
      // sampling rule: a feature edge is sampled at least four times across;
      // the nets' phase spans already follow it, the ring must not be coarser).
      // Whole-ring sampling at the face's spacing costs about 4x the 128-sample
      // loft (render 2026-11-08 10:10: loft 410 ms cold); per-region sampling is
      // a separate engine item after integration.
      samples: Math.max(input.samples, ...c.reliefs.map((r: IAutoMovieLoftRelief): number => 4 * Math.ceil((2 * Math.PI * (r.columns - 3)) / (r.phases[1] - r.phases[0]) / 4))),
    };
    // The reliefs (the jaw) composed into the chain, their stations shifted
    // into the axis frame like the outlines'.
    const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
    const reliefs: IAutoMovieLoftRelief[] = c.reliefs.map((r: IAutoMovieLoftRelief): IAutoMovieLoftRelief => ({ ...r, stations: [at(r.stations[0]), at(r.stations[1])] }));
    return { part, loft: loft.chain === null || reliefs.length === 0 ? loft : { ...loft, chain: { ...loft.chain, reliefs } } };
  }
}
