import {
  IAutoMovieSweep,
  IAutoMovieSweepSection,
  IAutoMovieSweepSurface,
  compileAutoMovieSweep,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_TRUNK_FORM } from "./AUTOMOVIE_HUMAN_TRUNK_FORM";
import { AutoMovieHumanTrunkSweep } from "./AutoMovieHumanTrunkSweep";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { featureAutoMovieHumanTrunk } from "./featureAutoMovieHumanTrunk";
import { profileAutoMovieHumanTrunk } from "./profileAutoMovieHumanTrunk";
import { sectionAutoMovieHumanTrunkCrotch } from "./sectionAutoMovieHumanTrunkCrotch";

/**
 * The measured horizontal torso sweep, from the crotch to the axilla.
 *
 * Every station lies level, as the breadths, depths and tape girths are measured. Above the axilla the neck and shoulder girdle are separate boundaries of the upper trunk's curve network, so this sweep carries no rotated neck plane through the chest. The crotch uses the outer contour of the two thighs and keeps its anterior extent at least that of their shared rings.
 *
 * @param props The trunk frame, measured level profiles and two shared thigh rings
 * @returns The torso sweep, its rows and measured girths, and the pelvic contours in millimetres
 */
export function sweepAutoMovieHumanTrunkBody(props: {
  frame: IAutoMovieHumanTrunkFrame;
  profile: profileAutoMovieHumanTrunk.IProfile;
  thighs: IAutoMovieHumanRingShape[];
}): sweepAutoMovieHumanTrunkBody.IOutput {
  const { frame, profile }: typeof props = props;
  const S: typeof AutoMovieHumanTrunkSweep = AutoMovieHumanTrunkSweep;
  const L: IAutoMovieHumanTrunkFrame.ILevels = frame.levels;
  const levels: number[] = [
    L.crotch,
    ...Array.from(
      { length: STEPS + 1 },
      (_: unknown, k: number): number =>
        L.buttock + ((L.axilla - L.buttock) * k) / STEPS,
    ),
  ];
  const thighFront: number = Math.max(
    ...props.thighs.flatMap((t: IAutoMovieHumanRingShape): number[] =>
      t.positions.map((p: IAutoMovieVector3): number => p.z),
    ),
  );
  const contour: (y: number) => sweepAutoMovieHumanTrunkBody.IContour = (
    y: number,
  ): sweepAutoMovieHumanTrunkBody.IContour => {
    const front: number = Math.max(profile.front(y), thighFront);
    return {
      centre: (front + profile.back(y)) / 2,
      depth: (front - profile.back(y)) / 2,
      half: profile.half(y),
    };
  };
  const crotch: sweepAutoMovieHumanTrunkBody.IContour = contour(L.crotch);
  const stations: Array<{
    centre: IAutoMovieVector3;
    section: IAutoMovieSweepSection;
  }> = levels.map((
    y: number,
    k: number,
  ): { centre: IAutoMovieVector3; section: IAutoMovieSweepSection } => {
    if (k === 0)
      return {
        centre: AutoMovieHumanVector.of(0, y, crotch.centre),
        section: sectionAutoMovieHumanTrunkCrotch({
          depth: crotch.depth,
          half: crotch.half,
          exponent: S.FORK_EXPONENT,
          medial: S.MEDIAL_EXPONENT,
          recess: AUTOMOVIE_HUMAN_TRUNK_FORM.crotch.recess * frame.buttock.depth,
        }),
      };
    const widest: number = profile.widest(y);
    const half: number = profile.half(y);
    const square: { front: number; back: number } = profile.squareness(y);
    return {
      centre: AutoMovieHumanVector.of(0, y, widest),
      section: {
        type: "superellipse",
        right: S.metres(Math.max(20, profile.front(y) - widest)),
        up: S.metres(half),
        left: S.metres(Math.max(20, widest - profile.back(y))),
        down: S.metres(half),
        exponents: [square.front, square.back, square.back, square.front],
      },
    };
  });
  const keys: number[] = [
    L.crotch,
    L.buttock,
    frame.iliocristale.y,
    L.waist,
    L.underbust,
    L.chestPoint,
    L.axilla,
  ];
  const points: IAutoMovieVector3[] = stations.map(
    (s: { centre: IAutoMovieVector3; section: IAutoMovieSweepSection }): IAutoMovieVector3 =>
      S.toMetres(s.centre),
  );
  const ats: number[] = S.chordShares(points);
  const bare: IAutoMovieSweep = {
    spine: { points, normal: { x: 0, y: 0, z: 1 } },
    orientation: "fixed",
    stations: stations.map(
      (
        s: { centre: IAutoMovieVector3; section: IAutoMovieSweepSection },
        k: number,
      ): IAutoMovieSweep.IStation => ({
        at: ats[k]!,
        section: s.section,
        rotation: S.HORIZONTAL,
      }),
    ),
  };
  return {
    sweep: {
      ...bare,
      features: featureAutoMovieHumanTrunk({
        frame,
        profile,
        surface: compileAutoMovieSweep(bare),
      }),
    },
    axilla: 1,
    rows: rowsOf(compileAutoMovieSweep(bare), keys),
    girths: [
      { level: L.waist, girth: frame.waist.girth },
      { level: L.chestPoint, girth: frame.chest.girth },
    ].map(({ level, girth }: { level: number; girth: number }): { row: number; girth: number } => ({
      row: rowOf(keys, level),
      girth,
    })),
    row: (L.buttock - L.crotch) / S.LOWER_ROWS[0]!,
    crotch,
    furrow: contour(L.gluteal),
  };
}
/** Output types of {@link sweepAutoMovieHumanTrunkBody}. */
export namespace sweepAutoMovieHumanTrunkBody {
  /**
   * The trunk's sweep and the parameters its patches and tubes read.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** The sweep, metres. */
    sweep: IAutoMovieSweep;

