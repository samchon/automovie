import {
  Vector3,
  physicalShapeNormal,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanQuadraticProgram as QP } from "./HumanQuadraticProgram";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/**
 * The convex subproblem of an arms' trajectory about an iterate
 * (`HumanArmTrajectoryModel`), TrajOpt's: the objective's quadratic model
 * and each constraint linearised by the Jacobians of the probes, the
 * contact and the hand's rotation, read by central differences.
 */
export namespace HumanArmTrajectoryConvex {
  /**
   * The convex subproblem about an iterate: the objective's quadratic model
   * (exact in the accelerations, Gauss-Newton in the steps and the
   * rotation) and each constraint linearised, as soft l1 rows of weight
   * `mu`; the ranges hard. A pair that cannot come within its bound by what
   * the trust region lets its probe move is left out.
   *
   * @param c The context.
   * @param x Each arm's coordinates at each waypoint.
   * @param at0 The iterate's evaluation.
   * @param mu The penalty's weight.
   * @param radius How far a coordinate may move, coordinate units: the trust region, which bounds the active set.
   * @returns The subproblem in the inner waypoints' free coordinates, waypoint by waypoint.
   */
  export function convexify(
    c: M.IContext,
    x: readonly (readonly number[])[][],
    at0: M.IEvaluation,
    mu: number,
    radius: number,
  ): QP.IProblem {
    const at: M.IEvaluation = at0;
    const n: number = c.n;
    const width: number = c.width;
    const vars: number = (c.open ? n - 1 : n - 2) * width;
    const band: number = 3 * width - 1;
    const p: Float64Array[] = Array.from({ length: vars }, () => new Float64Array(band + 1));
    const q: Float64Array = new Float64Array(vars);
    const rows: QP.IRow[] = [];
    const index = (a: number, k: number, f: number): number => (k - 1) * width + c.offset[a]! + f;
    const square = (w: number, r0: number, idx: number[], coef: number[]): void => {
      for (let i: number = 0; i < idx.length; ++i) {
        q[idx[i]!]! += 2 * w * coef[i]! * r0;
        for (let j: number = 0; j < idx.length; ++j)
          if (idx[j]! >= idx[i]!) p[idx[i]!]![idx[j]! - idx[i]!]! += 2 * w * coef[i]! * coef[j]!;
      }
    };
    const inner = (k: number): boolean => M.inner(c, k);
    // The Jacobians of every probe, the contact and the hand's rotation.
    const H: number = 0.05;
    const jac: IJacobian[][] = x.map((arm: readonly (readonly number[])[], a: number): IJacobian[] =>
      arm.map((v: readonly number[], k: number): IJacobian => {
        const entry: IJacobian = { probes: [], pad: [], hand: [], move: 0, segments: [] };
        if (!inner(k)) return entry;
        const site: M.ISite | undefined = c.sites[a]![k];
        entry.probes = at.placed[a]![k]!.probes.map((): IAutoMovieVector3[] => []);
        for (const d of c.free[a]!) {
          const up: number[] = [...v];
          const down: number[] = [...v];
          up[d] = up[d]! + H;
          down[d] = down[d]! - H;
          const u: G.IPlaced = G.placed(c.setups[a]!, c.frames[a]![k]!, up, false);
          const w: G.IPlaced = G.placed(c.setups[a]!, c.frames[a]![k]!, down, false);
          u.probes.forEach((pu, i: number): void => {
            entry.probes[i]!.push(Vector3.scale(Vector3.subtract(pu[0], w.probes[i]![0]), 1000 / (2 * H)));
          });
          // The colliders' probes move with their segments as rigid bodies:
          // the segment's origin's motion plus its turn about it.
          const moved = (from: (p: G.IPlaced) => IAutoMovieVector3, turn: (p: G.IPlaced) => IAutoMovieQuaternion): IMotion => ({
            origin: Vector3.scale(Vector3.subtract(from(u), from(w)), 1000 / (2 * H)),
            omega: Vector3.scale(P.rotationVector(turn(w), turn(u)), Math.PI / 180 / (2 * H)),
          });
          const frames: Record<"upper" | "lower" | "hand", IMotion> = {
            upper: moved((p) => p.shoulder, (p) => p.upper),
            lower: moved((p) => p.elbow, (p) => p.lower),
            hand: moved((p) => p.wrist, (p) => p.hand),
          };
          entry.segments.push(frames);
          const here: G.IPlaced = at.placed[a]![k]!;
          const origins: Record<"upper" | "lower" | "hand", IAutoMovieVector3> = { upper: here.shoulder, lower: here.elbow, hand: here.wrist };
          for (let i: number = G.SURFACE; i < here.probes.length; ++i) {
            const owner: "upper" | "lower" | "hand" = c.frames[a]![k]!.owners[i - G.SURFACE]!;
            const arm: IAutoMovieVector3 = Vector3.subtract(here.probes[i]![0], origins[owner]);
            entry.probes[i]!.push(Vector3.add(frames[owner].origin, Vector3.scale(Vector3.cross(frames[owner].omega, arm), 1000)));
          }
          if (site !== undefined) {
            entry.pad.push(Vector3.scale(Vector3.subtract(P.pad(u, site.contact), P.pad(w, site.contact)), 1000 / (2 * H)));
            if (site.rotation !== undefined)
              entry.hand.push(Vector3.scale(Vector3.subtract(P.rotationVector(site.rotation, u.hand), P.rotationVector(site.rotation, w.hand)), 1 / (2 * H)));
          }
        }
        for (const column of entry.probes)
          entry.move = Math.max(entry.move, column.reduce((s: number, g: IAutoMovieVector3) => s + Vector3.length(g), 0));
        return entry;
      }),
    );
    const along = (a: number, k: number, rows3: IAutoMovieVector3[], dir: IAutoMovieVector3, sign: number = 1): ILinear => ({
      idx: c.free[a]!.map((_, f: number) => index(a, k, f)),
      coef: rows3.map((g: IAutoMovieVector3) => sign * Vector3.dot(g, dir)),
    });
    const join = (...parts: ILinear[]): ILinear => ({
      idx: parts.flatMap((part) => part.idx),
      coef: parts.flatMap((part) => part.coef),
    });
    // The motion of a point riding one of an arm's segments, per coordinate:
    // the segment's origin's motion plus its turn about it.
    const carried = (b: number, k: number, owner: "upper" | "lower" | "hand", p: IAutoMovieVector3): IAutoMovieVector3[] => {
      const placed: G.IPlaced = at.placed[b]![k]!;
      const origin: IAutoMovieVector3 = owner === "upper" ? placed.shoulder : owner === "lower" ? placed.elbow : placed.wrist;
      return jac[b]![k]!.segments.map((column: Record<"upper" | "lower" | "hand", IMotion>): IAutoMovieVector3 =>
        Vector3.add(column[owner].origin, Vector3.scale(Vector3.cross(column[owner].omega, Vector3.subtract(p, origin)), 1000)),
      );
    };
    // What a probe can move within the trust region, millimetres.
    const reach = (a: number, k: number): number => (inner(k) ? jac[a]![k]!.move * radius : 0);
    x.forEach((arm, a: number): void => {
      // Accelerations, exact; a still configuration's among its own waypoints.
      for (let k: number = c.still ? 2 : 0; k < (c.still ? n - 2 : n); ++k)
        c.free[a]!.forEach((d: number, f: number): void => {
          let r0: number = 0;
          const idx: number[] = [];
          const coef: number[] = [];
          for (const [j, w] of [[Math.min(n - 1, k + 1), 1], [k, -2], [Math.max(0, k - 1), 1]] as const) {
            r0 += w * arm[j]![d]!;
            if (!inner(j)) continue;
            const at2: number = idx.indexOf(index(a, j, f));
            if (at2 >= 0) coef[at2]! += w;
            else {
              idx.push(index(a, j, f));
              coef.push(w);
            }
          }
          if (idx.length > 0) square(T.ACCELERATION, r0, idx, coef);
        });
      // A still configuration drawn to its anchor, exact.
      const anchor: readonly number[] | undefined = c.anchor?.[a];
      if (anchor !== undefined)
        for (let k: number = 1; k + 1 < n; ++k)
          c.free[a]!.forEach((d: number, f: number): void => square(T.ANCHOR, arm[k]![d]! - anchor[d]!, [index(a, k, f)], [1]));
      for (let k: number = 0; k + 1 < n; ++k) {
        const dt: number = c.times[k + 1]! - c.times[k]!;
        // Cartesian steps and speed.
        for (const probe of c.still ? [] : new Set([...T.PATH, ...T.SPEED])) {
          const d: IAutoMovieVector3 = Vector3.scale(Vector3.subtract(at.placed[a]![k + 1]!.probes[probe]![0], at.placed[a]![k]!.probes[probe]![0]), 1000);
          const step = (dir: IAutoMovieVector3): ILinear =>
            join(
              ...(inner(k + 1) ? [along(a, k + 1, jac[a]![k + 1]!.probes[probe]!, dir)] : []),
              ...(inner(k) ? [along(a, k, jac[a]![k]!.probes[probe]!, dir, -1)] : []),
            );
          if (T.PATH.includes(probe))
            for (const e of P.AXES) {
              const s: ILinear = step(e);
              if (s.idx.length > 0) square(T.LENGTH, Vector3.dot(d, e), s.idx, s.coef);
            }
          const length: number = Vector3.length(d);
          if (T.SPEED.includes(probe) && length > 1e-6 && length + reach(a, k) + reach(a, k + 1) > 1000 * M.SPEED_LIMIT * dt) {
            const s: ILinear = step(Vector3.scale(d, 1 / length));
            if (s.idx.length > 0) rows.push({ key: `v|${a}|${k}|${probe}`, index: s.idx, coef: s.coef, l: -Infinity, u: 1000 * M.SPEED_LIMIT * dt - length, weight: mu });
          }
        }
        // Swept spheres.
        for (let probe: number = 0; probe < (c.still ? 0 : G.SURFACE); ++probe) {
          const [pa, r] = at.placed[a]![k]!.probes[probe]!;
          const pb: IAutoMovieVector3 = at.placed[a]![k + 1]!.probes[probe]![0];
          if (Vector3.length(Vector3.subtract(pa, pb)) < r) continue;
          for (const shape of G.near(c.frames[a]![k]!, pa, r + T.REACH)) {
            const frame: G.IFrame = c.frames[a]![k]!;
            const d0: number = 1000 * (G.gap(frame, shape, pa, pb) - r);
            const lower: number = 1000 * Math.min(c.allowed(a, k, probe, shape), c.allowed(a, k + 1, probe, shape));
            const pointsClear: boolean =
              G.gap(frame, shape, pa, pa) - r > lower / 1000 && G.gap(frame, shape, pb, pb) - r > lower / 1000;
            if (d0 - lower > Math.min(T.CHECK, reach(a, k) + reach(a, k + 1) + 2) || (pointsClear && d0 > lower)) continue;
            // The swept distance's gradient in each end: the shape's normal at
            // the nearer end, shared by where along the capsule it is nearest.
            const span: IAutoMovieVector3 = Vector3.subtract(pb, pa);
            const u: number = Math.min(1, Math.max(0, Vector3.dot(Vector3.subtract(frame.shapes[shape]!.centre, pa), span) / Math.max(1e-12, Vector3.dot(span, span))));
            const nearer: number = G.gap(frame, shape, pa, pa) <= G.gap(frame, shape, pb, pb) ? 0 : 1;
            const g: IAutoMovieVector3 = G.normal(frame, shape, nearer === 0 ? pa : pb);
            const ga: IAutoMovieVector3 = Vector3.scale(g, 1 - u);
            const gb: IAutoMovieVector3 = Vector3.scale(g, u);
            const s: ILinear = join(
              ...(inner(k) ? [along(a, k, jac[a]![k]!.probes[probe]!, ga)] : []),
              ...(inner(k + 1) ? [along(a, k + 1, jac[a]![k + 1]!.probes[probe]!, gb)] : []),
            );
            if (s.idx.length > 0) rows.push({ key: `w|${a}|${k}|${probe}|${shape}`, index: s.idx, coef: s.coef, l: lower - d0, u: Infinity, weight: mu });
          }
        }
      }
      for (let k: number = 1; k < n; ++k) {
        if (!inner(k)) continue;
        const site: M.ISite | undefined = c.sites[a]![k];
        const placedK: G.IPlaced = at.placed[a]![k]!;
        if (site !== undefined) {
          const at: P.ILocated = P.located(c, at0.placed, a, k, site);
          const contact0: IAutoMovieVector3 = P.pad(placedK, site.contact);
          const off: IAutoMovieVector3 = Vector3.scale(Vector3.subtract(contact0, at.point), 1000);
          const n: IAutoMovieVector3 | undefined = at.normal;
          // The contact's motion, less the riding segment's motion at it: the
          // relative contact; a site that rides nothing has none.
          const relative = (dir: IAutoMovieVector3): ILinear => {
            const own: ILinear = along(a, k, jac[a]![k]!.pad, dir);
            if (at.on === undefined) return own;
            const b: number = at.on.arm;
            const carried: IAutoMovieVector3[] = jac[b]![k]!.segments.map((column) =>
              Vector3.add(column[at.on!.owner].origin, Vector3.scale(Vector3.cross(column[at.on!.owner].omega, Vector3.subtract(contact0, at.on!.origin)), 1000)),
            );
            return join(own, along(b, k, carried, dir, -1));
          };
          if (n === undefined)
            for (const e of P.AXES) {
              const v: ILinear = relative(e);
              const r0: number = Vector3.dot(off, e);
              rows.push({ key: `e|${a}|${k}|${e.x}${e.y}${e.z}`, index: v.idx, coef: v.coef, l: -r0, u: -r0, weight: mu });
            }
          else {
            // The contact anywhere on the region's disc about the site,
            // pulled toward the site itself.
            const slide: IAutoMovieVector3 = Vector3.subtract(off, Vector3.scale(n, Vector3.dot(off, n)));
            for (const e of P.tangents(n)) {
              const v: ILinear = relative(e);
              square(T.SITE, Vector3.dot(off, e), v.idx, v.coef);
            }
            const length: number = Vector3.length(slide);
            if (length > 1e-6) {
              const v: ILinear = relative(Vector3.scale(slide, 1 / length));
              rows.push({ key: `d|${a}|${k}`, index: v.idx, coef: v.coef, l: -Infinity, u: 1000 * site.disc - length, weight: mu });
            }
            // The contact's height above the touched collider no lower than
            // the site's own, and the least above it that clears.
            const v: ILinear = relative(at.normalAt(contact0));
            const lift: number = 1000 * (at.gap(contact0) - at.gap(at.point));
            rows.push({ key: `l|${a}|${k}`, index: v.idx, coef: v.coef, l: -lift, u: Infinity, weight: mu });
            square(T.LIFT, lift, v.idx, v.coef);
          }
          if (site.rotation !== undefined) {
            const r: IAutoMovieVector3 = P.rotationVector(at.rotation ?? site.rotation, placedK.hand);
            for (const e of P.AXES) {
              const v: ILinear = along(a, k, jac[a]![k]!.hand, e);
              square(T.ROTATION, Vector3.dot(r, e), v.idx, v.coef);
            }
          }
        }
        // One row per segment and shape, its deepest probe's (TrajOpt's
        // per-link pair, its distance at the closest points).
        for (const pair of (at.pairs[a]?.[k]?.deepest ?? P.deepest(c, a, k, placedK)).values()) {
          if (-pair.short > Math.min(T.CHECK, reach(a, k) + 2)) continue;
          const g: IAutoMovieVector3 = G.normal(c.frames[a]![k]!, pair.shape, placedK.probes[pair.probe]![0]);
          const v: ILinear = along(a, k, jac[a]![k]!.probes[pair.probe]!, g);
          rows.push({ key: `c|${a}|${k}|${pair.probe}|${pair.shape}`, index: v.idx, coef: v.coef, l: pair.short, u: Infinity, weight: mu });
          if (pair.rested) square(T.LIFT, -pair.short, v.idx, v.coef);
        }
        // The body's corners in the arm's own colliders: only the arm moves,
        // so the corner's distance falls by the shape's motion along its
        // outward normal there.
        for (const pair of (at.pairs[a]?.[k]?.embedded ?? P.embedded(c, a, k, placedK)).values()) {
          if (-pair.short > Math.min(T.CHECK, reach(a, k) + 2)) continue;
          const p: IAutoMovieVector3 = c.frames[a]![k]!.body[pair.corner]!.point;
          const g: IAutoMovieVector3 = physicalShapeNormal(pair.shape.pose, pair.shape.shape, p, Vector3.normalize(Vector3.subtract(p, pair.shape.centre)));
          const v: ILinear = along(a, k, carried(a, k, pair.owner, p), g, -1);
          rows.push({ key: `i|${a}|${k}|${pair.corner}|${pair.index}`, index: v.idx, coef: v.coef, l: pair.short, u: Infinity, weight: mu });
          if (pair.rested) square(T.LIFT, -pair.short, v.idx, v.coef);
        }
        // Ranges, hard: the chart's disc linearised, and the boxes.
        const v: readonly number[] = arm[k]!;
        const xy: number = Math.hypot(v[0]!, v[1]!);
        if (xy > 0.6 * G.SCALE)
          rows.push({ key: `r|${a}|${k}`,
            index: [index(a, k, 0), index(a, k, 1)],
            coef: [v[0]! / xy, v[1]! / xy],
            l: -Infinity,
            u: Math.max(G.SCALE, Math.hypot(c.rest[a]![0]!, c.rest[a]![1]!), Math.hypot(c.back[a]![0]!, c.back[a]![1]!)) - xy,
          });
        c.free[a]!.forEach((d: number, f: number): void => {
          const b = c.bounds[a]![d];
          if (b === null || b === undefined) return;
          rows.push({ key: `b|${a}|${k}|${d}`, index: [index(a, k, f)], coef: [1], l: b[0] - v[d]!, u: b[1] - v[d]! });
        });
      }
    });
    // Each arm's probes clear of the other arm's own colliders as both
    // move: the probe's motion less the other segment's motion at the probe.
    if (x.length === 2)
      for (let k: number = 1; k < n; ++k)
        for (const pair of inner(k) ? P.crossing(c, k, at.placed[0]![k]!, at.placed[1]![k]!).values() : []) {
          if (-pair.short > Math.min(T.CHECK, reach(0, k) + reach(1, k) + 2)) continue;
          const a: number = pair.a;
          const b: number = 1 - a;
          const p: IAutoMovieVector3 = at.placed[a]![k]!.probes[pair.probe]![0];
          const g: IAutoMovieVector3 = physicalShapeNormal(pair.shape.pose, pair.shape.shape, p, Vector3.normalize(Vector3.subtract(p, pair.shape.centre)));
          const s: ILinear = join(along(a, k, jac[a]![k]!.probes[pair.probe]!, g), along(b, k, carried(b, k, pair.owner, p), g, -1));
          rows.push({ key: `x|${pair.a}|${k}|${pair.probe}|${pair.bone}`, index: s.idx, coef: s.coef, l: pair.short, u: Infinity, weight: mu });
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

/** A segment's motion per coordinate unit: its origin's, millimetres, and its turn, radians. */
interface IMotion {
  origin: IAutoMovieVector3;
  omega: IAutoMovieVector3;
}

/** Every Jacobian of one arm at one waypoint, a column per free coordinate. */
interface IJacobian {
  /** Each probe's motion, millimetres per coordinate unit. */
  probes: IAutoMovieVector3[][];
  /** The contact's motion, millimetres per coordinate unit. */
  pad: IAutoMovieVector3[];
  /** The hand's rotation vector off its site, degrees per coordinate unit. */
  hand: IAutoMovieVector3[];
  /** The farthest any probe moves per unit of every coordinate together, millimetres: what a trust region lets a probe travel. */
  move: number;
  /** Each segment's motion. */
  segments: Record<"upper" | "lower" | "hand", IMotion>[];
}