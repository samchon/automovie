import type { KnockdownShape } from "../kickboxing/KnockdownShape";
import type { RingFootwork } from "../kickboxing/RingFootwork";

/**
 * Where the referee wants to stand and how he gets there: across the
 * fighters' line from their centre, on the side he already holds, as far out
 * as the ring allows, closing to a step and an arm's reach of the nearer
 * fighter when they work on the ropes or in a clinch; when his side runs out
 * of room he goes around instead of between them. He walks toward the point
 * at no more than a comfortable walking speed and aims at where the fighters
 * were half a second earlier. Over a fallen fighter he stands a step clear
 * of the lying body on the far side of it from the standing fighter, so
 * facing the fallen man keeps the other in view, and he never steps onto
 * the body on the way.
 *
 * ```ts
 * const goal = RefereePosition.goal({ a, b, side, close, ring, reach });
 * const next = RefereePosition.walk(current, goal, dt);
 * ```
 *
 * @evidence docs/research/officiating/referee.md#positioning Desired point, perimeter, closing, going around, walking speed 1.39 m/s and the half-second follow.
 * @evidence docs/body/settings/cast/referee.md#positioning Side-on across the line, never between them.
 * @evidence docs/research/officiating/referee.md#knockdown Beside the fallen fighter, the standing fighter and the corner in view.
 */
export namespace RefereePosition {
  /** Comfortable walking speed of men in their twenties, m/s (Bohannon 1997). */
  export const SPEED: number = 1.39;

  /** He aims at where the fighters were this many seconds earlier (film choice in the study). */
  export const LAG: number = 0.5;

  /** His working distance as a multiple of his close distance (study: as far as possible while keeping pace). */
  export const FAR_SHARE: number = 1.5;

  /** Least angle between his direction from the fighters' centre and their line that counts as a side view, radians (study target). */
  export const SIDE_VIEW: number = Math.PI / 3;

  /** Inputs of his desired point. */
  export interface IGoalInput {
    /** Fighter A's stance origin. */
    a: RingFootwork.IPoint;

    /** Fighter B's stance origin. */
    b: RingFootwork.IPoint;

    /** The side of the line he holds: +1 or -1 about the line from A to B. */
    side: 1 | -1;

    /** Whether the fighters are on the ropes or clinched. */
    close: boolean;

    /** The ring, with the referee's own margin and step. */
    ring: RingFootwork.IRing;

    /** The referee's arm reach, metres. */
    reach: number;
  }

  /**
   * His desired point and the side it lies on.
   *
   * @param input The fighters, his side, whether to close in, the ring and his reach.
   * @returns The point and the side; the side flips only when his side has no room for the near distance.
   * @evidence docs/research/officiating/referee.md#positioning The adopted law.
   */
  export function goal(input: IGoalInput): {
    point: RingFootwork.IPoint;
    side: 1 | -1;
  } {
    const centre: RingFootwork.IPoint = {
      x: (input.a.x + input.b.x) / 2,
      z: (input.a.z + input.b.z) / 2,
    };
    const dx: number = input.b.x - input.a.x;
    const dz: number = input.b.z - input.a.z;
    const length: number = Math.hypot(dx, dz) || 1;
    const near: number = length / 2 + input.ring.step + input.reach;
    const reach = (
      side: 1 | -1,
    ): { normal: RingFootwork.IPoint; room: number } => {
      const normal: RingFootwork.IPoint = {
        x: (-dz / length) * side,
        z: (dx / length) * side,
      };
      return { normal, room: room(centre, normal, input.ring) };
    };
    let side: 1 | -1 = input.side;
    let along = reach(side);
    if (along.room < near) {
      const other = reach(side === 1 ? -1 : 1);
      if (other.room > along.room) {
        side = side === 1 ? -1 : 1;
        along = other;
      }
    }
    // As far out as the ring allows, up to twice the close distance so he can keep pace.
    const distance: number = Math.min(
      input.close ? near : FAR_SHARE * near,
      along.room,
    );
    return {
      point: {
        x: centre.x + along.normal.x * distance,
        z: centre.z + along.normal.z * distance,
      },
      side,
    };
  }

  /**
   * One walking step of the track: toward the goal at no more than his speed.
   *
   * @param current His position.
   * @param target His desired point.
   * @param seconds The step's duration.
   * @returns His next position.
   * @evidence docs/research/officiating/referee.md#positioning He walks at most 1.39 m/s.
   */
  export function walk(
    current: RingFootwork.IPoint,
    target: RingFootwork.IPoint,
    seconds: number,
  ): RingFootwork.IPoint {
    const dx: number = target.x - current.x;
    const dz: number = target.z - current.z;
    const distance: number = Math.hypot(dx, dz);
    const step: number = SPEED * seconds;
    if (distance <= step) return target;
    return {
      x: current.x + (dx / distance) * step,
      z: current.z + (dz / distance) * step,
    };
  }

  /**
   * The angle between his direction from the fighters' centre and their line, radians in [0, pi/2].
   *
   * @param referee His position.
   * @param a A's origin.
   * @param b B's origin.
   * @returns The angle; at least `SIDE_VIEW` is a side view.
   * @evidence docs/research/officiating/referee.md#targets The side-view target.
   */
  export function view(
    referee: RingFootwork.IPoint,
    a: RingFootwork.IPoint,
    b: RingFootwork.IPoint,
  ): number {
    const cx: number = (a.x + b.x) / 2;
    const cz: number = (a.z + b.z) / 2;
    const ux: number = b.x - a.x;
    const uz: number = b.z - a.z;
    const vx: number = referee.x - cx;
    const vz: number = referee.z - cz;
    const cos: number =
      Math.abs(ux * vx + uz * vz) /
      ((Math.hypot(ux, uz) || 1) * (Math.hypot(vx, vz) || 1));
    return Math.acos(Math.min(1, cos));
  }

