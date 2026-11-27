import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";

/*
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
  /*
   * An error function's reading at the iterate: its values and Jacobian.
   */
  export interface IReading {
    /*
     * The slide past the region's disc, millimetres: the constraint's value, at
     * most 0 when met.
     */
    excess: number;

    /*
     * The contact's offsets along the site's free axes, millimetres.
     */
    offsets: number[];

    /*
     * The variables, as the convex model indexes them.
     */
    index: number[];

    /*
     * The excess's derivative in each variable.
     */
    excessRow: number[];

    /*
     * Each offset's derivative in each variable.
     */
    offsetRows: number[][];
  }

  /*
   * Project the contact onto its authored disc and hold each component of the
   * projected point as an equality in the local quadratic program.
   * Parameter error: The site's offsets and their Jacobian, in millimetres.
   * Parameter radius: The site's admissible radius, millimetres.
   * Parameter key: The rows' key prefix within the quadratic program.
   * Returns: The hard equality rows.
   */
  export function equalities(
    error: ILinearisation,
    radius: number,
    key: string,
  ): IAutoMovieMotionHumanQuadraticProgram.IRow[] {
    const length: number = Math.hypot(...error.offsets);
    const shift: number = length > radius ? radius / length - 1 : 0;
    return error.offsets.map(
      (
        offset: number,
        i: number,
      ): IAutoMovieMotionHumanQuadraticProgram.IRow => {
        const delta: number = shift * offset;
        return {
          key: `${key}|${i}`,
          index: error.index,
          coef: error.offsetRows[i]!,
          l: delta,
          u: delta,
        };
      },
    );
  }

  /*
   * Constrain the contact to equal a selectable point in an inscribed box. In
   * `d` dimensions each bound is `±radius / sqrt(d)`, so the box's corners lie
   * on the round region. The additional variables move the selected contact
   * from the projection onto the box.
   * Parameter error: The site's offsets and their Jacobian, in millimetres.
   * Parameter radius: The positive radius of the authored region, millimetres.
   * Parameter key: The rows' key prefix within the quadratic program.
   * Parameter first: The first additional variable's index in the program.
   * Returns: The hard Cartesian equality and box rows.
   */
  export function region(
    error: ILinearisation,
    radius: number,
    key: string,
    first: number,
  ): IAutoMovieMotionHumanQuadraticProgram.IRow[] {
    const half: number = radius / Math.sqrt(error.offsets.length);
    return error.offsets.flatMap(
      (
        offset: number,
        i: number,
      ): IAutoMovieMotionHumanQuadraticProgram.IRow[] => {
        const index: number = first + i;
        const projected: number = Math.min(half, Math.max(-half, offset));
        return [
          {
            key: `${key}|${i}`,
            index: [...error.index, index],
            coef: [...error.offsetRows[i]!, -half],
            l: projected - offset,
            u: projected - offset,
          },
          {
            key: `${key}|${i}|box`,
            index: [index],
            coef: [1],
            l: (-half - projected) / half,
            u: (half - projected) / half,
          },
        ];
      },
    );
  }

  /*
   * The error and its Jacobian in the arms' free coordinates at the waypoint.
   * Parameter c: The context.
   * Parameter placed: The iterate's placements.
   * Parameter x: Each arm's coordinates at each waypoint, the iterate.
   * Parameter a: The arm.
   * Parameter k: The waypoint.
   * Parameter site: Its site.
   * Parameter index: The convex model's index of an arm's free coordinate there.
   * Returns: The reading.
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

  /*
   * The site components and their linearized coordinates.
   */
  type ILinearisation = Pick<IReading, "offsets" | "index" | "offsetRows">;

  /*
   * The error at one point: the slide's excess and the offsets.
   */
  interface IValue {
    /*
     * The slide past the disc, millimetres.
     */
    excess: number;

    /*
     * The offsets along the free axes, millimetres.
     */
    offsets: number[];
  }

  /*
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
    let moved: IAutoMovieMotionHumanArmGeometry.IPlaced | undefined;
    if (arm >= 0) {
      const q: number[] = [...x[arm]![k]!];
      q[coordinate] = q[coordinate]! + step;
      // The site uses the chain frames. Its finite difference needs no
      // surface probe positions or copies of the other waypoints.
      moved = G.placed(c.setups[arm]!, c.frames[arm]![k]!, q, false);
    }
    const read = (b: number): IAutoMovieMotionHumanArmGeometry.IPlaced =>
      b === arm && moved !== undefined ? moved : placed[b]![k]!;
    const at: P.ILocated = P.located(c, read, a, k, site);
    const contact: IAutoMovieVector3 = P.pad(read(a), site.contact);
    const off: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
      AutoMovieEngineVector3.subtract(contact, at.point),
      1000,
    );
    const normal: IAutoMovieVector3 | undefined = at.normal;
    const slide: IAutoMovieVector3 =
      normal === undefined
        ? off
        : AutoMovieEngineVector3.subtract(
            off,
            AutoMovieEngineVector3.scale(normal, AutoMovieEngineVector3.dot(off, normal)),
          );
    const axes: readonly IAutoMovieVector3[] =
      normal === undefined ? P.AXES : P.tangents(normal);
    return {
      excess: AutoMovieEngineVector3.length(slide) - 1000 * site.disc,
      offsets: axes.map((e: IAutoMovieVector3): number => AutoMovieEngineVector3.dot(off, e)),
    };
  }
}

/*
 * Sco's finite-difference step (`DEFAULT_EPSILON`, modeling_utils.cpp line 13).
 */
const EPSILON: number = 1e-5;
