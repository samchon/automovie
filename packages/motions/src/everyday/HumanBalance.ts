import {
  Quaternion,
  Vector3,
  convexHull2D,
  pointInHull,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * How far the hips move back so the whole-body centre of mass stands over
 * the feet, found on the solved posture itself.
 *
 * A law that pitches the trunk forward over planted feet (a bow, a stoop)
 * builds its posture as a function of the hips' backward shift; this finds
 * the shift at which the engine's whole-body centre of mass
 * (`resolveAutoMovieCenterOfMass.place`, the segmental method of Winter,
 * Biomechanics and Motor Control of Human Movement, ch. 4) lies over the
 * middle of the base of support along the heading, the feet where they bear
 * (`HumanFoot.base`), the static balance condition. The posture is solved
 * (legs on their planted goals, arms on theirs) and the centre placed from the solved bones at each trial of a
 * scan and bisection over the shift. A bow solves it once per plan at its
 * deepest pitch and scales the shift with the sine of the pitch in between,
 * which is exact for a rigid upper body and leaves only the legs'
 * reconfiguration unmodelled at intermediate pitches; a lean into work,
 * whose reaching arm is no rigid part of the trunk, solves it at steps of
 * the pitch (`AutoMovieMotionHumanLeanInto`). Their captures check
 * the margin of stability (Hof et al. 2005) on every frame they draw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the balance condition, the engine owner, the iteration and how laws use the result.
 * @evidence contracts/development/design.md#principled-representation A namespace of pure functions over a body and postures returning world metres (shifts, margins, offsets) and points; the mass model is the engine's, memoized per body.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the motions balance queries over solved postures; read by the bow, bend, brace and rise laws, the everyday captures and the balance test; the centre-of-mass model, hull and margin belong to the engine and are imported.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No motions-local centre of mass or hull duplicates the engine's and no body or law is special-cased; one gap remains: `margin` is read only by the balance test, a member only a test reads.
 */
export namespace HumanBalance {
  /** Grid steps of the balance search over shifts from 0 to `RANGE` hip heights. */
  export const STEPS: number = 16;

  /** How far back the balance search looks unless told otherwise, hip heights: the shift of a trunk pitched over hips that stand over the feet. */
  export const RANGE: number = 0.4;

  /**
   * How far back the balance search looks for a posture whose hips may stand
   * anywhere the planted legs let them, hip heights: a leg's length ahead of
   * the feet, about one hip height, back to a foot's length behind them,
   * about 0.3.
   */
  export const REACH: number = 1.3;

  /** The resolution a balance search solves a shift or a travel to, metres: half a millimetre, under the millimetre the margins are reported in. */
  export const TOLERANCE: number = 5e-4;

  /**
   * The hips' backward shift that puts the whole-body centre of mass over
   * the base of support along the heading, the feet where they bear
   * (`HumanFoot.base`): over its middle (`offset`), or a stated distance
   * ahead of it (`target`), as a lean holds the centre where the body stood.
   *
   * The feet stand flat where they can, the larger base: a heel the planted
   * leg lifted with its ankle at its range is brought down by moving the
   * hips back, and on flat feet a centre ahead of the target is brought back
   * to it while one behind it is left where it is inside the base. Where no
   * shift within the range stands the body on flat feet with its centre
   * inside, it stands on the forefoot, and the hips and trunk bring the
   * centre over the middle of the forefoot, back when it is ahead and
   * forward when it is outside behind, as a deep squat with its heels up
   * does. The shifts from
   * 0 to `range` hip heights the needed way are scanned on a grid, of the
   * same step whatever the range, for the first one at which the centre reaches the target, or
   * the base, and the crossing is refined by bisection to 0.5 mm. The scan
   * is needed because the centre stops following the hips once the planted
   * legs reach the limit of their range, where an iteration on the slope
   * diverges, and because the base changes as a heel lifts. When no shift in
   * the range balances the body, the one that comes nearest is returned,
   * and the law's margin-of-stability verdict reports the remainder.
   *
   * @param body The body.
   * @param build The posture for a backward shift of the hips, metres; a negative shift moves them forward.
   * @param range How far the search looks either way, hip heights; `RANGE` when absent, and `REACH` for a posture whose hips do not start over the feet.
   * @param target How far ahead of the base's middle the centre is put, metres; 0, the middle itself, when absent.
   * @returns The shift, metres, negative forward; 0 when the centre lies inside the base no farther ahead than the target without one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the balance condition, the flat feet sought before the forefoot, the cases on each, the search range in hip heights, the 0.5 mm tolerance, why a scan precedes the bisection, and the nearest-shift result when none balances.
   * @evidence contracts/development/implementation.md#principled-implementation Static balance (centre of mass inside the base that bears after the leg fit, over its middle along the heading) found by a grid scan for the first sign change and bisection; bisection needs only a bracket, so it holds where the solved legs saturate their range and where the base changes under a lifting heel. A flat foot is the larger base, so it is sought before the forefoot.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading per trial (`read`), one scan-and-bisection over a sign; the balance measures live in one place.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ranges (`RANGE`, and `REACH` for a posture whose hips start away from the feet) and the tolerance (0.5 mm) are named search parameters, not tuned to a case; a body that cannot balance gets its nearest shift and the laws' stability verdicts report the remainder.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most three scans of `STEPS` + 1 posture solves over `RANGE` (in proportion more over a wider range) plus about log2(range / 0.5 mm), near 10, for the bisection, each a forward-kinematics pass with limb fits read once for both measures.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Not shared: each call balances its own builder.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing itself; the per-body mass model it reads is memoized in a WeakMap keyed by the body and released with it.
   */
  export function shift(
    body: IHumanBody,
    build: (back: number) => IHumanPosture,
    range: number = RANGE,
    target: number = 0,
  ): number {
    const at = (back: number): IReading => read(body, build(back));
    const start: IReading = at(0);
    // One grid step is `RANGE / STEPS` hip heights whatever the range, so a
    // wider search finds the same first crossing a narrower one does.
    const step: number = (RANGE * body.measure.hipHeight) / STEPS;
    const steps: number = Math.ceil((STEPS * range) / RANGE - 1e-9);
    // The first shift from `from` the given way at which `error` is no
    // longer positive, refined by bisection, or the one that came nearest
    // when none is within the range.
    const first = (
      from: number,
      sign: number,
      error: (r: IReading) => number,
    ): { found: boolean; back: number } => {
      let previous: number = from;
      let best: { back: number; error: number } = {
        back: from,
        error: error(at(from)),
      };
      if (best.error <= 0) return { found: true, back: from };
      for (let k: number = 1; k <= steps; k++) {
        const back: number = from + sign * step * k;
        const e: number = error(at(back));
        if (e <= 0) {
          let lo: number = previous;
          let hi: number = back;
          while (Math.abs(hi - lo) > TOLERANCE) {
            const mid: number = (lo + hi) / 2;
            if (error(at(mid)) > 0) lo = mid;
            else hi = mid;
          }
          return { found: true, back: hi };
        }
        if (e < best.error) best = { back, error: e };
        previous = back;
      }
      return { found: false, back: best.back };
    };
    const ahead = (r: IReading): number => r.offset - target;
    // Flat feet first: a heel the planted leg lifted is brought down by
    // moving the hips back; on flat feet a centre ahead of the target is
    // brought back to it, and one behind it is left while it lies inside.
    const down: { found: boolean; back: number } = first(
      0,
      1,
      (r: IReading): number => (r.flat ? 0 : 1),
    );
    if (down.found) {
      const landed: IReading = at(down.back);
      if (ahead(landed) > 0) return first(down.back, 1, ahead).back;
      if (landed.margin > 0) return down.back;
    }
    // Otherwise the forefoot: the centre brought over its middle, back when
    // ahead of it, forward when outside behind it.
    if (ahead(start) > 0) return first(0, 1, ahead).back;
    if (start.margin > 0) return 0;
    return first(0, -1, (r: IReading): number => -ahead(r)).back;
  }
  /**
   * The static margin of stability of a posture: the horizontal distance
   * from the engine's whole-body centre of mass to the edge of the hull of
   * base of support, the feet's outlines where they bear (`HumanFoot.base`) (Hof et al. 2005, with zero
   * velocity), positive inside.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measured quantity, its sign, the support points used and the static (zero-velocity) form of Hof's margin.
   * @evidence contracts/development/implementation.md#principled-implementation Hof et al. 2005 margin with zero velocity: the engine's segmental centre of mass to the convex hull of the feet's bearing outlines (`HumanFoot.base`), from the solved posture's bones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Solves the posture once for both balance measures (`read`), gathers the feet's bearing outline points and delegates the hull distance to the engine's `resolveAutoMovieCenterOfMass.margin`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case: every posture uses the same bearing outlines and the engine's model.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve plus the hull of the two outlines' points.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure query; nothing to reuse across calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing itself; the per-body mass model it reads is memoized in a WeakMap keyed by the body and released with it.
   */
  export function margin(body: IHumanBody, posture: IHumanPosture): number {
    return read(body, posture).margin;
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
   * @evidence contracts/development/implementation.md#principled-implementation Hof, Gazendam and Sinke 2005 extrapolated centre of mass: position plus velocity over sqrt(g / l) with l = 1.34 hip heights (Hof's leg length), velocity by a central difference over 1/240 s of the movement's own postures, measured to the hull of the feet's bearing outlines.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds the centre at three instants and hands extrapolation and margin to the engine; the base's gathering repeats `margin`'s reading on the bones already solved for the instant.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 1/240 s step is a numerical choice finer than the 24 Hz film and the length is Hof's (`resolveAutoMovieCenterOfMass.pendulum`); the difference amplifies any discontinuity in the caller's posture function, which callers must keep smooth.
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
      resolveAutoMovieCenterOfMass.pendulum(body.measure.hipHeight),
    );
    return resolveAutoMovieCenterOfMass.margin(
      xcom,
      HumanFoot.base(body, bones),
    );
  }

  /**
   * The engine's whole-body centre of mass of a posture and the support
   * points of its feet (the bearing outline of each, `HumanFoot.base`), world metres.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns The centre and the support points.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned, its frame and which sockets form the support.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's segmental centre of mass and the feet's bearing outline points of the solved posture, for callers that measure margins along a direction.
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
    return {
      centre: resolveAutoMovieCenterOfMass.place(model(body), bones),
      points: HumanFoot.base(body, bones),
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
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n log n) for the hull of n support points (two foot outlines in practice) plus O(n) for its edges.
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
   * base of support along a posture's heading, metres: the middle between
   * the rearmost and the foremost point of the feet where they bear
   * (`HumanFoot.base`), so a heel lifted off the floor moves the middle
   * forward over the forefoot the body then stands on.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns Metres; positive ahead.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the quantity, the reference (the bearing base's middle along the heading), the axis (the posture's heading) and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's centre of mass minus the middle of the base that bears after the leg fit, both projected on the heading from the posture's yaw: the static balance error `shift` drives to zero, which a heel-off moves with the base.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One solve read for both balance measures (`read`) and one projection; `shift` uses it as its error.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case present.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure query; nothing to reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing itself; the per-body mass model it reads is memoized in a WeakMap keyed by the body and released with it.
   */
  export function offset(body: IHumanBody, posture: IHumanPosture): number {
    return read(body, posture).offset;
  }
}

