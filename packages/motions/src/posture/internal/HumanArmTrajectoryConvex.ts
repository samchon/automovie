import { Quaternion, Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmShapes as S } from "./HumanArmShapes";
import type { HumanArmSurfaceLift } from "./HumanArmSurfaceLift";
import { HumanArmSweepGradient } from "./HumanArmSweepGradient";
import { HumanArmTrajectoryJacobians as J } from "./HumanArmTrajectoryJacobians";
import { HumanArmTrajectoryLimits as L } from "./HumanArmTrajectoryLimits";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryRanges } from "./HumanArmTrajectoryRanges";
import { HumanArmTrajectorySiteError as E } from "./HumanArmTrajectorySiteError";
import { HumanArmTrajectorySmooth } from "./HumanArmTrajectorySmooth";
import type { HumanArmTrajectorySweep } from "./HumanArmTrajectorySweep";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel as V } from "./HumanArmTrajectoryTravel";

/** The alternatives of `ConvexifyCarriedOwner`'s site. */
type ConvexifyCarriedOwner = "upper" | "lower" | "hand";

/**
 * The convex subproblem of an arms' trajectory about an iterate
 * (`HumanArmTrajectoryModel`), TrajOpt's: the objective's quadratic model and
 * each constraint linearised by the Jacobians of the probes, the contact and
 * the hand's rotation (`HumanArmTrajectoryJacobians`): each coordinate's
 * segment twists, every point moving with its segment as a rigid body (Schulman
 * et al. 2014, a pair's distance linearised along its normal on the point
 * Jacobian).
 */
