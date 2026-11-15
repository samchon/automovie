import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
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
    body: IHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    points: readonly IAutoMovieVector3[] = HumanFoot.base(body, bones),
  ): IReading {
    const com: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      model(body),
      bones,
    );
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
    body: IHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    motions: readonly HumanJacobian.IMotion[],
    reading: IReading,
  ): number[][] {
    const m: resolveAutoMovieCenterOfMass.IModel = model(body);
    const centre: IAutoMovieVector3[] = motions.map(
      (motion: HumanJacobian.IMotion): IAutoMovieVector3 => {
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
      },
    );
    return reading.outline.map(
      (_: { x: number; z: number }, k: number): number[] => {
        const n: { x: number; z: number } = inward(reading.outline, k);
        return centre.map(
          (v: IAutoMovieVector3): number => n.x * v.x + n.z * v.z,
        );
      },
    );
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
    const turn = (
      o: { x: number; z: number },
      a: { x: number; z: number },
      b: { x: number; z: number },
    ): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    const chain = (
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
  const MODELS: WeakMap<IHumanBody, resolveAutoMovieCenterOfMass.IModel> =
    new WeakMap();

  /** A body's mass model, made once. */
  function model(body: IHumanBody): resolveAutoMovieCenterOfMass.IModel {
    let out: resolveAutoMovieCenterOfMass.IModel | undefined = MODELS.get(body);
    if (out === undefined) {
      out = resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
      MODELS.set(body, out);
    }
    return out;
  }
}
