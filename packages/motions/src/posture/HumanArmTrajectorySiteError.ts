import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";

/**
 * A hand's error on its site at a waypoint, the very function the trajectory's
 * evaluation reads (`HumanArmTrajectoryEvaluate`), and its convexification as
 * trajopt's sco convexifies an error function: the value and its
 * forward-difference Jacobian (`ConstraintFromErrFunc`, `CostFromErrFunc` and
 * `calcForwardNumJac`, github.com/joschu/trajopt src/sco/modeling_utils.cpp and
 * src/sco/num_diff.cpp at commit 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c,
 * BSD-2-Clause, its step `DEFAULT_EPSILON` 1e-5 in the variables' own units),
 * so the convex row is by construction the linearisation of the evaluated
 * error.
 */
export namespace HumanArmTrajectorySiteError {
  /** An error function's reading at the iterate: its values and Jacobian. */
  export interface IReading {
    /**
     * The slide past the region's disc, millimetres: the constraint's value, at
     * most 0 when met.
     */
    excess: number;

    /** The contact's offsets along the site's free axes, millimetres. */
    offsets: number[];

    /** The variables, as the convex model indexes them. */
    index: number[];

    /** The excess's derivative in each variable. */
    excessRow: number[];

    /** Each offset's derivative in each variable. */
    offsetRows: number[][];
  }

  /**
   * The error and its Jacobian in the arms' free coordinates at the waypoint.
   *
   * @param c The context.
   * @param placed The iterate's placements.
   * @param x Each arm's coordinates at each waypoint, the iterate.
   * @param a The arm.
   * @param k The waypoint.
   * @param site Its site.
   * @param index The convex model's index of an arm's free coordinate there.
   * @returns The reading.
   */
  export function read(
    c: M.IContext,
    placed: M.IEvaluation["placed"],
    x: readonly (readonly (readonly number[])[])[],
    a: number,
    k: number,
    site: M.ISite,
    index: (a: number, k: number, f: number) => number,
  ): IReading {
    const base: IValue = value(c, placed, x, a, k, site, -1, -1, 0);
    const arms: number[] = [a];
    const riding: number | undefined = P.located(
      c,
      (arm: number): IAutoMovieMotionHumanArmGeometry.IPlaced =>
        placed[arm]![k]!,
      a,
      k,
      site,
    ).on?.arm;
    if (riding !== undefined && riding !== a) arms.push(riding);
    const idx: number[] = [];
    const excessRow: number[] = [];
    const offsetRows: number[][] = base.offsets.map((): number[] => []);
    for (const b of arms)
      c.free[b]!.forEach((d: number, f: number): void => {
        const moved: IValue = value(c, placed, x, a, k, site, b, d, EPSILON);
        idx.push(index(b, k, f));
        excessRow.push((moved.excess - base.excess) / EPSILON);
        moved.offsets.forEach((o: number, i: number): void => {
          offsetRows[i]!.push((o - base.offsets[i]!) / EPSILON);
        });
      });
    return {
      excess: base.excess,
      offsets: base.offsets,
      index: idx,
      excessRow,
      offsetRows,
    };
  }

  /** The error at one point: the slide's excess and the offsets. */
  interface IValue {
    /** The slide past the disc, millimetres. */
    excess: number;

    /** The offsets along the free axes, millimetres. */
    offsets: number[];
  }

  /**
   * The evaluation's own site reading with one coordinate moved by a step: the
   * contact's offset from the located site, its slide along the surface past
   * the region's disc, and its offsets along the surface's tangents (on every
   * axis where the site has no surface).
   */
  function value(
    c: M.IContext,
    placed: M.IEvaluation["placed"],
    x: readonly (readonly (readonly number[])[])[],
    a: number,
    k: number,
    site: M.ISite,
    arm: number,
    coordinate: number,
    step: number,
  ): IValue {
    const moved: M.IEvaluation["placed"] =
      arm < 0
        ? placed
        : placed.map(
            (
              row: readonly IAutoMovieMotionHumanArmGeometry.IPlaced[],
              b: number,
            ): IAutoMovieMotionHumanArmGeometry.IPlaced[] => {
              if (b !== arm) return [...row];
              const q: number[] = [...x[b]![k]!];
              q[coordinate] = q[coordinate]! + step;
              const copy: IAutoMovieMotionHumanArmGeometry.IPlaced[] = [...row];
              copy[k] = G.placed(c.setups[b]!, c.frames[b]![k]!, q, true);
              return copy;
            },
          );
    const at: P.ILocated = P.located(
      c,
      (arm: number): IAutoMovieMotionHumanArmGeometry.IPlaced =>
        moved[arm]![k]!,
      a,
      k,
      site,
    );
    const contact: IAutoMovieVector3 = P.pad(moved[a]![k]!, site.contact);
    const off: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(contact, at.point),
      1000,
    );
    const normal: IAutoMovieVector3 | undefined = at.normal;
    const slide: IAutoMovieVector3 =
      normal === undefined
        ? off
        : Vector3.subtract(
            off,
            Vector3.scale(normal, Vector3.dot(off, normal)),
          );
    const axes: readonly IAutoMovieVector3[] =
      normal === undefined ? P.AXES : P.tangents(normal);
    return {
      excess: Vector3.length(slide) - 1000 * site.disc,
      offsets: axes.map((e: IAutoMovieVector3): number => Vector3.dot(off, e)),
    };
  }
}

/** Sco's finite-difference step (`DEFAULT_EPSILON`, modeling_utils.cpp line 13). */
const EPSILON: number = 1e-5;
