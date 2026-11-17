import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanJacobian, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion, Vector3, resolveAutoMovieCenterOfMass } from "@automovie/engine";
import { HumanFoot } from "./HumanFoot";
import { HumanJacobian } from "./HumanJacobian";

/**
 * A posed body's static balance as rows of a whole-body fit
 * (`HumanBodyFit`): its centre of mass over the floor kept inside the
 * outline of the feet where they bear (`HumanFoot.base`), the base of
 * support (Winter, Biomechanics and Motor Control of Human Movement, ch. 4).
 *
 * The outline is the convex hull of the bearing points on the floor, and
 * each of its edges is a row: the centre's signed
 * distance inside that edge, at or above nought. The centre of mass is the
 * engine's mass model's (`resolveAutoMovieCenterOfMass`) and its Jacobian
 * the mass-weighted sum of its segments' centres' point columns
 * (`HumanJacobian.velocity`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the balance kept, its base with its source, the rows and the centre's Jacobian.
 * @evidence contracts/development/design.md#principled-representation The base of support as a convex polygon's half-planes, the linear form a quadratic program bounds a point by.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reading and its rows' slopes, read by the whole-body fit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The base is the feet's own bearing outline and the mass model the engine's.
 */
export namespace HumanFitBalance {
  /** A posed body's balance. */
  export interface IReading {
    /** The centre of mass, world metres. */
    com: IAutoMovieVector3;

    /** The base of support's corners on the floor, in order round its convex hull. */
    outline: { x: number; z: number }[];

    /** Each edge's signed distance of the centre inside it, metres, in the outline's order. */
    inside: number[];
  }

  /**
   * The balance of a posed body.
   *
   * @param body The body.
   * @param bones Its resolved bones.
   * @param points The points that bear, world metres, whose convex hull on the floor is the base; the feet's bearing outline (`HumanFoot.base`) when absent.
   * @returns The reading.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    points: readonly IAutoMovieVector3[] = HumanFoot.base(body, bones),
  ): IReading {
    const com: IAutoMovieVector3 = centre(body, bones);
    const outline: { x: number; z: number }[] = hull(
      points.map((p: IAutoMovieVector3): { x: number; z: number } => ({
        x: p.x,
        z: p.z,
      })),
    );
    return {
      com,
      outline,
      inside: outline.map((_: { x: number; z: number }, k: number): number =>
        distance(outline, k, com),
      ),
    };
  }

  /**
   * A point's signed distance inside an outline's edge.
   *
   * @param outline The outline.
   * @param k The edge, from corner `k` to the next.
   * @param point The point, world metres; its height is not read.
   * @returns Metres, positive inside.
   */
  export function distance(
    outline: readonly { x: number; z: number }[],
    k: number,
    point: IAutoMovieVector3,
  ): number {
    const a: { x: number; z: number } = outline[k]!;
    const n: { x: number; z: number } = inward(outline, k);
    return n.x * (point.x - a.x) + n.z * (point.z - a.z);
  }

  /**
   * Each edge's row slope: how fast each variable moves the centre inside
   * that edge, metres per the variable's unit.
   *
   * @param body The body.
   * @param bones The resolved bones the motions were read on.
   * @param motions The variables' motions.
   * @param reading The balance read on those bones.
   * @returns One slope row per edge, one entry per variable.
   */
  export function slopes(
    body: IAutoMovieMotionHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    motions: readonly IAutoMovieMotionHumanJacobian.IMotion[],
    reading: IReading,
  ): number[][] {
    const columns: IAutoMovieVector3[] = velocities(body, bones, motions);
    return reading.outline.map(
      (_: { x: number; z: number }, k: number): number[] => {
        const n: { x: number; z: number } = inward(reading.outline, k);
        return columns.map(
          (v: IAutoMovieVector3): number => n.x * v.x + n.z * v.z,
        );
      },
    );
  }

