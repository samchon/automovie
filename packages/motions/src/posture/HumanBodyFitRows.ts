import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanBodyFit } from "./HumanBodyFit";
import { HumanFitBalance } from "./HumanFitBalance";
import type { HumanFloorReading } from "./HumanFloorReading";
import { HumanFoot } from "./HumanFoot";
import { HumanJacobian } from "./HumanJacobian";
import type { HumanQuadraticProgram } from "./HumanQuadraticProgram";

/**
 * The rows of one step of a whole-body fit (`HumanBodyFit`), each with the
 * reading it linearises: the floor's contacts, the targets' points and
 * rotations, the balance's edges and the floor under every collider near
 * it, written in millimetres (milliradians for a rotation) per solved unit
 * from the analytic Jacobian (`HumanJacobian`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what rows a step has, their units and their slopes' source.
 * @evidence contracts/development/design.md#principled-representation A row and the reading it linearises, so the fit can measure how far a trial missed the row's linear model.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reading, the row, the rotation error and one builder, read by the whole-body fit alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The slopes are the shared Jacobian's and the balance's own.
 */
export namespace HumanBodyFitRows {
  /** A posture's reading for a fit, with its balance when the fit keeps one. */
  export type IReading = HumanFloorReading.IReading & {
    balance?: HumanFitBalance.IReading;
  };

  /** A row of a step and the reading it linearises. */
  export interface IRead {
    /** The row. */
    row: HumanQuadraticProgram.IRow;

    /** The reading, metres or radians. */
    f: (r: IReading) => number;
  }

  /** One step's inputs. */
  export interface IStep {
    /** The body. */
    body: IHumanBody;

    /** The reading the step starts from. */
    at: IReading;

    /** The variables' motions there. */
    motions: readonly HumanJacobian.IMotion[];

    /** Each variable's solved unit, in its own. */
    units: readonly number[];

    /** The goals. */
    targets: readonly HumanBodyFit.ITarget[];

    /** The floor's price per millimetre. */
    price: number;

    /** Each bearing part's lowest support candidate at the reading, as indices into its heights (`lowest`): the point the part rests on, re-selected at every reading as the merit's is. */
    touching: readonly number[];
  }

  /** How far a row may miss unpriced, metres (radians for a rotation): half the fit's tolerance. */
  export const BAND: number = 2.5e-4;

  /** The rows are written in millimetres (milliradians). */
  export const MM: number = 1000;

  /** How far above a part's lowest point a support candidate of it still touches the floor, metres: the foot's bearing height (`HumanFoot.BEARING`), the one the base of support and the contact audit read a bearing point by. */
  export const MARGIN: number = HumanFoot.BEARING;

