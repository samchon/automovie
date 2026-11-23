import {
  Quaternion,
  Vector3,
  physicalShapeNearest,
  physicalShapeNormal,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMoviePhysicalShapeNearest,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmSweepGradient } from "./HumanArmSweepGradient";
import type { HumanArmTrajectoryHalfStep } from "./HumanArmTrajectoryHalfStep";
import { HumanArmTrajectoryJacobians as J } from "./HumanArmTrajectoryJacobians";
import { HumanArmTrajectoryLimits as L } from "./HumanArmTrajectoryLimits";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryRanges } from "./HumanArmTrajectoryRanges";
import { HumanArmTrajectorySmooth } from "./HumanArmTrajectorySmooth";
import type { HumanArmTrajectorySweep } from "./HumanArmTrajectorySweep";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel as V } from "./HumanArmTrajectoryTravel";

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
   * ranges too (only the trust region is hard). A pair that cannot come within
   * its bound by what the trust region lets its probe move is left out.
   *
   * @param c The context.
   * @param x Each arm's coordinates at each waypoint.
   * @param at0 The iterate's evaluation.
   * @param mu The penalty's weight.
   * @param radius How far a coordinate may move, coordinate units: the trust
   *   region, which bounds the active set.
   * @param smooth The context's exact quadratic terms
   *   (`HumanArmTrajectorySmooth.of` of this context), built once by the
   *   caller.
   * @returns The subproblem in the inner waypoints' free coordinates, waypoint
   *   by waypoint.
   */
  export function convexify(
    c: M.IContext,
    x: readonly (readonly number[])[][],
    at0: M.IEvaluation,
    mu: number,
    radius: number,
    smooth: HumanArmTrajectorySmooth.ISmooth,
  ): IAutoMovieMotionHumanQuadraticProgram.IProblem {
    const at: M.IEvaluation = at0;
    const n: number = c.n;
    const width: number = c.width;
    const { vars, band }: HumanArmTrajectorySmooth.ISmooth = smooth;

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
    const jac: J.IJacobian[][] = J.of(c, x, at);
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
      owner: "upper" | "lower" | "hand",
      p: IAutoMovieVector3,
    ): IAutoMovieVector3[] => J.carried(at, jac, b, k, owner, p);
    // What a probe can move within the trust region, millimetres.
    const reach = (a: number, k: number): number =>
      inner(k) ? jac[a]![k]!.move * radius : 0;
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
          if (
            T.SPEED.includes(probe) &&
            length > 1e-6 &&
            length + reach(a, k) + reach(a, k + 1) > M.stepLimit(c, k)
          ) {
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
        // Swept spheres, as the iterate's reading found them
        // (`HumanArmTrajectorySweep`): the far end is already in the shape's
        // frame at this waypoint, and its gradient is carried back by the
        // same turn.
        for (const sweep of at.swept[a]![k] ?? []) {
          const {
            probe,
            shape,
            to: pb,
          }: HumanArmTrajectorySweep.ISwept = sweep;
          const [pa, r] = at.placed[a]![k]!.probes[probe]!;
          const frame: IAutoMovieMotionHumanArmGeometry.IFrame =
            c.frames[a]![k]!;
          const d0: number = 1000 * sweep.clear;
          const lower: number = 1000 * sweep.lower;
          if (d0 - lower > Math.min(T.CHECK, reach(a, k) + reach(a, k + 1) + 2))
            continue;

          // Each end's own distance, read once for the pair that stays.
          const first: number = S.gap(frame, shape, pa, pa);
          const second: number = S.gap(frame, shape, pb, pb);
          if (
            first - r > lower / 1000 &&
            second - r > lower / 1000 &&
            d0 > lower
          )
            continue;

          // The swept distance's gradient in each end, exact: the distance
          // is the least over the segment of a point's distance, so by the
          // envelope theorem it moves with the segment's own nearest point,
          // along the shape's outward normal there, which the two ends carry
          // in the shares of that point's place between them (TrajOpt's
          // continuous-time gradient, Schulman et al. 2014, section IV-C).
          const s0: IAutoMovieMotionHumanArmGeometry.IShape =
            frame.shapes[shape]!;
          const near: IAutoMoviePhysicalShapeNearest.IResult =
            physicalShapeNearest(s0.pose, s0.shape, pa, pb);
          const span: IAutoMovieVector3 = Vector3.subtract(pb, pa);
          const u: number = Math.min(
            1,
            Math.max(
              0,
              Vector3.dot(Vector3.subtract(near.at, pa), span) /
                Math.max(1e-12, Vector3.dot(span, span)),
            ),
          );
          const g: IAutoMovieVector3 = HumanArmSweepGradient(s0, near, span, u);
          const ga: IAutoMovieVector3 = Vector3.scale(g, 1 - u);
          const gb: IAutoMovieVector3 = Quaternion.rotateVector(
            Quaternion.inverse(sweep.turn),
            Vector3.scale(g, u),
          );
          const s: ILinear = join(
            ...(inner(k) ? [along(a, k, jac[a]![k]!.probe(probe), ga)] : []),
            ...(inner(k + 1)
              ? [along(a, k + 1, jac[a]![k + 1]!.probe(probe), gb)]
              : []),
          );
          if (s.idx.length > 0)
            rows.push({
              key: `w|${a}|${k}|${probe}|${shape}`,
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
          const at: P.ILocated = P.located(c, at0.placed, a, k, site);
          const contact0: IAutoMovieVector3 = P.pad(placedK, site.contact);
          const off: IAutoMovieVector3 = Vector3.scale(
            Vector3.subtract(contact0, at.point),
            1000,
          );
          const n: IAutoMovieVector3 | undefined = at.normal;
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
          if (n === undefined) {
            // A grip held to its point on every axis: the merit's terms
            // linearised, the squared distance's Gauss-Newton model and the
            // excess past the region's disc along the offset's direction, so
            // the model's violation at the zero step is the merit's.
            for (const e of P.AXES) {
              const v: ILinear = relative(e);
              square(T.SITE, Vector3.dot(off, e), v.idx, v.coef);
            }
            const length: number = Vector3.length(off);
            if (length > 1e-6) {
              const v: ILinear = relative(Vector3.scale(off, 1 / length));
              rows.push({
                key: `d|${a}|${k}`,
                index: v.idx,
                coef: v.coef,
                l: -Infinity,
                u: 1000 * site.disc - length,
                weight: mu,
              });
            }
          } else {
            // The contact anywhere on the region's disc about the site,
            // pulled toward the site itself.
            const slide: IAutoMovieVector3 = Vector3.subtract(
              off,
              Vector3.scale(n, Vector3.dot(off, n)),
            );
            for (const e of P.tangents(n)) {
              const v: ILinear = relative(e);
              square(T.SITE, Vector3.dot(off, e), v.idx, v.coef);
            }
            const length: number = Vector3.length(slide);
            if (length > 1e-6) {
              const v: ILinear = relative(Vector3.scale(slide, 1 / length));
              rows.push({
                key: `d|${a}|${k}`,
                index: v.idx,
                coef: v.coef,
                l: -Infinity,
                u: 1000 * site.disc - length,
                weight: mu,
              });
            }
            // The contact's height above the touched collider no lower than
            // the site's own, and the least above it that clears.
            const v: ILinear = relative(at.normalAt(contact0));
            const lift: number = 1000 * (at.gap(contact0) - at.gap(at.point));
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
        // One row per segment and shape, its deepest probe's (TrajOpt's
        // per-link pair, its distance at the closest points), or, where the
        // probe's swept segment to a neighbouring waypoint comes nearer the
        // shape, that segment's distance, which moves with the probe at both
        // of its ends by the sweep's gradient (`HumanArmTrajectoryHalfStep`,
        // TrajOpt's continuous-time term).
        for (const pair of (
          at.pairs[a]?.[k]?.deepest ?? P.deepest(c, a, k, placedK)
        ).values()) {
          const sweep: HumanArmTrajectoryHalfStep.ISwept | undefined =
            pair.swept;
          if (
            -pair.short >
            Math.min(
              T.CHECK,
              reach(a, k) +
                (sweep === undefined
                  ? 0
                  : Math.max(
                      0,
                      ...sweep.there.map(
                        (g: HumanArmTrajectoryHalfStep.IGradient): number =>
                          reach(a, g.other),
                      ),
                    )) +
                2,
            )
          )
            continue;
          const v: ILinear =
            sweep === undefined
              ? along(
                  a,
                  k,
                  jac[a]![k]!.probe(pair.probe),
                  S.normal(
                    c.frames[a]![k]!,
                    pair.shape,
                    placedK.probes[pair.probe]![0],
                  ),
                )
              : join(
                  along(a, k, jac[a]![k]!.probe(pair.probe), sweep.here),
                  ...sweep.there
                    .filter(
                      (g: HumanArmTrajectoryHalfStep.IGradient): boolean =>
                        inner(g.other),
                    )
                    .map(
                      (g: HumanArmTrajectoryHalfStep.IGradient): ILinear =>
                        along(
                          a,
                          g.other,
                          jac[a]![g.other]!.probe(pair.probe),
                          g.direction,
                        ),
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
          at.pairs[a]?.[k]?.embedded ?? P.embedded(c, a, k, placedK)
        ).values()) {
          if (-pair.short > Math.min(T.CHECK, reach(a, k) + 2)) continue;
          const p: IAutoMovieVector3 =
            c.frames[a]![k]!.body[pair.corner]!.point;
          const g: IAutoMovieVector3 = physicalShapeNormal(
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
        rows.push(...HumanArmTrajectoryRanges.of(c, a, k, arm[k]!, index, mu));
      }
    });
    // Each arm's probes clear of the other arm's own colliders as both
    // move: the probe's motion less the other segment's motion at the probe.
    if (x.length === 2)
      for (let k: number = 1; k < n; ++k)
        for (const pair of inner(k)
          ? (
              at.crossing[k] ??
              P.crossing(c, k, at.placed[0]![k]!, at.placed[1]![k]!, P.CUT)
            ).values()
          : []) {
          if (-pair.short > Math.min(T.CHECK, reach(0, k) + reach(1, k) + 2))
            continue;
          const a: number = pair.a;
          const b: number = 1 - a;
          const p: IAutoMovieVector3 = at.placed[a]![k]!.probes[pair.probe]![0];
          const g: IAutoMovieVector3 = physicalShapeNormal(
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
    return { n: vars, band, p, q, rows };
  }
}

/** A linear form in the subproblem's variables. */
interface ILinear {
  idx: number[];
  coef: number[];
}
