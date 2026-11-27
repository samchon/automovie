import { Quaternion, Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryJacobians as J } from "./HumanArmTrajectoryJacobians";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import type { HumanArmTrajectorySweep } from "./HumanArmTrajectorySweep";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/** The record of `IOfArmRowsItem`'s site. */
type IOfArmRowsItem = { coef: number[]; gain: number };

/**
 * The detour that lays a transport of an arms' course clear of the body
 * (`HumanArmTrajectoryLaid`): where the course's reading finds an arm's probe
 * inside a shape past what the admission allows, or a corner of the body inside
 * an arm's collider, the least change of that arm's coordinates that brings
 * every pair of that waypoint to its bound, by the pairs' own linearisation
 * (the convex subproblem's rows, `HumanArmTrajectoryConvex`: a pair's distance
 * along its normal on the point Jacobian), and the change laid over the
 * transport as a smooth bump of its path's share, whole at the waypoint's share
 * and nothing at either end, so the transport's ends and its hold stay as they
 * were. A via configuration on a blended path is how a planner lays a path
 * round an obstacle without optimising it (the approach and retreat of a
 * reach); its place and its size here are the reading's own.
 */
export namespace HumanArmTrajectoryClear {
  /** A change of a transport's path laid as a bump. */
  export interface IDetour {
    /** The share of the transport's path the change is whole at, in (0, 1). */
    share: number;

    /**
     * Each arm's change of coordinates there, the model's units; zeros for an
     * arm left as it is.
     */
    delta: number[][];

    /**
     * How far past what the admission allows the pair or the sweep the detour
     * answers lay before it, millimetres.
     */
    depth: number;
  }

  /**
   * The largest change of any coordinate a transport's first detour makes,
   * coordinate units: the arm optimiser's first trust region
   * (`HumanArmOptimiser`'s schedule), inside which the pairs' linearisation is
   * trusted.
   */
  export const REGION: number = 8;

  /**
   * The widest region a detour may grow to, coordinate units: the arm
   * optimiser's widest (`HumanArmOptimiser`'s schedule).
   */
  export const WIDEST: number = 32;

  /**
   * The factor a transport's region grows by after a detour that made it
   * shallower: TrajOpt's trust_expand_ratio, the arm optimiser's own.
   */
  export const EXPAND: number = 1.5;

  /**
   * The detour of a transport's deepest waypoint, none where every pair of
   * every waypoint inside the transport is within what the admission allows.
   *
   * @param c The course's context.
   * @param x The course's coordinates, each arm at each waypoint.
   * @param at Their reading (`M.evaluate`).
   * @param from The transport's first waypoint.
   * @param to Its last waypoint.
   * @param shares The share of its path each waypoint of the transport stands
   *   at, by waypoint.
   * @param region The largest change of any coordinate the detour may make,
   *   coordinate units.
   * @returns Each arm's detour, at its own deepest waypoint; none for an arm
   *   whose every pair and sweep inside the transport lies within what the
   *   admission allows.
   */
  export function detour(
    c: M.IContext,
    x: readonly (readonly number[])[][],
    at: M.IEvaluation,
    from: number,
    to: number,
    shares: readonly number[],
    region: number,
  ): IDetour[] {
    // Each arm is laid round its own deepest waypoint: two arms of one
    // transport (a choke's two hands) each meet their own shapes, and a
    // detour of one arm alone leaves the other's depth as it was.
    const out: IDetour[] = [];
    x.forEach((_: readonly (readonly number[])[], arm: number): void => {
      const detour: IDetour | undefined = ofArm(
        c,
        x,
        at,
        arm,
        from,
        to,
        shares,
        region,
      );
      if (detour !== undefined) out.push(detour);
    });
    return out;
  }

