import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHead } from "../../compose/internal/AutoMovieMotionHumanHead";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { kiss } from "./kiss";
import { kissPose } from "./kissPose";

/**
 * How a resting head is aimed at a point: the kiss's lean from the hips and
 * neck flexion (`kissPose`) with a side bend shared over the neck and the head,
 * scored by the distance of the head's own region to the point. `solve` finds
 * the angles once by a coordinate search (the forward and the side lean on a
 * coarse grid, then the forward lean and the neck on a grid and the side lean
 * and the side bend on lines, the round repeated); `follow` then keeps the
 * region on a moving point at each second with one damped least-squares step on
 * the region's Jacobian at the solution (Wampler 1986; Buss 2004, "Introduction
 * to inverse kinematics with Jacobian transpose, pseudoinverse and damped least
 * squares methods"), the correction a held contact needs as the partner
 * breathes or turns.
 */
export namespace headRestAim {
  /**
   * The most the neck and the head bend to a side together, degrees
   * (provisional: about the cervical lateral flexion of a healthy adult, 40 to
   * 45 degrees).
   */
  export const TILT: number = 40;

  /**
   * The most a seated trunk leans to a side, degrees: the normal thoracolumbar
   * lateral flexion range, 25 degrees (Physiopedia, Range of Motion Normative
   * Values, https://www.physio-pedia.com/Range_of_Motion_Normative_Values),
   * since a seated trunk bends at the spine over the pelvis the seat holds;
   * standing, the planted hips bound it to the kiss's `ROLL`.
   */
  export const SEATED: number = 25;

  /**
   * The damping of the least-squares step, metres per degree (provisional: a
   * tenth of the head's typical 10 mm per degree).
   */
  export const DAMPING: number = 0.001;

  /** One aim: the kiss's lean and neck flexion, and the head's side bend. */
  export interface ISolved extends IAutoMovieMotionHumanKiss.ISolved {
    /** The side bend shared over the neck and the head, degrees. */
    tilt: number;
  }

  /** A prepared aim for one body, entry and region. */
  export interface IAim {
    /** The posture an aim writes at its full share. */
    posed(s: ISolved): IAutoMovieMotionHumanPosture;

    /** The angles that bring the region nearest a point, with the miss. */
    solve(at: IAutoMovieVector3): ISolved;

    /**
     * The angles that move a solved aim's region onto a moving point, with the
     * miss.
     */
    follow(solved: ISolved): (to: IAutoMovieVector3) => ISolved;
  }

