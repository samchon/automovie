import type { IAutoMovieResolveBalanceOutcome, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { convexHull2D } from "../../math/internal/convexHull2D";
import { pointInHull } from "../../math/internal/pointInHull";
import { AutoMovieEngineGravity } from "../../physics/AutoMovieEngineGravity";
import { resolveAutoMovieCenterOfMass } from "./resolveAutoMovieCenterOfMass";


/*
 * What an impulse does to a standing body's balance (#3429): it absorbs it
 * within its base, catches it with capture steps, or falls.
 *
 * The impulse `J` changes the centre of mass's velocity to `v + J / m` and its
 * angular momentum about the centre by `(p - c) × J`. The body is a linear
 * inverted pendulum of length `l` with eigenfrequency `ω0 = sqrt(g / l)`, whose
 * extrapolated centre `ξ = x + v / ω0` must lie within the base of support for
 * the body to stay (Hof, Gazendam and Sinke 2005, J Biomech 38:1-8): inside the
 * support polygon, the body absorbs the push.
 *
 * Outside it, the body steps, the capture point `ξ` diverging from the centre
 * of pressure as the pendulum does, `d(t) = d0 exp(ω0 t)` (the capture point of
 * Pratt, Carff, Drakunov and Goswami 2006, as the stepping literature states
 * it): until the first foot lands, `first` after the impulse, the centre of
 * pressure is held at the base's edge along the lead, so `d0` is the capture
 * point's distance beyond that edge. A foot lands at most `reach` (a leg
 * length, as `stagger` reaches) beyond the last centre of pressure and catches
 * the capture point within its half length, `margin`; one that falls short
 * moves the centre of pressure to its front edge, `reach + margin` on, and
 * leaves the rest to diverge over the next swing, `step`: `d_{k+1} = (d_k -
 * reach - margin) exp(ω0 step)`. The recurrence shrinks to a catch exactly when
 * the first landing's distance is below its fixed point `d* = (reach + margin)
 * a / (a - 1)`, `a = exp(ω0 step)`, the infinite-step capture distance in the
 * framework of Koolen, de Boer, Rebula, Goswami and Pratt 2012
 * ("Capturability-based analysis and control of legged locomotion, Part 1", Int
 * J Robot Res 31(9)); at or past it no number of steps catches the body and it
 * falls. Both papers are located, not yet read at the source; the recurrence is
 * derived here from the linear inverted pendulum's divergence. The steps are
 * laid along the lead from the base's edge.
 *
 * The bounds are the impulse magnitudes along the push's horizontal direction
 * at which the outcome changes: `m ω0 b` to leave the base, with `b` the
 * distance from the current extrapolated centre to the base's edge along the
 * push, and `m ω0 (e + d* exp(-ω0 first) - lead)` to leave the capture region,
 * with `e` the centre's distance to the base's edge along the push and `lead`
 * the current extrapolated centre's distance from the centre.
 *
 * -
 * Parameter props: The body's state, the impulse and the support.
 * Returns: The outcome, the steps and the bounds.
 * When the mass, the length, the reach or the step time is not
 * positive, the margin is not finite, or there is no support point.
 */
export function resolveAutoMovieBalanceOutcome(
  props: IAutoMovieResolveBalanceOutcome.IProps,
): IAutoMovieResolveBalanceOutcome.IOutcome {
  const { mass, length, reach, step } = props;
  if (
    !(
      mass > 0 &&
      length > 0 &&
      reach > 0 &&
      step > 0 &&
      (props.first === undefined || props.first > 0)
    )
  )
    throw new Error(
      "The balance outcome needs a positive mass, pendulum length, reach and step time",
    );
  if (props.support.length === 0)
    throw new Error("The balance outcome needs a support point");
  const gravity: number = props.gravity ?? AutoMovieEngineGravity.STANDARD;
  const w0: number = resolveAutoMovieCenterOfMass.frequency(length, gravity);
  const velocity: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    props.velocity,
    AutoMovieEngineVector3.scale(props.impulse, 1 / mass),
  );
  const angular: IAutoMovieVector3 = AutoMovieEngineVector3.cross(
    AutoMovieEngineVector3.subtract(props.at ?? props.centre, props.centre),
    props.impulse,
  );
  const extrapolated: IAutoMovieVector3 =
    resolveAutoMovieCenterOfMass.extrapolate(
      props.centre,
      velocity,
      length,
      gravity,
    );
  const hull: IAutoMovieVector3[] = convexHull2D(props.support);

  // The push's horizontal direction.
  const flat = (v: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: v.x,
    y: 0,
    z: v.z,
  });
  const push: IAutoMovieVector3 = flat(props.impulse);
  const pushed: number = AutoMovieEngineVector3.length(push);
  const direction: IAutoMovieVector3 =
    pushed > 0 ? AutoMovieEngineVector3.scale(push, 1 / pushed) : { x: 0, y: 0, z: 0 };
  const centre: IAutoMovieVector3 = flat(props.centre);

  // The capture point beyond the base's edge diverges with the centre of
  // pressure held at that edge, `d(t) = d0 exp(ω0 t)`, until the first foot
  // lands; each foot catches it within its reach plus its half length, and
  // one that falls short moves the centre of pressure to its front edge and
  // leaves the rest to diverge over the next swing. The distance any number
  // of steps can catch is the recurrence's fixed point.
  const a: number = Math.exp(w0 * step);
  const caught: number = reach + props.margin;
  const capturable: number = (caught * a) / (a - 1);
  const first: number = props.first ?? step;

  // The bounds along the push: leaving the base, and leaving every capture.
  const before: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.extrapolate(
    props.centre,
    props.velocity,
    length,
    gravity,
  );
  const lead: number = AutoMovieEngineVector3.dot(
    flat(AutoMovieEngineVector3.subtract(before, props.centre)),
    direction,
  );
  const edge: number = exit(hull, centre, direction);
  const bounds: IAutoMovieResolveBalanceOutcome.IBounds = {
    absorb:
      pushed > 0
        ? mass * w0 * Math.max(0, exit(hull, before, direction))
        : Number.POSITIVE_INFINITY,
    step:
      pushed > 0
        ? mass *
          w0 *
          Math.max(0, edge + capturable * Math.exp(-w0 * first) - lead)
        : Number.POSITIVE_INFINITY,
  };

  const base: Omit<
    IAutoMovieResolveBalanceOutcome.IOutcome,
    "outcome" | "steps"
  > = {
    velocity,
    angular,
    extrapolated,
    bounds,
  };
  if (resolveAutoMovieCenterOfMass.margin(extrapolated, hull) > 0)
    return { ...base, outcome: "absorb", steps: [] };

  // Steps along the capture point's lead from the centre, from the base's
  // edge that way.
  const away: IAutoMovieVector3 = flat(
    AutoMovieEngineVector3.subtract(extrapolated, props.centre),
  );
  const distance: number = AutoMovieEngineVector3.length(away);
  const along: IAutoMovieVector3 =
    distance > 0 ? AutoMovieEngineVector3.scale(away, 1 / distance) : direction;
  const rim: number = exit(hull, centre, along);
  let left: number = Math.max(0, distance - rim) * Math.exp(w0 * first);
  if (left >= capturable) return { ...base, outcome: "fall", steps: [] };
  const steps: IAutoMovieVector3[] = [];
  let from: IAutoMovieVector3 = AutoMovieEngineVector3.add(centre, AutoMovieEngineVector3.scale(along, rim));
  for (;;) {
    if (left <= caught) {
      steps.push(
        AutoMovieEngineVector3.add(from, AutoMovieEngineVector3.scale(along, Math.min(left, reach))),
      );
      return { ...base, outcome: "step", steps };
    }
    // Below the fixed point the recurrence shrinks the distance, by
    // (a - 1)(d* - left) a step. Where that is under half the spacing of
    // doubles at `left` the arithmetic cannot tell `left` from d* and the
    // distance stays put forever. When exp(ω0 step) overflows, d* is not a
    // number though its limit is reach + margin, which this distance already
    // passes. Either way no representable number of steps catches the body:
    // the fixed point's own outcome, a fall.
    const next: number = (left - caught) * a;
    if (!(next < left)) return { ...base, outcome: "fall", steps: [] };
    steps.push(AutoMovieEngineVector3.add(from, AutoMovieEngineVector3.scale(along, reach)));
    from = AutoMovieEngineVector3.add(from, AutoMovieEngineVector3.scale(along, caught));
    left = next;
  }
}

/*
 * How far a point may move along a direction before it leaves a convex hull on
 * the floor plane.
 * Parameter hull: The hull's corners in order.
 * Parameter point: The point, inside or outside.
 * Parameter direction: A unit horizontal direction.
 * Returns: Metres; negative when the point is already outside along it.
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