  /**
   * The body's segmental centre in world metres.
   *
   * @param body The body and its physical profile.
   * @param bones The resolved bones.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the physical inputs, frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's segmental mass-weighted centre, shared with the support reading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call on the existing mass model.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bone stands in for the mass centre.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in mass segments, with no forward kinematics.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the per-body mass model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no new state.
   */
  export function centre(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieVector3 {
    return resolveAutoMovieCenterOfMass.place(model(body), bones);
  }

  /**
   * The mass centre's velocity under each posture variable.
   *
   * @param body The body and its mass model.
   * @param bones The bones on which the motions were derived.
   * @param motions The geometric Jacobian's variable motions.
   * @returns World metres per variable unit, in motion order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units and variable ordering.
   * @evidence contracts/development/implementation.md#principled-implementation Differentiating the segmental centre gives the mass-weighted sum of each segment centre's rigid-point velocity, divided by total mass.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One segment sum per variable.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same segment masses and local centres as the actual centre reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in variables times mass segments; no perturbed fits or forward kinematics.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The support-edge slopes and positional centre goals share this one mass Jacobian.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function velocities(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    motions: readonly IAutoMovieMotionHumanJacobian.IMotion[],
  ): IAutoMovieVector3[] {
    const m: IAutoMovieResolveCenterOfMass.IModel = model(body);
    return motions.map((motion: IAutoMovieMotionHumanJacobian.IMotion): IAutoMovieVector3 => {
      let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      for (const s of m.segments) {
        const b: IAutoMovieResolvedBone | undefined = bones.get(s.bone);
        if (b === undefined) continue;
        const at: IAutoMovieVector3 = Vector3.add(
          b.worldPosition,
          Quaternion.rotateVector(b.worldRotation, s.point),
        );
        sum = Vector3.add(
          sum,
          Vector3.scale(HumanJacobian.velocity(motion, s.bone, at), s.mass),
        );
      }
      return Vector3.scale(sum, 1 / m.mass);
    });
  }

  /** The unit inward normal of an outline's edge from corner `k` to the next. */
  function inward(
    outline: readonly { x: number; z: number }[],
    k: number,
  ): { x: number; z: number } {
    const a: { x: number; z: number } = outline[k]!;
    const b: { x: number; z: number } = outline[(k + 1) % outline.length]!;
    const dx: number = b.x - a.x;
    const dz: number = b.z - a.z;
    const length: number = Math.hypot(dx, dz) || 1;
    const n: { x: number; z: number } = { x: -dz / length, z: dx / length };
    // The normal that points toward the outline's centroid, which a convex
    // outline holds inside, whichever way the corners run.
    let cx: number = 0;
    let cz: number = 0;
    for (const p of outline) {
      cx += p.x / outline.length;
      cz += p.z / outline.length;
    }
    return n.x * (cx - a.x) + n.z * (cz - a.z) >= 0 ? n : { x: -n.x, z: -n.z };
  }

  /** The convex hull of points on the floor, its corners in order round it (Andrew's monotone chain). */
  function hull(
    points: readonly { x: number; z: number }[],
  ): { x: number; z: number }[] {
    const sorted: { x: number; z: number }[] = [...points].sort(
      (a: { x: number; z: number }, b: { x: number; z: number }): number =>
        a.x - b.x || a.z - b.z,
    );
    if (sorted.length < 3) return sorted;
    const turn: (
      o: { x: number; z: number },
      a: { x: number; z: number },
      b: { x: number; z: number },
    ) => number = (
      o: { x: number; z: number },
      a: { x: number; z: number },
      b: { x: number; z: number },
    ): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    const chain: (
      list: readonly { x: number; z: number }[],
    ) => { x: number; z: number }[] = (
      list: readonly { x: number; z: number }[],
    ): { x: number; z: number }[] => {
      const out: { x: number; z: number }[] = [];
      for (const p of list) {
        while (
          out.length >= 2 &&
          turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0
        )
          out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    return [...chain(sorted), ...chain([...sorted].reverse())];
  }

  /** The mass models made, by body. */
  const MODELS: WeakMap<IAutoMovieMotionHumanBody, IAutoMovieResolveCenterOfMass.IModel> =
    new WeakMap();

  /** A body's mass model, made once. */
  function model(body: IAutoMovieMotionHumanBody): IAutoMovieResolveCenterOfMass.IModel {
    let out: IAutoMovieResolveCenterOfMass.IModel | undefined = MODELS.get(body);
    if (out === undefined) {
      out = resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
      MODELS.set(body, out);
    }
    return out;
  }
}
