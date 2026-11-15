import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/convexHull2D";
import { pointInHull } from "../math/pointInHull";
import { AutoMovieGravity } from "../physics/AutoMovieGravity";
import { resolveAutoMovieCenterOfMass } from "./resolveAutoMovieCenterOfMass";

/**
 * What an impulse does to a standing body's balance (#3429): it absorbs it
 * within its base, catches it with capture steps, or falls.
 *
 * The impulse `J` changes the centre of mass's velocity to `v + J / m` and
 * its angular momentum about the centre by `(p - c) × J`. The body is a
 * linear inverted pendulum of length `l` with eigenfrequency `ω0 = sqrt(g /
 * l)`, whose extrapolated centre `ξ = x + v / ω0` must lie within the base
 * of support for the body to stay (Hof, Gazendam and Sinke 2005, J Biomech
 * 38:1-8): inside the support polygon, the body absorbs the push.
 *
 * Outside it, the body steps. A step lands at most `reach` (a leg length,
 * as `stagger` reaches) from the centre along the push, and a foot set down
 * catches the extrapolated centre when it lands within its half length,
 * `margin`, of it. A step that falls short leaves the extrapolated centre
 * diverging from the new foot as the pendulum does, `e(t) = e0 exp(ω0 t)`,
 * for the step's time `step`, so the distance still to catch after `k`
 * steps follows `e_{k+1} = (e_k - reach) exp(ω0 step)`: the capturability
 * of the linear inverted pendulum by a sequence of steps of bounded length
 * and time, derived here from the pendulum's divergence; it follows the
 * framework of the N-step capture regions of Koolen, de Boer, Rebula,
 * Goswami and Pratt 2012 ("Capturability-based analysis and control of
 * legged locomotion, Part 1", Int J Robot Res 31(9)), located but not yet
 * read at the source.
 * The sequence shrinks to a catch exactly when `e0` is below its fixed point
 * `e* = reach a / (a - 1)`, `a = exp(ω0 step)`, Koolen's infinite-step
 * capture distance; at or past it no number of steps catches the body and
 * it falls. The steps are laid along the push from the centre.
 *
 * The bounds are the impulse magnitudes along the push's horizontal
 * direction at which the outcome changes: `m ω0 b` to leave the base, with
 * `b` the distance from the current extrapolated centre to the base's edge
 * along the push, and `m ω0 (e* - margin - lead)` to leave the capture
 * region, with `lead` the current extrapolated centre's distance from the
 * centre along the push.
 *
 * @param props The body's state, the impulse and the support.
 * @returns The outcome, the steps and the bounds.
 * @throws {Error} When the mass, the length, the reach or the step time is not positive, or there is no support point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the impulse's effect, the pendulum, the absorb condition with its source, the stepping recurrence with its source and fixed point, where steps are laid and the bounds.
 * @evidence contracts/development/implementation.md#principled-implementation Hof's extrapolated centre against the support polygon for absorption; the linear inverted pendulum's divergence between steps of bounded length and time for N-step capture, derived from the pendulum's divergence in Koolen et al.'s framework (not yet read at the source), whose fixed point is the infinite-step capture distance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The state after the impulse, the absorb test, the stepping recurrence, the bounds.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No count of steps is assumed: the recurrence itself ends in a catch or diverges, so the outcome follows from the impulse alone.
 * @evidence contracts/development/implementation.md#efficient-algorithms One hull of the support and a recurrence whose length is the number of steps it lays.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function resolveAutoMovieBalanceOutcome(
  props: resolveAutoMovieBalanceOutcome.IProps,
): resolveAutoMovieBalanceOutcome.IOutcome {
  const { mass, length, reach, step } = props;
  if (!(mass > 0 && length > 0 && reach > 0 && step > 0))
    throw new Error(
      "The balance outcome needs a positive mass, pendulum length, reach and step time",
    );
  if (props.support.length === 0)
    throw new Error("The balance outcome needs a support point");
  const gravity: number = props.gravity ?? AutoMovieGravity.STANDARD;
  const w0: number = resolveAutoMovieCenterOfMass.frequency(length, gravity);
  const velocity: IAutoMovieVector3 = Vector3.add(
    props.velocity,
    Vector3.scale(props.impulse, 1 / mass),
  );
  const angular: IAutoMovieVector3 = Vector3.cross(
    Vector3.subtract(props.at ?? props.centre, props.centre),
    props.impulse,
  );
  const extrapolated: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.extrapolate(
    props.centre,
    velocity,
    length,
    gravity,
  );
  const hull: IAutoMovieVector3[] = convexHull2D(props.support);

  // The capture distance of infinitely many steps, Koolen's fixed point.
  const a: number = Math.exp(w0 * step);
  const capturable: number = (reach * a) / (a - 1);

  // The push's horizontal direction, and the bounds along it.
  const flat = (v: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: v.x,
    y: 0,
    z: v.z,
  });
  const push: IAutoMovieVector3 = flat(props.impulse);
  const pushed: number = Vector3.length(push);
  const direction: IAutoMovieVector3 =
    pushed > 0 ? Vector3.scale(push, 1 / pushed) : { x: 0, y: 0, z: 0 };
  const before: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.extrapolate(
    props.centre,
    props.velocity,
    length,
    gravity,
  );
  const lead: number = Vector3.dot(
    flat(Vector3.subtract(before, props.centre)),
    direction,
  );
  const bounds: resolveAutoMovieBalanceOutcome.IBounds = {
    absorb:
      pushed > 0
        ? mass * w0 * Math.max(0, exit(hull, before, direction))
        : Number.POSITIVE_INFINITY,
    step:
      pushed > 0
        ? mass * w0 * Math.max(0, capturable - props.margin - lead)
        : Number.POSITIVE_INFINITY,
  };

  const base: Omit<resolveAutoMovieBalanceOutcome.IOutcome, "outcome" | "steps"> = {
    velocity,
    angular,
    extrapolated,
    bounds,
  };
  if (resolveAutoMovieCenterOfMass.margin(extrapolated, hull) > 0)
    return { ...base, outcome: "absorb", steps: [] };

  // Steps along the extrapolated centre's lead from the centre.
  const away: IAutoMovieVector3 = flat(
    Vector3.subtract(extrapolated, props.centre),
  );
  const distance: number = Vector3.length(away);
  const along: IAutoMovieVector3 =
    distance > 0 ? Vector3.scale(away, 1 / distance) : direction;
  let left: number = distance + props.margin;
  if (left >= capturable) return { ...base, outcome: "fall", steps: [] };
  const steps: IAutoMovieVector3[] = [];
  let from: IAutoMovieVector3 = flat(props.centre);
  for (;;) {
    if (left <= reach) {
      steps.push(Vector3.add(from, Vector3.scale(along, left)));
      return { ...base, outcome: "step", steps };
    }
    from = Vector3.add(from, Vector3.scale(along, reach));
    steps.push(from);
    left = (left - reach) * a;
  }
}

/**
 * Companion types of {@link resolveAutoMovieBalanceOutcome}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame, unit and meaning.
 * @evidence contracts/development/design.md#principled-representation The body's state at the impulse as the pendulum sees it, and the outcome as a closed union with its steps and bounds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the force input (#3429) and the perturbation law (#3430) read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pendulum's frequency and extrapolation are `resolveAutoMovieCenterOfMass`'s.
 */