    /** Spine parameter of the axilla, where the shoulder band opens. */
    axilla: number;

    /** Spine parameters of the rows from the crotch to the axilla, increasing, from 0 to `axilla`: each key level and the even steps `LOWER_ROWS` puts between them. */
    rows: number[];

    /** Each measured girth, millimetres, with the index in `rows` of the row at its level. */
    girths: Array<{ row: number; girth: number }>;

    /** Height of the lowest row, from the crotch to its first step toward the buttock level, millimetres. */
    row: number;

    /** The two thighs' contour at the crotch. */
    crotch: IContour;

    /** The two thighs' contour at the gluteal furrow. */
    furrow: IContour;
  }

  /**
   * The outer contour of the two thighs side by side at one level, millimetres.
   *
   * @author Samchon
   */
  export interface IContour {
    /** Depth of the midline the contour is centred on. */
    centre: number;

    /** Half-depth. */
    depth: number;

    /** Half-breadth across both thighs. */
    half: number;
  }
}

/**
 * The spine parameters of the rows between key levels: each key level's parameter, the levels sorted up the body, and `LOWER_ROWS` even steps of height between consecutive ones, each found where the sweep's spine reaches that height.
 *
 * @param surface The trunk's sweep, compiled
 * @param levels The key levels, millimetres, from the crotch to the axilla
 * @returns The rows' spine parameters, increasing
 */
const rowsOf: (surface: IAutoMovieSweepSurface, levels: number[]) => number[] = (
  surface: IAutoMovieSweepSurface,
  levels: number[],
): number[] => {
  const S: typeof AutoMovieHumanTrunkSweep = AutoMovieHumanTrunkSweep;
  const sorted: number[] = [...levels].sort(
    (a: number, b: number): number => a - b,
  );
  const top: number = surface.frame(1).origin.y * 1000;
  // the spine rises monotonically from the crotch to the axilla, so a height has one parameter there
  const at: (y: number) => number = (y: number): number => {
    let a: number = 0;
    let b: number = 1;
    for (let step: number = 0; step < BISECTIONS; ++step) {
      const middle: number = (a + b) / 2;
      if (Math.min(top, surface.frame(middle).origin.y * 1000) < y) a = middle;
      else b = middle;
    }
    return (a + b) / 2;
  };
  const heights: number[] = [sorted[0]!];
  S.LOWER_ROWS.forEach((count: number, k: number): void => {
    for (let j: number = 1; j <= count; ++j)
      heights.push(sorted[k]! + ((sorted[k + 1]! - sorted[k]!) * j) / count);
  });
  return heights.map((y: number, k: number): number => (k === 0 ? 0 : at(y)));
};

/**
 * The row index of a key level: its rank among the key levels sorted up the body, counted in `LOWER_ROWS` rows.
 *
 * @param keys The key levels, millimetres
 * @param level One of them
 * @returns Its row's index in `rowsOf`'s output
 */
const rowOf: (keys: number[], level: number) => number = (keys: number[], level: number): number => {
  const rank: number = [...keys]
    .sort((a: number, b: number): number => a - b)
    .indexOf(level);
  return AutoMovieHumanTrunkSweep.LOWER_ROWS.slice(0, rank).reduce(
    (sum: number, n: number): number => sum + n,
    0,
  );
};

/** Bisection steps that find a row's spine parameter; each halves the interval. */
const BISECTIONS: number = 40;

/** Steps between the stations from the buttock level to the axilla, about 25 mm each in an adult. */
const STEPS: number = 16;

