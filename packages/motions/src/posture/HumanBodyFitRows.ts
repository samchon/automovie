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

/**
 * The rows of one step of a whole-body fit (`HumanBodyFit`), each with the
 * reading it linearises: the floor's contacts, the targets' points and
 * rotations, included angles, the positional mass centre, the balance's edges and the floor under every collider near
 * it, written in millimetres (milliradians for a rotation) per solved unit
 * from the analytic Jacobian (`HumanJacobian`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what rows a step has, their units and their slopes' source.
 * @evidence contracts/development/design.md#principled-representation A row and the reading it linearises, so the fit can measure how far a trial missed the row's linear model.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the reading, annotated rows, contact/floor builders and lowest-candidate selection consumed by the fit and its merit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The slopes are the shared Jacobian's and the balance's own.
 */
export namespace HumanBodyFitRows {
  /**
   * A posture's reading for a fit, with its balance when the fit keeps one.
   *
   * @evidence contracts/development/design.md#principled-representation Combines floor and geometric-goal readings on the same resolved bones with their exact source clinical posture and optional requested balance, in their declared metres, degrees and radians.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fit, merit, goal readers and correction callbacks consume these existing readings; the same written clinical posture feeds current Jacobian projection and transfers to the final posture result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Balance is absent only when not requested, while current floor candidates and goals remain actual readings rather than cached predicted values.
   * @evidence contracts/development/common.md#meaningful-documentation Names the floor, goal and balance owners and the optional balance condition.
   */
  export type IReading = HumanFloorReading.IReading &
    HumanFitGoals.IReading & {
      /** Exact source clinical posture used for this reading's resolution/FK; kept unchanged while current Jacobian and final result consume it. */
      written: IAutoMovieMotionHumanPosture;

      /** Requested base-of-support reading on these same bones. */
      balance?: HumanFitBalance.IReading;
    };

  /**
   * A row of a step and the reading it linearises.
   *
   * @evidence contracts/development/design.md#principled-representation Couples a linear QP row in solved units with its exact scalar geometric reading in metres or radians, which SOC compares on another actual reading.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The QP consumes row and the merit correction consumes f; their existing owners define the numeric row and body reading.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps the actual reading callback instead of treating a linear prediction as physical evidence; input dimensions remain producer premises admitted by the QP.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the scalar reading, linearisation relationship and units.
   */
  export interface IRead {
    /** The row. */
    row: IAutoMovieMotionHumanQuadraticProgram.IRow;

    /**
     * The row's actual scalar reading, metres or radians, evaluated on the
     * same body quantities that its builder linearised.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the actual-reading input, scalar units and relation to the linear row.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature; of, floor and the delegated target/goal builders own each pure geometric calculation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No body is declared here; the owning row builder supplies the callback consumed by SOC.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The signature executes no replacement behavior; the builders define actual geometry rather than linear predictions.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration performs no work; the row builders document their actual measurement and Jacobian costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration shares no computed value; of owns same-at reuse while a supplied callback evaluates its requested reading.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature allocates nothing; its owning model controls the callback and captured geometric-data lifetime.
     */
    f: (r: IReading) => number;
  }

  /**
   * One step's inputs.
   *
   * @evidence contracts/development/design.md#principled-representation Collects the same current body reading, analytic variable motions, unit conversions, requested goals, penalty and selected contact indices used to assemble one linearised model.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contact, floor, target and geometric-goal builders consume these members; touching carries current selected candidates and index supplies the shared actual variable domain to dense rows.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the owning body, Jacobian and target types; matching index/unit/motion lengths and selected-candidate compatibility are producer premises, with every raw QP entry still admitted downstream.
   * @evidence contracts/development/common.md#meaningful-documentation States model inputs, units, penalty and the reading-specific contact selection.
   */
  export interface IStep {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The reading the step starts from. */
    at: IReading;

    /** The variables' motions there. */
    motions: readonly IAutoMovieMotionHumanJacobian.IMotion[];

    /** Each variable's solved unit, in its own. */
    units: readonly number[];