  /**
   * One arm's detour of a transport (`detour`): its deepest waypoint's change,
   * none where it lies within what the admission allows.
   */
  function ofArm(
    c: M.IContext,
    x: readonly (readonly number[])[][],
    at: M.IEvaluation,
    arm: number,
    from: number,
    to: number,
    shares: readonly number[],
    region: number,
  ): IDetour | undefined {
    // The arm's deepest pair inside the transport past what the admission
    // allows: a waypoint's pair past the skin's slack (`T.SKIN`), or an
    // interval's sweep past its bound (a sweep has no slack), read at the
    // interval's inner end. `excess` is how far past the admission it lies.
    let waypoint: number = -1;
    let excess: number = M.TOLERANCE;
    let deepest: number = 0;
    let swept: ISweptRow | undefined;
    {
      const a: number = arm;
      for (let k: number = from; k < to; ++k) {
        const pairs: M.IEvaluation["pairs"][number][number] | undefined =
          at.pairs[a]?.[k];
        if (k > from && pairs !== undefined)
          for (const pair of [
            ...pairs.deepest.values(),
            ...pairs.embedded.values(),
          ])
            if (!pair.rested && pair.short - T.SKIN > excess) {
              excess = pair.short - T.SKIN;
              deepest = pair.short;
              waypoint = k;
              swept = undefined;
            }
        // A sweep of the interval from waypoint `k` spans its own frame step
        // (`from` to `other`), read in the shape's frame at `k`; its row is
        // made at the step's later end where that lies inside the transport.
        for (const sweep of at.swept[a]?.[k] ?? []) {
          const short: number = 1000 * (sweep.lower - sweep.clear);
          if (short <= excess) continue;
          const later: boolean = sweep.other < to;
          excess = short;
          deepest = short;
          waypoint = later ? sweep.other : sweep.from;
          swept = { sweep, later, read: k };
        }
      }
    }
    if (waypoint < 0 || !M.inner(c, waypoint)) return undefined;

    // Each pair near its bound there, a row: the change of its distance by
    // a change of the arm's coordinates, millimetres per unit, and what the
    // distance must gain to reach its bound less the tolerance. Only this
    // waypoint's Jacobian is read, so only it is made (`J.waypoint`), held
    // where `J.carried` reads it.
    const jac: J.IJacobian = J.waypoint(c, x, at, arm, waypoint);
    const all: J.IJacobian[][] = [];
    all[arm] = [];
    all[arm]![waypoint] = jac;
    const frame: IAutoMovieMotionHumanArmGeometry.IFrame =
      c.frames[arm]![waypoint]!;
    const placed: IAutoMovieMotionHumanArmGeometry.IPlaced =
      at.placed[arm]![waypoint]!;
    const pairs: NonNullable<M.IEvaluation["pairs"][number][number]> =
      at.pairs[arm]![waypoint]!;
    const rows: IOfArmRowsItem[] = [];

    // A sweep's row at its inner end: the shape's normal at that end of the
    // swept probe, read in the shape's frame at the interval's first
    // waypoint, where the sweep's ends are carried, and turned back into
    // that end's own frame, on the end's own Jacobian.
    if (swept !== undefined) {
      const { sweep, later, read } = swept;
      const start: IAutoMovieMotionHumanArmGeometry.IFrame =
        c.frames[arm]![read]!;
      const end: IAutoMovieVector3 = later ? sweep.to : sweep.start;
      const normal: IAutoMovieVector3 = S.normal(start, sweep.shape, end);
      const g: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(later ? sweep.turn : sweep.first),
        normal,
      );
      rows.push({
        coef: jac
          .probe(sweep.probe)
          .map((v: IAutoMovieVector3): number => Vector3.dot(v, g)),
        gain: deepest + M.TOLERANCE,
      });
    }
    // A declared rest is drawn to its contact, not cleared of it.
    for (const pair of pairs.deepest.values()) {
      if (pair.rested || pair.short < -M.TOLERANCE) continue;
      const g: IAutoMovieVector3 = S.normal(
        frame,
        pair.shape,
        placed.probes[pair.probe]![0],
      );
      rows.push({
        coef: jac
          .probe(pair.probe)
          .map((v: IAutoMovieVector3): number => Vector3.dot(v, g)),
        gain: pair.short + M.TOLERANCE,
      });
    }
    for (const pair of pairs.embedded.values()) {
      if (pair.rested || pair.short < -M.TOLERANCE) continue;
      const p: IAutoMovieVector3 = frame.body[pair.corner]!.point;
      const g: IAutoMovieVector3 = AutoMovieEnginePhysics.physicalShapeNormal(
        pair.shape.pose,
        pair.shape.shape,
        p,
        Vector3.normalize(Vector3.subtract(p, pair.shape.centre)),
      );
      rows.push({
        coef: J.carried(at, all, arm, waypoint, pair.owner, p).map(
          (v: IAutoMovieVector3): number => -Vector3.dot(v, g),
        ),
        gain: pair.short + M.TOLERANCE,
      });
    }
    const step: number[] | undefined = least(rows, region);
    if (step === undefined) return undefined;
    const delta: number[][] = x.map(
      (own: readonly (readonly number[])[]): number[] =>
        new Array<number>(own[0]!.length).fill(0),
    );
    c.free[arm]!.forEach((d: number, f: number): void => {
      delta[arm]![d] = step[f]!;
    });
    return { share: shares[waypoint]!, delta, depth: excess };
  }

  /**
   * A detour's weight at a share of the path: 1 at its own share, 0 at both
   * ends, a cubic ease (`3u^2 - 2u^3`) on each side, so the path leaves and
   * meets its ends and the detour's peak with no step in its slope.
   *
   * @param share The path's share.
   * @param at The detour's share.
   * @returns The weight in [0, 1].
   */
  export function bump(share: number, at: number): number {
    if (!(share > 0 && share < 1)) return 0;
    const u: number = share <= at ? share / at : (1 - share) / (1 - at);
    return u * u * (3 - 2 * u);
  }
}
/** The record of `ILeastRow`'s site. */
type ILeastRow = { coef: number[] };