/** A posture's balance: `HumanBalance.offset` and `HumanBalance.margin`, metres, and whether both heels bear. */
interface IReading {
  offset: number;
  margin: number;
  flat: boolean;
}

/** A posture's balance, read on one solve of it. */
function read(body: IHumanBody, posture: IHumanPosture): IReading {
  const bones: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture(body, posture),
  );
  const com: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
    model(body),
    bones,
  );
  const base: IAutoMovieVector3[] = HumanFoot.base(body, bones);
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, posture.yaw),
    { x: 0, y: 0, z: 1 },
  );
  let rear: number = Infinity;
  let front: number = -Infinity;
  for (const p of base) {
    const along: number = Vector3.dot(p, forward);
    rear = Math.min(rear, along);
    front = Math.max(front, along);
  }
  return {
    offset: Vector3.dot(com, forward) - (rear + front) / 2,
    margin: resolveAutoMovieCenterOfMass.margin(com, base),
    // A heel bears within the bearing height of the foot's lowest sole
    // socket, the ball or the toe a foot stands on either way.
    flat: (["left", "right"] as const).every(
      (side: "left" | "right"): boolean => {
        const sockets: HumanFoot.ISocket[] = HumanFoot.sockets(
          body,
          bones,
          side,
        );
        return (
          sockets[0]!.point.y <=
          Math.min(sockets[1]!.point.y, sockets[2]!.point.y) +
            HumanFoot.BEARING
        );
      },
    ),
  };
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