  /**
   * Prepare the aim of one head region.
   *
   * @param body The body.
   * @param entry The entry posture.
   * @param stance Both feet as they stand.
   * @param seated Whether a seat bears the body.
   * @param own The head's region aimed.
   * @returns The posture model, the solve and the follower.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanPosture,
    stance: IAutoMovieMotionHumanRise.Stance,
    seated: boolean,
    own: AutoMovieHumanoidRegion,
  ): IAim {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const leaned: ReturnType<typeof kissPose> = kissPose(
      body,
      entry,
      stance,
      0,
      seated,
    );
    const point: ReturnType<typeof HumanTrunk.preparePoint> =
      HumanTrunk.preparePoint(body, own);
    const posed: (s: ISolved) => IAutoMovieMotionHumanPosture = (
      s: ISolved,
    ): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = leaned(s);
      const bend: IAutoMovieMotionHumanJoints.Angles =
        AutoMovieMotionHumanHead.share(1, s.tilt);
      const add: (bone: PosedAddBone) => readonly [number, number, number] = (
        bone: PosedAddBone2,
      ): readonly [number, number, number] => {
        const held: readonly [number, number, number] = posture.joints[
          bone
        ] ?? [0, 0, 0];
        return [held[0], held[1] + bend[bone]![1], held[2]];
      };
      return {
        ...posture,
        joints: { ...posture.joints, neck: add("neck"), head: add("head") },
      };
    };
    const region: (s: ISolved) => IAutoMovieVector3 = (
      s: ISolved,
    ): IAutoMovieVector3 => point(posed(s), resolution);
    const side: number = seated ? SEATED : kiss.ROLL;
    return {
      posed,
      solve: (at: IAutoMovieVector3): ISolved => search(region, at, side),
      follow: (solved: ISolved): ((to: IAutoMovieVector3) => ISolved) => {
        const base: IAutoMovieVector3 = region(solved);
        const columns: IAutoMovieVector3[] = [0, 1, 2, 3].map(
          (k: number): IAutoMovieVector3 =>
            Vector3.subtract(region(nudged(solved, k, 1)), base),
        );
        return (to: IAutoMovieVector3): ISolved => {
          const moved: ISolved = clamp(
            stepped(solved, columns, Vector3.subtract(to, base)),
            side,
          );
          return { ...moved, miss: Vector3.distance(region(moved), to) };
        };
      },
    };
  }

  /**
   * The coordinate search: the sagittal grid, the side lean, the side bend,
   * then the grid and the bend again.
   */
  function search(
    region: (s: ISolved) => IAutoMovieVector3,
    at: IAutoMovieVector3,
    side: number,
  ): ISolved {
    // Every candidate is held within the ranges before it is scored.
    const scored: (s: ISolved) => ISolved = (s: ISolved): ISolved => {
      const held: ISolved = clamp(s, side);
      return { ...held, miss: Vector3.distance(region(held), at) };
    };
    const least: (candidates: readonly ISolved[]) => ISolved = (
      candidates: readonly ISolved[],
    ): ISolved =>
      candidates
        .map(scored)
        .reduce((a: ISolved, b: ISolved): ISolved => (b.miss < a.miss ? b : a));
    const span: (from: number, to: number, step: number) => number[] = (
      from: number,
      to: number,
      step: number,
    ): number[] => {
      const out: number[] = [];
      for (let v: number = from; v <= to + 1e-9; v += step) out.push(v);
      return out;
    };
    const sagittal: (s: ISolved) => ISolved = (s: ISolved): ISolved => {
      const coarse: ISolved = least([
        s,
        ...span(-10, 45, 5).flatMap((pitch: number): ISolved[] =>
          span(-30, 45, 5).map(
            (flexion: number): ISolved => ({ ...s, pitch, flexion }),
          ),
        ),
      ]);
      return least([
        coarse,
        ...span(coarse.pitch - 4, coarse.pitch + 4, 1).flatMap(
          (pitch: number): ISolved[] =>
            span(coarse.flexion - 4, coarse.flexion + 4, 1).map(
              (flexion: number): ISolved => ({ ...coarse, pitch, flexion }),
            ),
        ),
      ]);
    };
    const lateral: (s: ISolved) => ISolved = (s: ISolved): ISolved =>
      least([
        s,
        ...span(-TILT, TILT, 2).map(
          (tilt: number): ISolved => ({ ...s, tilt }),
        ),
      ]);
    const leaning: (s: ISolved) => ISolved = (s: ISolved): ISolved =>
      least([
        s,
        ...span(-side, side, 1).map(
          (roll: number): ISolved => ({ ...s, roll }),
        ),
      ]);
    // The forward and the side lean together on a coarse grid first, so the
    // search does not settle on a forward lean that a side lean would beat.
    const neutral: ISolved = {
      pitch: 0,
      roll: 0,
      flexion: 0,
      raise: 0,
      tilt: 0,
      miss: Infinity,
    };
    let best: ISolved = least(
      span(-10, 45, 5).flatMap((pitch: number): ISolved[] =>
        span(-side, side, 5).map(
          (roll: number): ISolved => ({ ...neutral, pitch, roll }),
        ),
      ),
    );
    best = lateral(leaning(sagittal(lateral(best))));
    best = lateral(leaning(sagittal(best)));
    return lateral(leaning(sagittal(best)));
  }

