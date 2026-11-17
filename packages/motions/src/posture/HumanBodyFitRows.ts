import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanBodyFitTypes, IAutoMovieMotionHumanFitGoals, IAutoMovieMotionHumanJacobian, IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import { HumanFitBalance } from "./HumanFitBalance";
import { HumanFitGoals } from "./HumanFitGoals";
import { HumanFitTargets } from "./HumanFitTargets";
import type { HumanFloorReading } from "./HumanFloorReading";
import { HumanFoot } from "./HumanFoot";
import { HumanJacobian } from "./HumanJacobian";

/**
 * The rows of one step of a whole-body fit (`HumanBodyFit`), each with the
 * reading it linearises: the floor's contacts, the targets' points and
 * rotations, included angles, the positional mass centre, the balance's edges and the floor under every collider near
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
  export type IReading = HumanFloorReading.IReading &
    HumanFitGoals.IReading & {
      balance?: HumanFitBalance.IReading;
    };

  /** A row of a step and the reading it linearises. */
  export interface IRead {
    /** The row. */
    row: IAutoMovieMotionHumanQuadraticProgram.IRow;

    /** The reading, metres or radians. */
    f: (r: IReading) => number;
  }

  /** One step's inputs. */
  export interface IStep {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The reading the step starts from. */
    at: IReading;

    /** The variables' motions there. */
    motions: readonly IAutoMovieMotionHumanJacobian.IMotion[];

    /** Each variable's solved unit, in its own. */
    units: readonly number[];

    /** The goals. */
    targets: readonly IAutoMovieMotionHumanBodyFitTypes.ITarget[];

    /** Geometric included angles held by the same fit. */
    angles: readonly IAutoMovieMotionHumanFitGoals.IAngle[];

    /** A positional centre-of-mass goal, if requested. */
    centre?: IAutoMovieMotionHumanFitGoals.ICentre;

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
    const { at, motions }: Pick<IStep, "at" | "motions"> = step;
    const all: number[] = motions.map(
      (_: IAutoMovieMotionHumanJacobian.IMotion, i: number): number => i,
    );
    const rows: IRead[] = [];
    const equal: (
      key: string,
      f: (r: IReading) => number,
      goal: number,
      coef: number[],
      weight: number,
      upper?: number,
    ) => void = (
      key: string,
      f: (r: IReading) => number,
      goal: number,
      coef: number[],
      weight: number,
      upper: number = goal,
    ): void => {
      const miss: number = (goal - f(at)) * MM;
      rows.push({
        row: {
          key,
          index: all,
          coef,
          l: miss - BAND * MM,
          u: (upper - f(at) + BAND) * MM,
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
    rows.push(...HumanFitTargets.rows(step, equal, MM));
    HumanFitGoals.rows(step, equal, MM);

    // The centre of mass inside each edge of the base of support, the edges
    // read where the step starts.
    if (at.balance !== undefined) {
      const outline: { x: number; z: number }[] = at.balance.outline;
      HumanFitBalance.slopes(step.body, at.bones, motions, at.balance).forEach(
        (slope: number[], e: number): void => {
          const inside: (r: IReading) => number = (r: IReading): number =>
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
      (_: IAutoMovieMotionHumanJacobian.IMotion, i: number): number => i,
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

  /** Rotation-error owner, retained under the existing public name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the single numerical owner and this preserved alias.
   */
  export const turn: typeof HumanFitTargets.turn = HumanFitTargets.turn;

  /** Planar-normal error owner, retained under the existing public name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the single normal-error owner and preserved name.
   */
  export const tilt: typeof HumanFitTargets.tilt = HumanFitTargets.tilt;

  /** Transverse-frame owner, retained under the existing public name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the shared transverse-frame owner and preserved name.
   */
  export const across: typeof HumanFitTargets.across = HumanFitTargets.across;

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

  /** Signed goal-frame misses, including the excess outside a physical point radius.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names units and the physical-radius miss convention of the delegated owner.
   */
  export const misses: typeof HumanFitTargets.misses = HumanFitTargets.misses;

  /** Actual target distance and turn, read by the same owner as the rows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies actual distance rather than a radius-subtracted value.
   */
  export const residual: typeof HumanFitTargets.residual =
    HumanFitTargets.residual;

  /** A slope in millimetres per solved unit from a reading's rate per a variable's own unit. */
  function scaled(
    step: IStep,
    rate: (m: IAutoMovieMotionHumanJacobian.IMotion) => number,
  ): number[] {
    return step.motions.map(
      (m: IAutoMovieMotionHumanJacobian.IMotion, i: number): number =>
        rate(m) * step.units[i]! * MM,
    );
  }

  /** A support candidate's height's slope: its point's, riding its collider's bone. */
  function low(step: IStep, c: number): number[] {
    return scaled(
      step,
      (m: IAutoMovieMotionHumanJacobian.IMotion): number =>
        HumanJacobian.velocity(
          m,
          step.at.owners[step.at.of[c]!]!,
          step.at.spots[c]!,
        ).y,
    );
  }
}