/** The record of `ILeastYRow`'s site. */
type ILeastYRow = { gain: number };

/** The record of `ILeastGramQ`'s site. */
type ILeastGramQ = { coef: number[] };

/** The record of `ILeastGramP`'s site. */
type ILeastGramP = { coef: number[] };

/** The record of `ILeastChosenRow`'s site. */
type ILeastChosenRow = { coef: number[]; gain: number };

/** The record of `ILeastChosenItem`'s site. */
type ILeastChosenItem = { coef: number[]; gain: number };

/** The record of `ILeastRowsItem`'s site. */
type ILeastRowsItem = { coef: number[]; gain: number };

/**
 * The change meeting the rows that need a gain, by damped least squares
 * (Wampler 1986, IEEE Trans SMC 16:93; Nakamura and Hanafusa 1986, J Dyn Syst
 * Meas Control 108:163): `A' (A A' + lambda^2 I)^-1 gain`, the damping a share
 * of the strongest row's own (`DAMPING`), so a row nearly insensitive to every
 * coordinate cannot ask an unbounded change; and the change held inside a
 * region, where the rows' linearisation is trusted, the next round meeting what
 * is left.
 */
function least(
  rows: readonly ILeastRowsItem[],
  region: number,
): number[] | undefined {
  const chosen: ILeastChosenItem[] = rows.filter(
    (row: ILeastChosenRow): boolean => row.gain > 0,
  );
  if (chosen.length === 0) return undefined;
  const size: number = chosen[0]!.coef.length;
  const gram: number[][] = chosen.map((p: ILeastGramP): number[] =>
    chosen.map((q: ILeastGramQ): number =>
      p.coef.reduce(
        (s: number, v: number, d: number): number => s + v * q.coef[d]!,
        0,
      ),
    ),
  );
  const strongest: number = Math.max(
    ...gram.map((row: number[], i: number): number => row[i]!),
  );
  if (!(strongest > 0)) return undefined;
  gram.forEach((row: number[], i: number): void => {
    row[i]! += DAMPING * strongest;
  });
  const y: number[] | undefined = solve(
    gram,
    chosen.map((row: ILeastYRow): number => row.gain),
  );
  if (y === undefined) return undefined;
  const step: number[] = new Array<number>(size).fill(0);
  chosen.forEach((row: ILeastRow, r: number): void => {
    row.coef.forEach((v: number, d: number): void => {
      step[d]! += v * y[r]!;
    });
  });
  const largest: number = Math.max(...step.map(Math.abs));
  if (largest === 0) return undefined;
  return largest > region
    ? step.map((v: number): number => (v * region) / largest)
    : step;
}

/**
 * The damping of the detour's least squares, a share of the strongest row's
 * squared norm (provisional: a row a tenth as sensitive as the strongest is met
 * about halfway).
 */
const DAMPING: number = 0.01;

/**
 * A small dense system by Gaussian elimination with partial pivoting; none when
 * singular.
 */
function solve(a: number[][], b: number[]): number[] | undefined {
  const n: number = b.length;
  const m: number[][] = a.map((row: number[], i: number): number[] => [
    ...row,
    b[i]!,
  ]);
  for (let col: number = 0; col < n; ++col) {
    let pivot: number = col;
    for (let r: number = col + 1; r < n; ++r)
      if (Math.abs(m[r]![col]!) > Math.abs(m[pivot]![col]!)) pivot = r;
    if (!(Math.abs(m[pivot]![col]!) > 0)) return undefined;
    [m[col], m[pivot]] = [m[pivot]!, m[col]!];
    for (let r: number = col + 1; r < n; ++r) {
      const f: number = m[r]![col]! / m[col]![col]!;
      for (let k: number = col; k <= n; ++k) m[r]![k]! -= f * m[col]![k]!;
    }
  }
  const out: number[] = new Array<number>(n).fill(0);
  for (let r: number = n - 1; r >= 0; --r) {
    let s: number = m[r]![n]!;
    for (let k: number = r + 1; k < n; ++k) s -= m[r]![k]! * out[k]!;
    out[r] = s / m[r]![r]!;
  }
  return out;
}

/** The deepest sweep of a transport and where its row is made. */
interface ISweptRow {
  /** The sweep. */
  sweep: HumanArmTrajectorySweep.ISwept;

  /** Whether its row is made at its step's later end, other. */
  later: boolean;

  /** The waypoint whose interval it was read over, its shape's frame. */
  read: number;
}
