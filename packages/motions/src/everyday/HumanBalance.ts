import {
  Quaternion,
  Vector3,
  convexHull2D,
  pointInHull,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { poseBones } from "./poseBones";

/**
 * How far the hips move back so the whole-body centre of mass stands over
 * the feet, found on the solved posture itself.
 *
 * A law that pitches the trunk forward over planted feet (a bow, a stoop)
 * builds its posture as a function of the hips' backward shift; this finds
 * the shift at which the engine's whole-body centre of mass
 * (`resolveAutoMovieCenterOfMass.place`, the segmental method of Winter,
 * Biomechanics and Motor Control of Human Movement, ch. 4) lies over the
 * middle of the feet's soles along the heading, the static balance
 * condition. The posture is solved (legs on their planted goals, arms on
 * theirs) and the centre placed from the solved bones at each trial of a
 * scan and bisection over the shift. Laws solve it once per plan at the
 * movement's deepest pitch and scale the shift with the sine of the pitch in
 * between, which is exact for a rigid upper body and leaves only the legs'
 * reconfiguration unmodelled at intermediate pitches; their captures check
 * the margin of stability (Hof et al. 2005) on every frame they draw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the balance condition, the engine owner, the iteration and how laws use the result.
 * @evidence contracts/development/implementation.md#principled-implementation Static balance: the engine's whole-body centre of mass over the base of support, by a scan and bisection on the solved posture.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One root find over a caller's posture builder.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No population table stands in for the body's own solved mass distribution.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most `STEPS` plus a dozen posture solves, once per plan.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Callers solve once per plan and reuse the result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The mass model is memoized per body in a WeakMap, released with the body.
 */
export namespace HumanBalance {
  /** Grid steps of the balance search over shifts from 0 to 0.4 hip heights. */
  export const STEPS: number = 16;

  /**
   * The hips' backward shift that puts the whole-body centre of mass over
   * the middle of the feet's soles along the heading.
   *
   * The shifts from 0 to 0.4 hip heights are scanned on a grid for the first
   * one at which the centre of mass no longer lies ahead of the soles, and
   * the crossing is refined by bisection to 0.5 mm. The scan is needed
   * because the centre stops following the hips once the planted legs reach
   * the limit of their range (in a deep squat the ankles cannot dorsiflex
   * further), where an iteration on the slope diverges. When no shift in the
   * range balances the body, the one that comes nearest is returned, and the
   * law's margin-of-stability verdict reports the remaining imbalance.
   *
   * @param body The body.
   * @param build The posture for a backward shift of the hips, metres.
   * @returns The shift, metres.
   */
  export function shift(
    body: IHumanBody,
    build: (back: number) => IHumanPosture,
  ): number {
    const error = (back: number): number => offset(body, build(back));
    const top: number = 0.4 * body.measure.hipHeight;
    let previous: number = 0;
    const before: number = error(0);
    if (before <= 0) return 0;
    let best: { back: number; error: number } = { back: 0, error: before };
    for (let k: number = 1; k <= STEPS; k++) {
      const back: number = (top * k) / STEPS;
      const e: number = error(back);
      if (e <= 0) {
        let lo: number = previous;
        let hi: number = back;
        while (hi - lo > 5e-4) {
          const mid: number = (lo + hi) / 2;
          if (error(mid) > 0) lo = mid;
          else hi = mid;
        }
        return (lo + hi) / 2;
      }
      if (e < best.error) best = { back, error: e };
      previous = back;
    }
    return best.back;
  }

  /**
   * The static margin of stability of a posture: the horizontal distance
   * from the engine's whole-body centre of mass to the edge of the hull of
   * both feet's heel, ball and toe points (Hof et al. 2005, with zero
   * velocity), positive inside.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns Metres.
   */
  export function margin(body: IHumanBody, posture: IHumanPosture): number {
    const bones = poseBones(body, resolveHumanPosture(body, posture));
    const support: IAutoMovieVector3[] = [];
    for (const side of ["Left", "Right"] as const)
      for (const point of ["heel", "ball", "toe"] as const) {
        const frame = body.surfaces.sockets[`${point}${side}`];
        support.push(
          resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!)
            .point,
        );
      }
    return resolveAutoMovieCenterOfMass.margin(
      resolveAutoMovieCenterOfMass.place(model(body), bones),
      support,
    );
  }

  /**
   * The dynamic margin of stability at an instant of a movement (Hof,
   * Gazendam and Sinke 2005): the engine's whole-body centre of mass plus
   * its velocity (a central difference over 1/240 s) over the inverted
   * pendulum's eigenfrequency `sqrt(g / l)` with `l` 1.34 hip heights (Hof's
   * leg length), measured to the edge of the feet's base, positive inside.
   *
   * @param body The body.
   * @param at The movement's posture at a second.
   * @param seconds The instant.
   * @returns Metres.
   */
  export function extrapolated(
    body: IHumanBody,
    at: (seconds: number) => IHumanPosture,
    seconds: number,
  ): number {
    const h: number = 1 / 240;
    const com = (t: number): IAutoMovieVector3 =>
      resolveAutoMovieCenterOfMass.place(
        model(body),
        poseBones(body, resolveHumanPosture(body, at(t))),
      );
    const a: IAutoMovieVector3 = com(seconds - h);
    const b: IAutoMovieVector3 = com(seconds + h);
    const velocity: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(b, a),
      1 / (2 * h),
    );
    const bones = poseBones(body, resolveHumanPosture(body, at(seconds)));
    const xcom: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.extrapolate(
      resolveAutoMovieCenterOfMass.place(model(body), bones),
      velocity,
      1.34 * body.measure.hipHeight,
    );
    const support: IAutoMovieVector3[] = [];
    for (const side of ["Left", "Right"] as const)
      for (const point of ["heel", "ball", "toe"] as const) {
        const frame = body.surfaces.sockets[`${point}${side}`];
        support.push(
          resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!)
            .point,
        );
      }
    return resolveAutoMovieCenterOfMass.margin(xcom, support);
  }

  /**
   * The engine's whole-body centre of mass of a posture and the support
   * points of its feet (heel, ball and toe of each), world metres.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns The centre and the support points.
   */
  export function support(
    body: IHumanBody,
    posture: IHumanPosture,
  ): { centre: IAutoMovieVector3; points: IAutoMovieVector3[] } {
    const bones = poseBones(body, resolveHumanPosture(body, posture));
    const points: IAutoMovieVector3[] = [];
    for (const side of ["Left", "Right"] as const)
      for (const point of ["heel", "ball", "toe"] as const) {
        const frame = body.surfaces.sockets[`${point}${side}`];
        points.push(
          resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!)
            .point,
        );
      }
    return {
      centre: resolveAutoMovieCenterOfMass.place(model(body), bones),
      points,
    };
  }

  /**
   * The margin of stability along one horizontal direction: how far a point
   * may move that way before it leaves the convex hull of the support
   * points, the margin against a perturbation pushing it that way (Hof et
   * al. 2005 measure the margin along the perturbation's direction).
   *
   * @param point The point (a centre of mass or its extrapolation), world metres; its height is ignored.
   * @param points The support points.
   * @param direction The direction, horizontal; normalized here.
   * @returns Metres to the hull's edge along the direction; negative when the point is outside the hull.
   */
  export function along(
    point: IAutoMovieVector3,
    points: readonly IAutoMovieVector3[],
    direction: IAutoMovieVector3,
  ): number {
    const hull: IAutoMovieVector3[] = convexHull2D(points);
    const d: number = Math.hypot(direction.x, direction.z);
    const dx: number = direction.x / d;
    const dz: number = direction.z / d;
    let exit: number = -Infinity;
    for (let i: number = 0; i < hull.length; i++) {
      const a: IAutoMovieVector3 = hull[i]!;
      const b: IAutoMovieVector3 = hull[(i + 1) % hull.length]!;
      const ex: number = b.x - a.x;
      const ez: number = b.z - a.z;
      const denominator: number = dx * ez - dz * ex;
      if (Math.abs(denominator) < 1e-12) continue;
      const t: number =
        ((a.x - point.x) * ez - (a.z - point.z) * ex) / denominator;
      const u: number =
        ((a.x - point.x) * dz - (a.z - point.z) * dx) / denominator;
      if (u >= -1e-12 && u <= 1 + 1e-12) exit = Math.max(exit, t);
    }
    if (exit === -Infinity) return -Infinity;
    return hull.length >= 3 && pointInHull(point, hull)
      ? exit
      : -Math.abs(exit);
  }

  /**
   * How far the whole-body centre of mass lies ahead of the middle of the
   * feet's soles along a posture's heading, metres.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns Metres; positive ahead.
   */
  export function offset(body: IHumanBody, posture: IHumanPosture): number {
    const bones = poseBones(body, resolveHumanPosture(body, posture));
    const com: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      model(body),
      bones,
    );
    const soles: IAutoMovieVector3[] = (["soleLeft", "soleRight"] as const).map(
      (name) =>
        resolveAutoMovieHumanoidSurfaces.place(
          body.surfaces.sockets[name],
          bones.get(body.surfaces.sockets[name].bone)!,
        ).point,
    );
    const middle: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(soles[0]!, soles[1]!),
      0.5,
    );
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, posture.yaw),
      { x: 0, y: 0, z: 1 },
    );
    return Vector3.dot(Vector3.subtract(com, middle), forward);
  }
}

/** Mass models by body. */
const MODELS: WeakMap<IHumanBody, resolveAutoMovieCenterOfMass.IModel> =
  new WeakMap();

/** The engine's mass model of a body, made once. */
function model(body: IHumanBody): resolveAutoMovieCenterOfMass.IModel {
  let out: resolveAutoMovieCenterOfMass.IModel | undefined = MODELS.get(body);
  if (out === undefined) {
    out = resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    MODELS.set(body, out);
  }
  return out;
}