export namespace resolveAutoMovieBalanceOutcome {
  /** A body's state at an impulse. */
  export interface IProps {
    /** The centre of mass, world metres. */
    centre: IAutoMovieVector3;

    /** Its velocity before the impulse, m/s. */
    velocity: IAutoMovieVector3;

    /** The body's mass, kilograms. */
    mass: number;

    /** The impulse, world N s. */
    impulse: IAutoMovieVector3;

    /** Where the impulse acts, world metres; the centre when absent. */
    at?: IAutoMovieVector3;

    /** The pendulum's length, metres (Hof's leg length, `resolveAutoMovieCenterOfMass.pendulum`). */
    length: number;

    /** The support points on the floor, world metres. */
    support: readonly IAutoMovieVector3[];

    /** The longest step from the centre, metres: a leg length. */
    reach: number;

    /** The margin a landed foot catches the extrapolated centre within, metres: half a foot's length. */
    margin: number;

    /** A capture step's time, seconds: the reactive step's landing. */
    step: number;

    /** Gravitational acceleration, m/s²; standard when absent. */
    gravity?: number;
  }

  /** The impulse magnitudes at which the outcome changes, N s. */
  export interface IBounds {
    /** Past it, the extrapolated centre leaves the base. */
    absorb: number;

    /** Past it, no number of steps catches the body. */
    step: number;
  }

  /** What the impulse does. */
  export interface IOutcome {
    /** Absorbed within the base, caught by steps, or a fall. */
    outcome: "absorb" | "step" | "fall";

    /** The centre's velocity after the impulse, m/s. */
    velocity: IAutoMovieVector3;

    /** The change of angular momentum about the centre, kg m²/s. */
    angular: IAutoMovieVector3;

    /** The extrapolated centre after the impulse, world metres. */
    extrapolated: IAutoMovieVector3;

    /** The capture steps' landing points on the floor, in order; empty for an absorb or a fall. */
    steps: IAutoMovieVector3[];

    /** The impulse bounds along the push. */
    bounds: IBounds;
  }
}

/**
 * How far a point may move along a direction before it leaves a convex hull
 * on the floor plane.
 *
 * @param hull The hull's corners in order.
 * @param point The point, inside or outside.
 * @param direction A unit horizontal direction.
 * @returns Metres; negative when the point is already outside along it.
 */
function exit(
  hull: readonly IAutoMovieVector3[],
  point: IAutoMovieVector3,
  direction: IAutoMovieVector3,
): number {
  if (hull.length < 3 || !pointInHull(point, hull))
    return resolveAutoMovieCenterOfMass.margin(point, hull);
  let best: number = Number.POSITIVE_INFINITY;
  for (let i: number = 0; i < hull.length; i++) {
    const a: IAutoMovieVector3 = hull[i]!;
    const b: IAutoMovieVector3 = hull[(i + 1) % hull.length]!;
    const ex: number = b.x - a.x;
    const ez: number = b.z - a.z;
    const denominator: number = direction.x * ez - direction.z * ex;
    if (denominator === 0) continue;
    const s: number =
      ((a.x - point.x) * ez - (a.z - point.z) * ex) / denominator;
    const t: number =
      ((a.x - point.x) * direction.z - (a.z - point.z) * direction.x) /
      denominator;
    if (s >= 0 && t >= 0 && t <= 1) best = Math.min(best, s);
  }
  return best;
}