    /** The fixed ordered variable domain [0,n), shared read-only by all dense coefficient rows of this fit. */
    index: readonly number[];

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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Linearises actual selected floor contacts, effector/geometric goals and the base-of-support inequalities using their owning analytic Jacobians, preserving the common l1 prices and numerical band.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One equality builder serves contact and goal rows; targets and balance retain their own measurement and derivative owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps existing goal tolerances, prices, contact multiplicity and frozen base outline; no missing physical row is replaced with a numerical success flag.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds the delegated goal and Jacobian costs and O(n*R) coefficient storage for R rows over n variables; one pure f(at) value now supplies both interval ends.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares variable indices and each pure f(at) value; when both centre and balance exist, a lazy same-body/bones/motions producer computes their mass Jacobian once at the original post-angle phase, and a new model rebuilds its current slopes.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns owned row coefficients and geometric-reading callbacks for the model lifetime; no model or reading is stored globally.
   * @evidence contracts/development/common.md#meaningful-documentation Defines included row families, solved-unit slopes, pure reading reuse, contact multiplicity and delegated ownership.
   */
  export function of(step: IStep): IRead[] {
    const { at, motions }: Pick<IStep, "at" | "motions"> = step;
    const all: readonly number[] = step.index;
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
      const value: number = f(at);
      const miss: number = (goal - value) * MM;
      rows.push({
        row: {
          key,
          index: all,
          coef,
          l: miss - BAND * MM,
          u: (upper - value + BAND) * MM,
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
    HumanFitGoals.rows(step, equal, MM, readColumns);

    // The centre of mass inside each half-plane of the base of support, the
    // half-planes read where the step starts.
    if (at.balance !== undefined) {
      const balance: HumanFitBalance.IReading = at.balance;
      const anchors: { x: number; z: number }[] = balance.anchors;
      HumanFitBalance.slopes(
        step.body,
        at.bones,
        motions,
        at.balance,
        readColumns?.(),
      ).forEach((slope: number[], e: number): void => {
        const inside: (r: IReading) => number = (r: IReading): number =>
          r === at
            ? balance.inside[e]!
            : HumanFitBalance.distance(
                anchors,
                e,
                r.balance!.com,
                balance.normals[e]!,
              );
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
      });
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each selected candidate gets its current floor-height linearisation, lower bounded by the existing numerical band, using rigid-point analytic velocities.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Array.from maps the supplied candidate set directly into its rows without a separate spread-copy array.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves set iteration order, row keys, height, band and price; it does not alter which candidates the fit selected.
   * @evidence contracts/development/implementation.md#efficient-algorithms For F selected candidates and n variables, performs F*n velocity queries and stores O(F*n) coefficients, with one output array and a shared n-entry index array.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the existing posed reading and motions, sharing the variable-index array while recomputing each candidate's current derivative.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned rows own coefficients, borrow the fit's read-only variable indices and capture only their candidate index; rows are released with the model and shared indices with the fit.
   * @evidence contracts/development/common.md#meaningful-documentation States candidate indexing, order, units, lower-bound convention and row ownership.
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

  /**
   * Each bearing part's lowest support candidate at a reading: the point
   * the part rests on, every other candidate of it kept out of the floor.
   *
   * @param r The reading.
   * @returns Indices into the reading's heights, one per bearing part that has a candidate.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Selects each part's minimum candidate with the existing strict less-than comparison in original candidate order, preserving first ties, overlapping parts and nonfinite comparison behavior.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Empty and single-part inputs need no reverse index; multiple parts build shape-to-part membership once, then one candidate sweep updates only owning parts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves duplicate-membership Set semantics and repeated output indices for overlapping parts; no physical cutoff or absent-candidate replacement is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms With B parts, M memberships, C candidates and V matching candidate-part visits, takes O(B+M+C+V) time and O(B+M) temporary storage; complete overlap still permits V=B*C and speed is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads each candidate once in the multi-part sweep and shares its height across matching parts; consumers may carry this result only with the same unchanged reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no reading or reverse index after the call and returns a newly owned list of at most B selected indices.
   * @evidence contracts/development/common.md#meaningful-documentation Defines membership, candidate order, tie and duplicate semantics, missing candidates, costs and result lifetime.
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

  /** Signed goal-frame misses, including the excess outside a physical point radius.
   *
   * Uses the physical-radius miss convention of the delegated owner.
   */
  export const misses: typeof HumanFitTargets.misses = HumanFitTargets.misses;

  /** Actual target distance and turn, read by the same owner as the rows.
   *
   * Reports actual distance rather than a radius-subtracted value.
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
    return scaled(step, (m: IAutoMovieMotionHumanJacobian.IMotion): number =>
      HumanJacobian.velocityY(
        m,
        step.at.owners[step.at.of[c]!]!,
        step.at.spots[c]!,
      ),
    );
  }
}