  /**
   * A step's rows, but the floor's under the colliders.
   *
   * @param step The step.
   * @returns The rows of the contacts, the targets and the balance.
   */
  export function of(step: IStep): IRead[] {
    const { at, motions, targets } = step;
    const all: number[] = motions.map(
      (_: HumanJacobian.IMotion, i: number): number => i,
    );
    const rows: IRead[] = [];
    const equal = (
      key: string,
      f: (r: IReading) => number,
      goal: number,
      coef: number[],
      weight: number,
    ): void => {
      const miss: number = (goal - f(at)) * MM;
      rows.push({
        row: {
          key,
          index: all,
          coef,
          l: miss - BAND * MM,
          u: miss + BAND * MM,
          weight,
        },
        f,
      });
    };
    // A part bears on the support candidates the solve holds (`touching`),
    // each a smooth row of its own, so a planted sole bears where it touches
    // and no row follows a least that turns from one point to another.
    for (const c of step.touching)
      equal(
        `touch:${c}`,
        (r: IReading): number => r.heights[c]!,
        0,
        low(step, c),
        step.price,
      );
    targets.forEach((t: HumanBodyFit.ITarget, k: number): void => {
      for (const a of t.axes ?? (["x", "y", "z"] as const))
        equal(
          `${a}:${k}`,
          (r: IReading): number => r.points[k]![a],
          t.goal[a],
          scaled(
            step,
            (m: HumanJacobian.IMotion): number =>
              HumanJacobian.velocity(m, t.bone, at.points[k]!)[a],
          ),
          t.price ?? step.price,
        );
      // A rotation's error falls as the bone turns toward its goal, by the
      // bone's angular velocity.
      if (t.rotation !== undefined)
        for (const a of ["x", "y", "z"] as const)
          equal(
            `r${a}:${k}`,
            (r: IReading): number => -turn(t.rotation!, r.turns[k]!)[a],
            0,
            scaled(
              step,
              (m: HumanJacobian.IMotion): number =>
                HumanJacobian.twist(m, t.bone, at.points[k]!).angular[a],
            ),
            t.price ?? step.price,
          );
      // A planar contact: the contact frame's normal brought parallel to the
      // floor's, its turn about that normal left free, as the turn from the
      // world normal to it held at nought on the two directions across the
      // world normal; the turn grows as the bone turns, by the bone's angular
      // velocity, as a rotation target's does (Bouyarmane and Kheddar 2010;
      // Escande, Kheddar and Miossec 2013). The turn is an angle, so a normal
      // facing away is a half turn off, never a second solution.
      if (t.normal !== undefined)
        across(t.normal.world).forEach(
          (axis: IAutoMovieVector3, j: number): void =>
            equal(
              `n${j}:${k}`,
              (r: IReading): number => Vector3.dot(tilt(t, r.turns[k]!), axis),
              0,
              scaled(step, (m: HumanJacobian.IMotion): number =>
                Vector3.dot(
                  HumanJacobian.twist(m, t.bone, at.points[k]!).angular,
                  axis,
                ),
              ),
              t.price ?? step.price,
            ),
        );
    });
    // The centre of mass inside each edge of the base of support, the edges
    // read where the step starts.
    if (at.balance !== undefined) {
      const outline: { x: number; z: number }[] = at.balance.outline;
      HumanFitBalance.slopes(step.body, at.bones, motions, at.balance).forEach(
        (slope: number[], e: number): void => {
          const inside = (r: IReading): number =>
            HumanFitBalance.distance(outline, e, r.balance!.com);
          rows.push({
            row: {
              key: `balance:${e}`,
              index: all,
              coef: slope.map(
                (v: number, i: number): number => v * step.units[i]! * MM,
              ),
              l: (-inside(at) - BAND) * MM,
              u: Infinity,
              weight: step.price,
            },
            f: inside,
          });
        },
      );
    }
    return rows;
  }

  /**
   * The floor's rows under the support candidates given one: none under the
   * floor.
   *
   * @param step The step.
   * @param rowed The candidates, as indices into the reading's heights.
   * @returns One row per candidate.
   */
  export function floor(step: IStep, rowed: ReadonlySet<number>): IRead[] {
    const all: number[] = step.motions.map(
      (_: HumanJacobian.IMotion, i: number): number => i,
    );
    return [...rowed].map(
      (s: number): IRead => ({
        row: {
          key: `low:${s}`,
          index: all,
          coef: low(step, s),
          l: (-step.at.heights[s]! - BAND) * MM,
          u: Infinity,
          weight: step.price,
        },
        f: (r: IReading): number => r.heights[s]!,
      }),
    );
  }

  /**
   * The rotation vector that turns `current` to `goal`.
   *
   * @param goal The rotation brought to.
   * @param current The rotation now.
   * @returns World radians.
   */
  export function turn(
    goal: IAutoMovieQuaternion,
    current: IAutoMovieQuaternion,
  ): IAutoMovieVector3 {
    const q: IAutoMovieQuaternion = Quaternion.multiply(
      goal,
      Quaternion.inverse(current),
    );
    const sign: number = q.w < 0 ? -1 : 1;
    const v: IAutoMovieVector3 = {
      x: q.x * sign,
      y: q.y * sign,
      z: q.z * sign,
    };
    const sine: number = Vector3.length(v);
    if (sine < 1e-12) return { x: 0, y: 0, z: 0 };
    return Vector3.scale(v, (2 * Math.atan2(sine, Math.abs(q.w))) / sine);
  }