  /**
   * Whether he stands between the fighters: his projection falls inside the segment from A to B and he is within a shoulder width of it.
   *
   * @param referee His position.
   * @param a A's origin.
   * @param b B's origin.
   * @param width His shoulder width, metres.
   * @returns True when he is between them.
   * @evidence docs/research/officiating/referee.md#targets He never stands between the fighters.
   */
  export function between(
    referee: RingFootwork.IPoint,
    a: RingFootwork.IPoint,
    b: RingFootwork.IPoint,
    width: number,
  ): boolean {
    const ux: number = b.x - a.x;
    const uz: number = b.z - a.z;
    const length2: number = ux * ux + uz * uz || 1;
    const t: number =
      ((referee.x - a.x) * ux + (referee.z - a.z) * uz) / length2;
    if (t <= 0 || t >= 1) return false;
    const px: number = a.x + ux * t - referee.x;
    const pz: number = a.z + uz * t - referee.z;
    return Math.hypot(px, pz) < width;
  }

  /** Half the central visual field he keeps both men in, radians: the 120-degree binocular field (study). */
  export const FIELD: number = Math.PI / 3;

  /**
   * Where he attends a fallen fighter: on the line from the standing
   * fighter through the lying body's centre, beyond the body by a step, so
   * facing the fallen man keeps the standing one straight ahead.
   *
   * @param body The lying body's floor capsule.
   * @param standing The standing fighter's point.
   * @param step His step, the clearance he keeps, metres.
   * @returns His point.
   * @evidence docs/research/officiating/referee.md#knockdown Beside the fallen fighter with the other in view.
   */
  export function attend(
    body: KnockdownShape.IFootprint,
    standing: RingFootwork.IPoint,
    step: number,
  ): RingFootwork.IPoint {
    const centre: RingFootwork.IPoint = {
      x: (body.from.x + body.to.x) / 2,
      z: (body.from.z + body.to.z) / 2,
    };
    const dx: number = centre.x - standing.x;
    const dz: number = centre.z - standing.z;
    const length: number = Math.hypot(dx, dz) || 1;
    const u: RingFootwork.IPoint = { x: dx / length, z: dz / length };
    // Out along u until the body is a step away: the gap grows with distance.
    const far: number =
      Math.hypot(body.to.x - body.from.x, body.to.z - body.from.z) / 2 +
      body.radius +
      step;
    let low: number = 0;
    let high: number = far;
    for (let k: number = 0; k < BISECTIONS; k++) {
      const mid: number = (low + high) / 2;
      const p: RingFootwork.IPoint = {
        x: centre.x + u.x * mid,
        z: centre.z + u.z * mid,
      };
      if (gap(p, body) < step) low = mid;
      else high = mid;
    }
    return { x: centre.x + u.x * high, z: centre.z + u.z * high };
  }

  /**
   * A point kept at least a step off the lying body: inside that clearance
   * it moves straight out to it, so his walk goes around the body.
   *
   * @param point His next point.
   * @param body The lying body's floor capsule.
   * @param step The clearance.
   * @returns The point, or its push to the clearance.
   * @evidence docs/body/screenplay/kickboxing.md#s11-b01 He advances outside the falling body's path.
   */
  export function clear(
    point: RingFootwork.IPoint,
    body: KnockdownShape.IFootprint,
    step: number,
  ): RingFootwork.IPoint {
    const near: RingFootwork.IPoint = closest(point, body);
    const dx: number = point.x - near.x;
    const dz: number = point.z - near.z;
    const d: number = Math.hypot(dx, dz);
    const wanted: number = body.radius + step;
    if (d >= wanted) return point;
    if (d === 0) return point;
    return { x: near.x + (dx / d) * wanted, z: near.z + (dz / d) * wanted };
  }

  /**
   * The gap between a point and the lying body's surface.
   *
   * @param point A floor point.
   * @param body The lying body's floor capsule.
   * @returns Metres; negative over the body.
   * @evidence docs/research/officiating/referee.md#knockdown A step clear of the fallen fighter.
   */
  export function gap(
    point: RingFootwork.IPoint,
    body: KnockdownShape.IFootprint,
  ): number {
    const near: RingFootwork.IPoint = closest(point, body);
    return Math.hypot(point.x - near.x, point.z - near.z) - body.radius;
  }

  /** Halvings of the attending distance: below a millimetre over a ring's span. */
  const BISECTIONS: number = 32;

  /** The closest point of the body's axis to a point. */
  function closest(
    point: RingFootwork.IPoint,
    body: KnockdownShape.IFootprint,
  ): RingFootwork.IPoint {
    const ux: number = body.to.x - body.from.x;
    const uz: number = body.to.z - body.from.z;
    const length2: number = ux * ux + uz * uz || 1;
    const t: number = Math.max(
      0,
      Math.min(
        1,
        ((point.x - body.from.x) * ux + (point.z - body.from.z) * uz) / length2,
      ),
    );
    return { x: body.from.x + ux * t, z: body.from.z + uz * t };
  }

  /** Distance from a point along a unit direction to the margin inside the ropes. */
  function room(
    from: RingFootwork.IPoint,
    direction: RingFootwork.IPoint,
    ring: RingFootwork.IRing,
  ): number {
    const limit: number = ring.half - ring.margin;
    const along = (p: number, d: number): number =>
      d > 0 ? (limit - p) / d : d < 0 ? (-limit - p) / d : Infinity;
    return Math.max(
      0,
      Math.min(along(from.x, direction.x), along(from.z, direction.z)),
    );
  }
}
