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
import { poseBones } from "../posture/poseBones";

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
 * @evidence contracts/development/design.md#principled-representation A namespace of pure functions over a body and postures returning world metres (shifts, margins, offsets) and points; the mass model is the engine's, memoized per body.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the motions balance queries over solved postures; read by the bow, bend, brace and rise laws, the everyday captures and the balance test; the centre-of-mass model, hull and margin belong to the engine and are imported.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No motions-local centre of mass or hull duplicates the engine's and no body or law is special-cased; one gap remains: `margin` is read only by the balance test, a member only a test reads.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the balance condition, the search range in hip heights, the 0.5 mm tolerance, why a scan precedes the bisection, and the nearest-shift result when none balances.
   * @evidence contracts/development/implementation.md#principled-implementation Static balance (centre of mass over the middle of the soles along the heading) found by a grid scan for the first sign change and bisection; bisection needs only a bracket, so it holds where the solved legs saturate their range and the error stops responding to the shift.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One root find over the caller's posture builder; the error is `offset`, so the balance measure lives in one place.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The range (0.4 hip heights) and tolerance (0.5 mm) are named search parameters, not tuned to a case; a body that cannot balance gets its nearest shift and the laws' stability verdicts report the remainder.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most `STEPS` + 1 posture solves for the scan plus about log2(range / 0.5 mm), near 10, for the bisection, each a forward-kinematics pass with limb fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Not shared: callers solve once per plan at the deepest pitch and scale the result, so no two calls share a posture.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing itself; the per-body mass model it reads is memoized in a WeakMap keyed by the body and released with it.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measured quantity, its sign, the support points used and the static (zero-velocity) form of Hof's margin.
   * @evidence contracts/development/implementation.md#principled-implementation Hof et al. 2005 margin with zero velocity: the engine's segmental centre of mass to the convex hull of both feet's heel, ball and toe sockets, from the solved posture's bones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Solves the posture, gathers the six sole sockets and delegates the hull distance to the engine's `resolveAutoMovieCenterOfMass.margin`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case: every posture uses the same six sockets and the engine's model.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve plus a six-point hull.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure query; nothing to reuse across calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing itself; the per-body mass model it reads is memoized in a WeakMap keyed by the body and released with it.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the extrapolation, the difference step, the pendulum length convention, the support and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation Hof, Gazendam and Sinke 2005 extrapolated centre of mass: position plus velocity over sqrt(g / l) with l = 1.34 hip heights (Hof's leg length), velocity by a central difference over 1/240 s of the movement's own postures, measured to the six-socket hull.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds the centre at three instants and hands extrapolation and margin to the engine; the six-socket gathering repeats `margin`'s loop on the bones already solved for the instant.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 1/240 s step is a numerical choice finer than the 24 Hz film and the 1.34 factor is Hof's; the difference amplifies any discontinuity in the caller's posture function, which callers must keep smooth.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three posture solves per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Not shared: each call evaluates its own instant.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing itself; the per-body mass model it reads is memoized in a WeakMap keyed by the body and released with it.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned, its frame and which sockets form the support.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's segmental centre of mass and the six sole sockets of the solved posture, for callers that measure margins along a direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns the raw centre and points so `along` can measure any direction without solving again.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case present.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Callers reuse its result for several directions (the brace verdicts read the push and lateral margins from one call).
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing itself; the per-body mass model it reads is memoized in a WeakMap keyed by the body and released with it.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measured distance, the frame (horizontal, height ignored), the direction's normalisation and the sign outside the hull.
   * @evidence contracts/development/implementation.md#principled-implementation Casts the horizontal point along the direction against each edge of the engine's convex hull of the support points and takes the farthest crossing, the exit; inside-ness comes from the engine's `pointInHull`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the hull's edges; the hull and containment come from the engine.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 1e-12 tolerances guard parallel edges and endpoint hits numerically; a hull of fewer than three points counts as outside, and a zero direction is not guarded (callers pass unit headings).
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n log n) for the hull of n support points (six in practice) plus O(n) for its edges.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function; nothing to reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates the hull per call and retains nothing.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the quantity, the reference (the soles' middle), the axis (the posture's heading) and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's centre of mass minus the middle of the two sole sockets, projected on the heading from the posture's yaw: the static balance error `shift` drives to zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One solve and one projection; `shift` uses it as its error.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case present.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure query; nothing to reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing itself; the per-body mass model it reads is memoized in a WeakMap keyed by the body and released with it.
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
