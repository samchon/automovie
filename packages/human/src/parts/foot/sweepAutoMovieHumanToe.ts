import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { sweepAutoMovieHumanDigit } from "../sweepAutoMovieHumanDigit";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { interpolateAutoMovieHumanFootProfile } from "./interpolateAutoMovieHumanFootProfile";

/**
 * Sweep one toe along its axis from the base of its free part to its tip, as a digit (`sweepAutoMovieHumanDigit`) whose pad faces the standing surface.
 *
 * The toe runs straight in plan from its metatarsophalangeal joint along its direction; its centre at each station lies halfway between its dorsal and plantar heights there, so the axis rises over the proximal interphalangeal joint, the knuckle of a toe resting slightly flexed, and falls to the tip. Stations sit at the base of the free toe, the interphalangeal joints, the middle phalanx and the distal pad, as fractions of the toe's length from its joint, with the old cage's conventional profiles of height and breadth.
 *
 * @param props The foot's plan and the toe
 * @returns The swept toe, and its axis' centres at their fractions of the toe's length, the last at the tip
 */
export function sweepAutoMovieHumanToe(props: {
  plan: IAutoMovieHumanFootPlan;
  toe: IAutoMovieHumanFootPlan.IToe;
}): sweepAutoMovieHumanToe.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const toe: IAutoMovieHumanFootPlan.IToe = props.toe;
  const L: number = props.plan.length;
  const profile: (p: IAutoMovieHumanFootPlan.IProfile, f: number) => number = (
    p: IAutoMovieHumanFootPlan.IProfile,
    f: number,
  ): number => interpolateAutoMovieHumanFootProfile(p, f);
  const dorsumAt: (f: number) => number = (f: number): number =>
    profile(toe.hallux ? HALLUX_DORSUM : LESSER_DORSUM, f) * toe.height;
  const plantarAt: (f: number) => number = (f: number): number =>
    profile(PLANTAR, f) * L;
  const halfAt: (f: number) => number = (f: number): number =>
    ((profile(HALF_BREADTH, f) / PIP_HALF_BREADTH) * toe.width) / 2;
  const fractions: number[] = [TOE_START, ...TOE_STATIONS, 1];
  const centres: IAutoMovieVector3[] = fractions.map(
    (f: number): IAutoMovieVector3 => {
      const p: IAutoMovieVector3 = V.offset(toe.joint, [
        toe.direction,
        f * toe.length,
      ]);
      const g: number = f === 1 ? TIP : f;
      return V.of(p.x, (dorsumAt(g) + plantarAt(g)) / 2, p.z);
    },
  );
  const out: sweepAutoMovieHumanDigit.IOutput = sweepAutoMovieHumanDigit({
    points: [
      centres[0]!,
      centres[2]!,
      centres[4]!,
      centres[centres.length - 1]!,
    ],
    first: V.of(0, 1, 0),
    pad: Math.PI,
    stations: [TOE_START, ...TOE_STATIONS].map(
      (f: number): sweepAutoMovieHumanDigit.IStation => {
        const middle: number = (dorsumAt(f) + plantarAt(f)) / 2;
        return {
          at: (f - TOE_START) * toe.length,
          breadth: 2 * halfAt(f),
          dorsal: dorsumAt(f) - middle,
          palmar: middle - plantarAt(f),
          square: TOE_SQUARE,
        };
      },
    ),
  });
  return { out, fractions, centres };
}
/** Output type of {@link sweepAutoMovieHumanToe}. */
export namespace sweepAutoMovieHumanToe {
  /**
   * One swept toe.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** The digit sweep, its loop starting at the toe's back. */
    out: sweepAutoMovieHumanDigit.IOutput;

    /** Fractions of the toe's length from its joint where its axis' centres lie, the last 1 at the tip. */
    fractions: number[];

    /** The axis' centre at each fraction, local frame, millimetres. */
    centres: IAutoMovieVector3[];
  }
}

/** Where the toe's sweep starts, of its length from its joint: the old cage's base of the free toe. */
const TOE_START: number = 0.5;

/** The toe's stations after its start: the interphalangeal joints, the middle phalanx and the distal pad. */
const TOE_STATIONS: number[] = [0.62, 0.72, 0.82, 0.91];

/** The fraction whose height the tip takes. */
const TIP: number = 0.975;

/** Superellipse exponent of a toe's section. Conventional. */
const TOE_SQUARE: number = 2.4;

/** The old cage's dorsal heights of a lesser toe and the hallux, of the toe's height, and its plantar heights, of foot length, and half breadths, of the toe's breadth, by fraction of its length; conventional, set against renders. */
const LESSER_DORSUM: IAutoMovieHumanFootPlan.IProfile = [
  [0.5, 1.15],
  [0.62, 1.32],
  [0.72, 1.08],
  [0.82, 0.9],
  [0.91, 0.74],
  [0.975, 0.45],
];
const HALLUX_DORSUM: IAutoMovieHumanFootPlan.IProfile = [
  [0.5, 1.05],
  [0.62, 1.05],
  [0.72, 0.98],
  [0.82, 0.88],
  [0.91, 0.72],
  [0.975, 0.45],
];
const PLANTAR: IAutoMovieHumanFootPlan.IProfile = [
  [0.5, 0.02],
  [0.62, 0.02],
  [0.72, 0.012],
  [0.82, 0.003],
  [0.91, 0],
  [0.975, 0.012],
];
const HALF_BREADTH: IAutoMovieHumanFootPlan.IProfile = [
  [0.5, 0.54],
  [0.62, 0.55],
  [0.72, 0.5],
  [0.82, 0.52],
  [0.91, 0.52],
  [0.975, 0.33],
];

/** Read the breadth scale from the same declared IP station and profile. */
const PIP_HALF_BREADTH: number = interpolateAutoMovieHumanFootProfile(
  HALF_BREADTH,
  TOE_STATIONS[0]!,
);
