import type { RingFootwork } from "../kickboxing/RingFootwork";

/**
 * Where the referee wants to stand and how he gets there: across the
 * fighters' line from their centre, on the side he already holds, as far out
 * as the ring allows, closing to a step and an arm's reach of the nearer
 * fighter when they work on the ropes or in a clinch; when his side runs out
 * of room he goes around instead of between them. He walks toward the point
 * at no more than a comfortable walking speed and aims at where the fighters
 * were half a second earlier.
 *
 * ```ts
 * const goal = RefereePosition.goal({ a, b, side, close, ring, reach });
 * const next = RefereePosition.walk(current, goal, dt);
 * ```
 *
 * @evidence docs/research/officiating/referee.md#positioning Desired point, perimeter, closing, going around, walking speed 1.39 m/s and the half-second follow.
 * @evidence docs/body/settings/cast/referee.md#positioning Side-on across the line, never between them.
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