export namespace HumanArmTrajectoryConvex {
  /**
   * The convex subproblem about an iterate: the objective's quadratic model
   * (exact in the accelerations, Gauss-Newton in the steps and the rotation)
   * and each constraint linearised, as soft l1 rows of weight `mu`, the domain
   * ranges too (only the trust region is hard). A pair enters only within
   * trajopt's contact distance of its bound (`HumanArmTrajectoryTerms.CHECK`,
   * the fixed `max(dist_pen) + .04` m of `problem_description.cpp` line 549 at
   * commit 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause; Schulman et
   * al. 2014, section IV-A, `d_check > d_safe`); every other constraint enters
   * at every convexification, as trajopt's do.
   *
   * @param c The context.
   * @param x Each arm's coordinates at each waypoint.
   * @param at0 The iterate's evaluation.
   * @param mu The penalty's weight.
   * @param smooth The context's exact quadratic terms
   *   (`HumanArmTrajectorySmooth.of` of this context), built once by the
   *   caller.
   * @param fixSite The hold's hard contact equality, at its projection or a
   *   point selected within an inscribed region.
   * @returns The subproblem in the inner waypoints' free coordinates, waypoint
   *   by waypoint.
   */
  export function convexify(
    c: M.IContext,
    x: readonly (readonly number[])[][],
    at0: M.IEvaluation,
    mu: number,
    smooth: HumanArmTrajectorySmooth.ISmooth,
    fixSite: boolean | "region" = false,
  ): IAutoMovieMotionHumanQuadraticProgram.IProblem {
    const at: M.IEvaluation = at0;
    const n: number = c.n;
    const width: number = c.width;
    const { vars, band }: HumanArmTrajectorySmooth.ISmooth = smooth;
    let variables: number = vars;

    // The accelerations' and the anchor's terms are exact: their curvature
    // is the context's own, copied, and their gradient the iterate's.
    const p: Float64Array[] = smooth.p.map(
      (row: Float64Array): Float64Array => Float64Array.from(row),
    );
    const q: Float64Array = new Float64Array(vars);
    HumanArmTrajectorySmooth.gradient(smooth, x, q);
    const rows: IAutoMovieMotionHumanQuadraticProgram.IRow[] = [];
    const index = (a: number, k: number, f: number): number =>
      (k - 1) * width + c.offset[a]! + f;
    const square = (
      w: number,
      r0: number,
      idx: number[],
      coef: number[],
    ): void => {
      for (let i: number = 0; i < idx.length; ++i) {
        q[idx[i]!]! += 2 * w * coef[i]! * r0;
        for (let j: number = 0; j < idx.length; ++j)
          if (idx[j]! >= idx[i]!)
            p[idx[i]!]![idx[j]! - idx[i]!]! += 2 * w * coef[i]! * coef[j]!;
      }
    };
    const inner = (k: number): boolean => M.inner(c, k);
    // The Jacobians of every probe, the contact and the hand's rotation
    // (`HumanArmTrajectoryJacobians`).
    const jac: J.IJacobian[][] = J(c, x, at);
    const along = (
      a: number,
      k: number,
      rows3: IAutoMovieVector3[],
      dir: IAutoMovieVector3,
      sign: number = 1,
    ): ILinear => ({
      idx: c.free[a]!.map((_, f: number) => index(a, k, f)),
      coef: rows3.map((g: IAutoMovieVector3) => sign * Vector3.dot(g, dir)),
    });
    const join = (...parts: ILinear[]): ILinear => ({
      idx: parts.flatMap((part) => part.idx),
      coef: parts.flatMap((part) => part.coef),
    });
    // The motion of a point riding one of an arm's segments, per coordinate.
    const carried = (
      b: number,
      k: number,
      owner: ConvexifyCarriedOwner,
      p: IAutoMovieVector3,
    ): IAutoMovieVector3[] => J.carried(at, jac, b, k, owner, p);
    x.forEach((arm, a: number): void => {
      for (let k: number = 0; k + 1 < n; ++k) {
        // Cartesian steps and speed, read against the arm's own base
        // (`HumanArmTrajectoryTravel`): the later point's share of a step's
        // gradient is its world Jacobian, the earlier point's that Jacobian
        // turned by the bases' relative turn.
        const before: IAutoMovieMotionHumanArmGeometry.IFrame =
          c.frames[a]![k]!;
        const after: IAutoMovieMotionHumanArmGeometry.IFrame =
          c.frames[a]![k + 1]!;
        const turn: IAutoMovieQuaternion = V.back(before, after);
        for (const probe of c.still ? [] : new Set([...T.PATH, ...T.SPEED])) {
          const d: IAutoMovieVector3 = Vector3.scale(
            V.step(
              before,
              after,
              at.placed[a]![k]!.probes[probe]![0],
              at.placed[a]![k + 1]!.probes[probe]![0],
            ),
            1000,
          );
          const step = (dir: IAutoMovieVector3): ILinear =>
            join(
              ...(inner(k + 1)
                ? [along(a, k + 1, jac[a]![k + 1]!.probe(probe), dir)]
                : []),
              ...(inner(k)
                ? [
                    along(
                      a,
                      k,
                      jac[a]![k]!.probe(probe),
                      Quaternion.rotateVector(turn, dir),
                      -1,
                    ),
                  ]
                : []),
            );
          if (T.PATH.includes(probe))
            for (const e of P.AXES) {
              const s: ILinear = step(e);
              if (s.idx.length > 0)
                square(T.LENGTH, Vector3.dot(d, e), s.idx, s.coef);
            }
          const length: number = Vector3.length(d);
          if (T.SPEED.includes(probe) && length > 1e-6) {
            const s: ILinear = step(Vector3.scale(d, 1 / length));
            if (s.idx.length > 0)
              rows.push({
                key: `v|${a}|${k}|${probe}`,
                index: s.idx,
                coef: s.coef,
                l: -Infinity,
                u: M.stepLimit(c, k) - length,
                weight: mu,
              });
          }
        }
        // Swept probes, axis spheres and collider probes alike, as the
        // iterate's reading found them (`HumanArmTrajectorySweep`): each
        // frame step's, both its ends already in the shape's frame at this
        // waypoint, each end's gradient carried back by its own turn.
        for (const sweep of at.swept[a]![k] ?? []) {
          const { probe, shape }: HumanArmTrajectorySweep.ISwept = sweep;
          const frame: IAutoMovieMotionHumanArmGeometry.IFrame =
            c.frames[a]![k]!;
          const start: number = sweep.from;
          const other: number = sweep.other;
          const d0: number = 1000 * sweep.clear;
          const lower: number = 1000 * sweep.lower;
          // A step clear of its allowance gives no row: each of its ends lies
          // no nearer the shape than the step does, the step's distance the
          // least over its points.
          if (d0 - lower > T.CHECK) continue;

          // The swept distance's gradient in each end, exact: the distance
          // is the least over the segment of a point's distance, so by the
          // envelope theorem it moves with the segment's own nearest point,
          // along the shape's outward normal there, which the two ends carry
          // in the shares of that point's place between them (TrajOpt's
          // continuous-time gradient, Schulman et al. 2014, section IV-C).
          const s0: IAutoMovieMotionHumanArmGeometry.IShape =
            frame.shapes[shape]!;
          const [ga, gb]: [IAutoMovieVector3, IAutoMovieVector3] =
            HumanArmSweepGradient.ends(s0, sweep);
          const s: ILinear = join(
            ...(inner(start)
              ? [along(a, start, jac[a]![start]!.probe(probe), ga)]
              : []),
            ...(inner(other)
              ? [along(a, other, jac[a]![other]!.probe(probe), gb)]
              : []),
          );
          if (s.idx.length > 0)
            rows.push({
              key: `w|${a}|${start}|${probe}|${shape}`,
              index: s.idx,
              coef: s.coef,
              l: lower - d0,
              u: Infinity,
              weight: mu,
            });
        }
      }
      for (let k: number = 1; k < n; ++k) {
        if (!inner(k)) continue;
        const site: M.ISite | undefined = c.sites[a]![k];
        const placedK: IAutoMovieMotionHumanArmGeometry.IPlaced =
          at.placed[a]![k]!;
        if (site !== undefined) {
          const at: P.ILocated = P.located(
            c,
            (arm: number): IAutoMovieMotionHumanArmGeometry.IPlaced =>
              at0.placed[arm]![k]!,
            a,
            k,
            site,
          );
          const contact0: IAutoMovieVector3 = P.pad(placedK, site.contact);
          // The contact's motion, less the riding segment's motion at it: the
          // relative contact; a site that rides nothing has none.
          const relative = (dir: IAutoMovieVector3): ILinear => {
            const own: ILinear = along(a, k, jac[a]![k]!.pad, dir);
            if (at.on === undefined) return own;
            const b: number = at.on.arm;
            const carried: IAutoMovieVector3[] = jac[b]![k]!.segments.map(
              (column) =>
                Vector3.add(
                  column[at.on!.owner].origin,
                  Vector3.scale(
                    Vector3.cross(
                      column[at.on!.owner].omega,
                      Vector3.subtract(contact0, at.on!.origin),
                    ),
                    1000,
                  ),
                ),
            );
            return join(own, along(b, k, carried, dir, -1));
          };
          // The site's error as the evaluation reads it, convexified as
          // sco convexifies an error function (`HumanArmTrajectorySiteError`):
          // the offsets' squares (`CostFromErrFunc`, squared) and the slide's
          // excess past the region's disc (`ConstraintFromErrFunc`), each by
          // its forward-difference Jacobian.
          const error: E.IReading = E.read(c, at0.placed, x, a, k, site, index);
          if (fixSite === "region" && site.disc > 0) {
            rows.push(
              ...E.region(error, 1000 * site.disc, `d|${a}|${k}`, variables),
            );
            variables += error.offsets.length;
          } else if (fixSite) {
            // Project the contact onto its authored disc. Each tangent
            // coordinate of that choice is fixed in the subproblem, so
            // improving clearance cannot exchange it for a site miss.
            rows.push(...E.equalities(error, 1000 * site.disc, `d|${a}|${k}`));
          } else {
            error.offsets.forEach((o: number, i: number): void => {
              square(T.SITE, o, error.index, error.offsetRows[i]!);
            });
            rows.push({
              key: `d|${a}|${k}`,
              index: error.index,
              coef: error.excessRow,
              l: -Infinity,
              u: -error.excess,
              weight: mu,
            });
          }
          const surface: HumanArmSurfaceLift.IReading | undefined = at0.lifts[a]![k];
          if (surface !== undefined) {
            const v: ILinear = relative(surface.normal);
            const lift: number = 1000 * surface.metres;
            rows.push({
              key: `l|${a}|${k}`,
              index: v.idx,
              coef: v.coef,
              l: -lift,
              u: Infinity,
              weight: mu,
            });
            square(T.LIFT, lift, v.idx, v.coef);
          }
          rows.push(...L.rows(c, at0, jac, a, k, site, mu, index));
          if (site.rotation !== undefined) {
            const r: IAutoMovieVector3 = P.rotationVector(
              at.rotation ?? site.rotation,
              placedK.hand,
            );
            for (const e of P.AXES) {
              const v: ILinear = along(a, k, jac[a]![k]!.hand, e);
              square(T.ROTATION, Vector3.dot(r, e), v.idx, v.coef);
            }
          }
        }
        // One row per segment and shape, its deepest probe's at the
        // waypoint (TrajOpt's per-link pair at a timestep, its distance at
        // the closest points); the course between waypoints is the sweeps'
        // rows above, one per frame step.
        for (const pair of (
          at.pairs[a]?.[k]?.deepest ?? new Map<number, P.IPair>()
        ).values()) {
          if (-pair.short > T.CHECK) continue;
          const v: ILinear = along(
            a,
            k,
            jac[a]![k]!.probe(pair.probe),
            S.normal(
              c.frames[a]![k]!,
              pair.shape,
              placedK.probes[pair.probe]![0],
            ),
          );
          rows.push({
            key: `c|${a}|${k}|${pair.probe}|${pair.shape}`,
            index: v.idx,
            coef: v.coef,
            l: pair.short,
            u: Infinity,
            weight: mu,
          });
          if (pair.rested) square(T.LIFT, -pair.short, v.idx, v.coef);
        }
        // The body's corners in the arm's own colliders: only the arm moves,
        // so the corner's distance falls by the shape's motion along its
        // outward normal there.
        for (const pair of (
          at.pairs[a]?.[k]?.embedded ?? new Map<number, P.IEmbedded>()
        ).values()) {
          if (-pair.short > T.CHECK) continue;
          const p: IAutoMovieVector3 =
            c.frames[a]![k]!.body[pair.corner]!.point;
          const g: IAutoMovieVector3 = AutoMovieEnginePhysics.physicalShapeNormal(
            pair.shape.pose,
            pair.shape.shape,
            p,
            Vector3.normalize(Vector3.subtract(p, pair.shape.centre)),
          );
          const v: ILinear = along(a, k, carried(a, k, pair.owner, p), g, -1);
          rows.push({
            key: `i|${a}|${k}|${pair.corner}|${pair.index}`,
            index: v.idx,
            coef: v.coef,
            l: pair.short,
            u: Infinity,
            weight: mu,
          });
          if (pair.rested) square(T.LIFT, -pair.short, v.idx, v.coef);
        }
        // The chart and coordinate domains, elastic, have one row owner.
        rows.push(...HumanArmTrajectoryRanges(c, a, k, arm[k]!, index, mu));
      }
    });
    // Each arm's probes clear of the other arm's own colliders as both
    // move: the probe's motion less the other segment's motion at the probe.
    if (x.length === 2)
      for (let k: number = 1; k < n; ++k)
        for (const pair of inner(k)
          ? (at.crossing[k] ?? new Map<string, P.ICrossing>()).values()
          : []) {
          if (-pair.short > T.CHECK) continue;
          const a: number = pair.a;
          const b: number = 1 - a;
          const p: IAutoMovieVector3 = at.placed[a]![k]!.probes[pair.probe]![0];
          const g: IAutoMovieVector3 = AutoMovieEnginePhysics.physicalShapeNormal(
            pair.shape.pose,
            pair.shape.shape,
            p,
            Vector3.normalize(Vector3.subtract(p, pair.shape.centre)),
          );
          const s: ILinear = join(
            along(a, k, jac[a]![k]!.probe(pair.probe), g),
            along(b, k, carried(b, k, pair.owner, p), g, -1),
          );
          rows.push({
            key: `x|${pair.a}|${k}|${pair.probe}|${pair.bone}`,
            index: s.idx,
            coef: s.coef,
            l: pair.short,
            u: Infinity,
            weight: mu,
          });
          if (pair.rested) square(T.LIFT, -pair.short, s.idx, s.coef);
        }
    if (variables === vars) return { n: vars, band, p, q, rows };
    // A still contact's auxiliary coordinates follow its joint coordinates.
    // Keep their equality rows inside the band's admitted width.
    const fullBand: number = Math.max(band, variables - 1);
    const expanded: Float64Array[] = Array.from(
      { length: variables },
      (_: unknown, i: number): Float64Array => {
        if (i < vars && band === fullBand) return p[i]!;
        const row: Float64Array = new Float64Array(fullBand + 1);
        if (i < vars) row.set(p[i]!);
        return row;
      },
    );
    const linear: Float64Array = new Float64Array(variables);
    linear.set(q);
    return { n: variables, band: fullBand, p: expanded, q: linear, rows };
  }
}

/** A linear form in the subproblem's variables. */
interface ILinear {
  idx: number[];
  coef: number[];
}