  /** One angle moved by a number of degrees. */
  function nudged(s: ISolved, k: number, degrees: number): ISolved {
    const a: Angles = angles(s);
    const v: number[] = a.map(
      (x: number, i: number): number => x + (i === k ? degrees : 0),
    );
    return withAngles(s, [v[0]!, v[1]!, v[2]!, v[3]!]);
  }

  /**
   * The damped least-squares step `J^T (J J^T + λ² I)^-1 e` on the degree
   * columns.
   */
  function stepped(
    s: ISolved,
    columns: readonly IAutoMovieVector3[],
    error: IAutoMovieVector3,
  ): ISolved {
    const row: (v: IAutoMovieVector3) => Triple = (
      v: IAutoMovieVector3,
    ): Triple => [v.x, v.y, v.z];
    const J: readonly Triple[] = columns.map(row);
    const m: number[][] = [0, 1, 2].map((i: number): number[] =>
      [0, 1, 2].map(
        (j: number): number =>
          J.reduce((sum: number, c: Triple): number => sum + c[i]! * c[j]!, 0) +
          (i === j ? DAMPING * DAMPING : 0),
      ),
    );
    const y: Triple = solve3(m, row(error));
    const a: Angles = angles(s);
    const v: number[] = a.map(
      (x: number, k: number): number =>
        x + J[k]![0] * y[0] + J[k]![1] * y[1] + J[k]![2] * y[2],
    );
    return withAngles(s, [v[0]!, v[1]!, v[2]!, v[3]!]);
  }

  /** Cramer's rule for a symmetric positive definite 3 by 3 system. */
  function solve3(m: number[][], b: Triple): Triple {
    const det: (a: number[][]) => number = (a: number[][]): number =>
      a[0]![0]! * (a[1]![1]! * a[2]![2]! - a[1]![2]! * a[2]![1]!) -
      a[0]![1]! * (a[1]![0]! * a[2]![2]! - a[1]![2]! * a[2]![0]!) +
      a[0]![2]! * (a[1]![0]! * a[2]![1]! - a[1]![1]! * a[2]![0]!);
    const d: number = det(m);
    const column: (k: number) => number[][] = (k: number): number[][] =>
      m.map((r: number[], i: number): number[] =>
        r.map((v: number, j: number): number => (j === k ? b[i]! : v)),
      );
    return [det(column(0)) / d, det(column(1)) / d, det(column(2)) / d];
  }

  /** The aim's four angles. */
  function angles(s: ISolved): Angles {
    return [s.pitch, s.roll, s.flexion, s.tilt];
  }

  /** An aim with four angles replaced. */
  function withAngles(s: ISolved, a: Angles): ISolved {
    return { ...s, pitch: a[0], roll: a[1], flexion: a[2], tilt: a[3] };
  }

  /** The angles held within the lean's, the neck's and the side bend's ranges. */
  function clamp(s: ISolved, side: number): ISolved {
    const within: (v: number, lo: number, hi: number) => number = (
      v: number,
      lo: number,
      hi: number,
    ): number => Math.min(hi, Math.max(lo, v));
    return {
      ...s,
      pitch: within(s.pitch, -10, 45),
      roll: within(s.roll, -side, side),
      flexion: within(s.flexion, -30, 45),
      tilt: within(s.tilt, -TILT, TILT),
    };
  }
}

/**
 * The four angles a resting head is aimed by, in order: forward lean, side
 * lean, neck flexion, side bend.
 */
type Angles = readonly [number, number, number, number];
/** A three-vector as components, or a row of the 3 by 3 system. */
type Triple = readonly [number, number, number];

/** The alternatives of `PosedAddBone2`'s site. */
type PosedAddBone2 = "neck" | "head";

/** The alternatives of `PosedAddBone`'s site. */
type PosedAddBone = "neck" | "head";