  /**
   * How far a planar contact's normal is turned off its world normal on a
   * posture (`HumanBodyFit.ITarget.normal`): the least turn from the world
   * normal to the contact frame's, a rotation vector across the world normal,
   * a half turn on the first direction across it where the two face apart.
   *
   * @param target The target.
   * @param turn The bone's world rotation.
   * @returns World radians.
   */
  export function tilt(
    target: HumanBodyFit.ITarget,
    turn: IAutoMovieQuaternion,
  ): IAutoMovieVector3 {
    const w: IAutoMovieVector3 = Vector3.normalize(target.normal!.world);
    const n: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(turn, target.normal!.local),
    );
    const axis: IAutoMovieVector3 = Vector3.cross(w, n);
    const sine: number = Vector3.length(axis);
    const angle: number = Math.atan2(sine, Vector3.dot(w, n));
    if (sine < 1e-12) return Vector3.scale(across(w)[0], angle);
    return Vector3.scale(axis, angle / sine);
  }

  /**
   * Two unit directions across a world normal and across each other, the
   * axes a planar contact's normal is held on; built on the world axis least
   * along the normal, so neither degenerates.
   *
   * @param normal The world normal.
   * @returns The two directions.
   */
  export function across(
    normal: IAutoMovieVector3,
  ): [IAutoMovieVector3, IAutoMovieVector3] {
    const n: IAutoMovieVector3 = Vector3.normalize(normal);
    const ax: number = Math.abs(n.x);
    const ay: number = Math.abs(n.y);
    const az: number = Math.abs(n.z);
    const least: IAutoMovieVector3 =
      ax <= ay && ax <= az
        ? { x: 1, y: 0, z: 0 }
        : ay <= az
          ? { x: 0, y: 1, z: 0 }
          : { x: 0, y: 0, z: 1 };
    const u: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(n, least));
    return [u, Vector3.cross(n, u)];
  }

  /**
   * Each bearing part's lowest support candidate at a reading: the point
   * the part rests on, every other candidate of it kept out of the floor.
   *
   * @param r The reading.
   * @returns Indices into the reading's heights, one per bearing part that has a candidate.
   */
  export function lowest(r: IReading): number[] {
    return r.members
      .map((shapes: number[]): number => {
        const mine: Set<number> = new Set(shapes);
        let best: number = -1;
        r.heights.forEach((h: number, c: number): void => {
          if (mine.has(r.of[c]!) && (best < 0 || h < r.heights[best]!))
            best = c;
        });
        return best;
      })
      .filter((c: number): boolean => c >= 0);
  }

  /**
   * What a target misses its rows by at a reading, signed: its point on each
   * of its axes, metres, the turn to its rotation on three axes and the
   * normal's tilt on the two across its world normal, radians; the misses
   * its rows model, in their order.
   *
   * @param target The target.
   * @param r The reading.
   * @param k The target's index in the reading.
   * @returns The misses.
   */
  export function misses(
    target: HumanBodyFit.ITarget,
    r: IReading,
    k: number,
  ): number[] {
    const out: number[] = (target.axes ?? (["x", "y", "z"] as const)).map(
      (a: "x" | "y" | "z"): number => r.points[k]![a] - target.goal[a],
    );
    if (target.rotation !== undefined) {
      const e: IAutoMovieVector3 = turn(target.rotation, r.turns[k]!);
      out.push(e.x, e.y, e.z);
    }
    if (target.normal !== undefined) {
      const e: IAutoMovieVector3 = tilt(target, r.turns[k]!);
      for (const axis of across(target.normal.world))
        out.push(Vector3.dot(e, axis));
    }
    return out;
  }

  /**
   * How far a target misses at a reading, as a law reads it: its point in
   * millimetres over its axes, and its turn in degrees, the rotation's or
   * the normal's.
   *
   * @param target The target.
   * @param r The reading.
   * @param k The target's index in the reading.
   * @returns The point's and the turn's miss.
   */
  export function residual(
    target: HumanBodyFit.ITarget,
    r: IReading,
    k: number,
  ): { point: number; turn: number } {
    const deg = (v: IAutoMovieVector3): number =>
      (Vector3.length(v) * 180) / Math.PI;
    return {
      point:
        Math.hypot(
          ...(target.axes ?? (["x", "y", "z"] as const)).map(
            (a: "x" | "y" | "z"): number => r.points[k]![a] - target.goal[a],
          ),
        ) * MM,
      turn:
        target.rotation !== undefined
          ? deg(turn(target.rotation, r.turns[k]!))
          : target.normal !== undefined
            ? deg(tilt(target, r.turns[k]!))
            : 0,
    };
  }

  /** A slope in millimetres per solved unit from a reading's rate per a variable's own unit. */
  function scaled(
    step: IStep,
    rate: (m: HumanJacobian.IMotion) => number,
  ): number[] {
    return step.motions.map(
      (m: HumanJacobian.IMotion, i: number): number =>
        rate(m) * step.units[i]! * MM,
    );
  }

  /** A support candidate's height's slope: its point's, riding its collider's bone. */
  function low(step: IStep, c: number): number[] {
    return scaled(
      step,
      (m: HumanJacobian.IMotion): number =>
        HumanJacobian.velocity(
          m,
          step.at.owners[step.at.of[c]!]!,
          step.at.spots[c]!,
        ).y,
    );
  }
}
