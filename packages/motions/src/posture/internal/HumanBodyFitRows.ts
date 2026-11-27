import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanFitGoals,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFitBalance } from "./HumanFitBalance";
import { HumanFitGoals } from "./HumanFitGoals";
import { HumanFitTargets } from "./HumanFitTargets";
import type { HumanFloorReading } from "./HumanFloorReading";
import { HumanFoot } from "./HumanFoot";
import { HumanJacobian } from "./HumanJacobian";

/*
 * A step's rows, but the floor's under the colliders.
 * Parameter step: The step.
 * Returns: The rows of the contacts, the targets and the balance.
 */
export function HumanBodyFitRows(
  step: HumanBodyFitRows.IStep,
): HumanBodyFitRows.IRead[] {
  const { at, motions }: Pick<HumanBodyFitRows.IStep, Of> = step;
  const all: readonly number[] = step.index;
  const rows: HumanBodyFitRows.IRead[] = [];
  const equal: (
    key: string,
    f: (r: HumanBodyFitRows.IReading) => number,
    goal: number,
    coef: number[],
    weight: number | undefined,
    upper?: number,
  ) => void = (
    key: string,
    f: (r: HumanBodyFitRows.IReading) => number,
    goal: number,
    coef: number[],
    weight: number | undefined,
    upper: number = goal,
  ): void => {
    const value: number = f(at);
    const miss: number = (goal - value) * HumanBodyFitRows.MM;

    // A soft equality carries the numerical band. A required contact or a
    // physical interval retains the specified ends (`HumanBodyFitMerit`).
    const band: number =
      weight === undefined || upper > goal ? 0 : HumanBodyFitRows.BAND;
    rows.push({
      row: {
        key,
        index: all,
        coef,
        l: miss - band * HumanBodyFitRows.MM,
        u: (upper - value + band) * HumanBodyFitRows.MM,
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
      (r: HumanBodyFitRows.IReading): number => r.heights[c]!,
      0,
      low(step, c),
      step.price,
    );
  rows.push(...HumanFitTargets.rows(step, equal, HumanBodyFitRows.MM));

  // Centre goals request these at their original post-angle phase; balance
  // then consumes the same completed columns for this unchanged model.
  let massColumns: readonly IAutoMovieVector3[] | undefined;
  const readColumns: (() => readonly IAutoMovieVector3[]) | undefined =
    step.centre === undefined || at.balance === undefined
      ? undefined
      : (): readonly IAutoMovieVector3[] => {
          if (massColumns === undefined)
            massColumns = HumanFitBalance.velocities(
              step.body,
              at.bones,
              motions,
            );
          return massColumns;
        };
  HumanFitGoals.rows(step, equal, HumanBodyFitRows.MM, readColumns);

  // The centre of mass inside each half-plane of the base of support, the
  // half-planes read where the step starts and moved with their corners'
  // bones (`HumanFitBalance.slopes`); a trial is measured on the same
  // half-planes through its own corners (`HumanFitBalance.at`), the
  // function the row linearises.
  if (at.balance !== undefined) {
    const balance: HumanFitBalance.IReading = at.balance;
    HumanFitBalance.slopes(
      step.body,
      at.bones,
      motions,
      at.balance,
      readColumns?.(),
    ).forEach((slope: number[], e: number): void => {
      const inside: (r: HumanBodyFitRows.IReading) => number = (
        r: HumanBodyFitRows.IReading,
      ): number =>
        r === at
          ? balance.inside[e]!
          : HumanFitBalance.at(balance, e, r.bones, r.balance!.com);
      rows.push({
        row: {
          key: `balance:${e}`,
          index: all,
          coef: slope.map(
            (v: number, i: number): number =>
              v * step.units[i]! * HumanBodyFitRows.MM,
          ),
          l: (-inside(at) - HumanBodyFitRows.BAND) * HumanBodyFitRows.MM,
          u: Infinity,
          weight: step.price,
        },
        f: inside,
      });
    });
  }
  return rows;
}

/*
 * The rows of one step of a whole-body fit (`HumanBodyFit`), each with the
 * reading it linearises: the floor's contacts, the targets' points and
 * rotations, included angles, the positional mass centre, the balance's edges
 * and the floor under every collider near it, written in millimetres
 * (milliradians for a rotation) per solved unit from the analytic Jacobian
 * (`HumanJacobian`).
 */
export namespace HumanBodyFitRows {
  /*
   * A posture's reading for a fit, with its balance when the fit keeps one.
   */
  export type IReading = HumanFloorReading.IReading &
    HumanFitGoals.IReading &
    IReading2;

  /*
   * A row of a step and the reading it linearises.
   */
  export interface IRead {
    /*
     * The row.
     */
    row: IAutoMovieMotionHumanQuadraticProgram.IRow;

    /*
     * The row's actual scalar reading, metres or radians, evaluated on the same
     * body quantities that its builder linearised.
     */
    f: (r: IReading) => number;
  }

  /*
   * One step's inputs.
   */
  export interface IStep {
    /*
     * The body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The reading the step starts from.
     */
    at: IReading;

    /*
     * The variables' motions there.
     */
    motions: readonly IAutoMovieMotionHumanJacobian.IMotion[];

    /*
     * Each variable's solved unit, in its own.
     */
    units: readonly number[];

    /*
     * The fixed ordered variable domain [0,n), shared read-only by all dense
     * coefficient rows of this fit.
     */
    index: readonly number[];

    /*
     * The goals.
     */
    targets: readonly IAutoMovieMotionHumanBodyFitTypes.ITarget[];

    /*
     * Geometric included angles held by the same fit.
     */
    angles: readonly IAutoMovieMotionHumanFitGoals.IAngle[];

    /*
     * A positional centre-of-mass goal, if requested.
     */
    centre?: IAutoMovieMotionHumanFitGoals.ICentre;

    /*
     * The floor's price per millimetre.
     */
    price: number;

    /*
     * Each bearing part's lowest support candidate at the reading, as indices
     * into its heights (`lowest`): the point the part rests on, re-selected at
     * every reading as the merit's is.
     */
    touching: readonly number[];
  }

  /*
   * How far a row may miss unpriced, metres (radians for a rotation): half the
   * fit's tolerance.
   */
  export const BAND: number = 2.5e-4;

  /*
   * The rows are written in millimetres (milliradians).
   */
  export const MM: number = 1000;

  /*
   * How far above a part's lowest point a support candidate of it still touches
   * the floor, metres: the foot's bearing height (`HumanFoot.BEARING`), the one
   * the base of support and the contact audit read a bearing point by.
   */
  export const MARGIN: number = HumanFoot.BEARING;

  /*
   * The floor's rows under the support candidates given one: none under the
   * floor.
   * Parameter step: The step.
   * Parameter rowed: The candidates, as indices into the reading's heights.
   * Returns: One row per candidate.
   */
  export function floor(step: IStep, rowed: ReadonlySet<number>): IRead[] {
    const all: readonly number[] = step.index;
    return Array.from(
      rowed,
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

  /*
   * Each bearing part's lowest support candidate at a reading: the point the
   * part rests on, every other candidate of it kept out of the floor.
   * Parameter r: The reading.
   * Returns: Indices into the reading's heights, one per bearing part that has
   * a candidate.
   */
  export function lowest(r: IReading): number[] {
    if (r.members.length === 0) return [];
    if (r.members.length === 1) {
      if (r.members[0] === undefined) return [];
      const mine: Set<number> = new Set(r.members[0]);
      let best: number = -1;
      r.heights.forEach((h: number, c: number): void => {
        if (mine.has(r.of[c]!) && (best < 0 || h < r.heights[best]!)) best = c;
      });
      return best < 0 ? [] : [best];
    }

    // Preserve every part's original candidate order while visiting a
    // candidate only for parts that actually own its shape.
    const owners: Map<number, number[]> = new Map();
    const out: number[] = r.members.map((): number => -1);
    r.members.forEach((shapes: number[], k: number): void => {
      for (const shape of shapes) {
        const parts: number[] | undefined = owners.get(shape);
        if (parts === undefined) owners.set(shape, [k]);
        else if (parts[parts.length - 1] !== k) parts.push(k);
      }
    });
    r.heights.forEach((h: number, c: number): void => {
      const parts: number[] | undefined = owners.get(r.of[c]!);
      if (parts === undefined) return;
      for (const k of parts) {
        const best: number = out[k]!;
        if (best < 0 || h < r.heights[best]!) out[k] = c;
      }
    });
    return out.filter((c: number): boolean => c >= 0);
  }

  /*
   * Signed goal-frame misses, including the excess outside a physical point
   * radius.
   *
   * Uses the physical-radius miss convention of the delegated owner.
   */
  export const misses: typeof HumanFitTargets.misses = HumanFitTargets.misses;

  /*
   * Actual target distance and turn, read by the same owner as the rows.
   *
   * Reports actual distance rather than a radius-subtracted value.
   */
  export const residual: typeof HumanFitTargets.residual =
    HumanFitTargets.residual;
}

/*
 * A slope in millimetres per solved unit from a reading's rate per a variable's
 * own unit.
 */
function scaled(
  step: HumanBodyFitRows.IStep,
  rate: (m: IAutoMovieMotionHumanJacobian.IMotion) => number,
): number[] {
  return step.motions.map(
    (m: IAutoMovieMotionHumanJacobian.IMotion, i: number): number =>
      rate(m) * step.units[i]! * HumanBodyFitRows.MM,
  );
}

/*
 * A support candidate's height's slope: its point's, riding its collider's
 * bone.
 */
function low(step: HumanBodyFitRows.IStep, c: number): number[] {
  return scaled(step, (m: IAutoMovieMotionHumanJacobian.IMotion): number =>
    HumanJacobian.velocityY(
      m,
      step.at.owners[step.at.of[c]!]!,
      step.at.spots[c]!,
    ),
  );
}

/*
 * The alternatives of `Of`'s site.
 */
type Of = "at" | "motions";

/*
 * The record of `IReading2`'s site.
 */
type IReading2 = {
  /*
   * Exact source clinical posture used for this reading's resolution/FK; kept
   * unchanged while current Jacobian and final result consume it.
   */
  written: IAutoMovieMotionHumanPosture;

  /*
   * Requested base-of-support reading on these same bones.
   */
  balance?: HumanFitBalance.IReading;
};
