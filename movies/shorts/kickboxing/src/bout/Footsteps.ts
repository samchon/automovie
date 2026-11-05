import { Foot } from "../rig/Foot";

/**
 * Discrete supported footsteps that follow a continuously moving stance.
 *
 * A fixed-rate pass over the whole interval decides, deterministically, when
 * each foot lifts and where it lands: a planted foot stays put until the
 * placement its stance wants drifts past a threshold, then it swings to where
 * the stance will be when it lands. Only one foot swings at a time, the foot
 * on the side of travel moves first (lead foot forward, rear foot backward,
 * the near foot sideways), and feet reserved by a kick or a check never step.
 *
 * @evidence contracts/common.md#implementation-and-ownership The schedule is computed once at construction from pure inputs, so evaluation at any second is a lookup and seek, replay and export agree. The pass costs (end − start) × 120 desired-placement evaluations.
 * @evidence contracts/common.md#authoring-interface Placements are Foot.Placement in world metres/radians. `busy` reserves a foot over [start, end]; it lands at the desired placement of its end second, which the reserving motion must also land on (see `landing`).
 */
export class Footsteps {
  /** Every swing, in time order per side. */
  public readonly steps: readonly Footsteps.Step[];

  /** Per side, the time-ordered segments (swings and reservations). */
  private readonly segments: Record<Footsteps.Side, Footsteps.Step[]>;

  /** Planted placement at the start of the interval. */
  private readonly initial: Record<Footsteps.Side, Foot.Placement>;

  public constructor(input: Footsteps.Input) {
    const dt: number = 1 / 120;
    const sides: readonly Footsteps.Side[] = ["left", "right"];
    const start: Record<Footsteps.Side, Foot.Placement> = input.desired(
      input.start,
    );
    this.initial = { left: start.left, right: start.right };
    this.segments = { left: [], right: [] };
    const planted: Record<Footsteps.Side, Foot.Placement> = { ...this.initial };
    const busy: readonly Footsteps.Busy[] = [...input.busy].sort(
      (x: Footsteps.Busy, y: Footsteps.Busy): number => x.start - y.start,
    );
    let free: number = input.start;
    let last: Footsteps.Side | null = null;
    let lastEnd: number = -Infinity;
    let next: number = 0;
    for (let t: number = input.start; t < input.end; t += dt) {
      // Reservations take the foot; it lands where the stance wants it at the end.
      while (next < busy.length && busy[next]!.start <= t) {
        const reservation: Footsteps.Busy = busy[next++]!;
        const land: Foot.Placement = input.desired(reservation.end)[
          reservation.side
        ];
        this.segments[reservation.side].push({
          side: reservation.side,
          start: reservation.start,
          end: reservation.end,
          from: planted[reservation.side],
          to: land,
          kind: "busy",
        });
        planted[reservation.side] = land;
        free = Math.max(free, reservation.end + 0.04);
      }
      if (t < free) continue;
      const upcoming: number =
        next < busy.length ? busy[next]!.start : Infinity;
      if (t + input.duration + 0.03 > upcoming) continue;

      // Which feet have drifted too far from where the stance wants them?
      const target: Record<Footsteps.Side, Foot.Placement> = input.desired(
        t + input.duration,
      );
      const errors: Record<Footsteps.Side, number> = { left: 0, right: 0 };
      for (const side of sides)
        errors[side] =
          Math.hypot(
            target[side].ball[0] - planted[side].ball[0],
            target[side].ball[1] - planted[side].ball[1],
          ) +
          0.12 * Math.abs(angleDelta(target[side].yaw, planted[side].yaw)) +
          Math.abs(target[side].heel - planted[side].heel) * 0.05;
      const over: Footsteps.Side[] = sides.filter(
        (side: Footsteps.Side): boolean => errors[side] > input.threshold,
      );
      if (over.length === 0) continue;
      let side: Footsteps.Side = over[0]!;
      if (over.length === 2) {
        // Direction of travel in the stance heading frame picks the first foot.
        const heading: number = input.heading(t);
        const mx: number =
          (target.left.ball[0] -
            planted.left.ball[0] +
            target.right.ball[0] -
            planted.right.ball[0]) /
          2;
        const mz: number =
          (target.left.ball[1] -
            planted.left.ball[1] +
            target.right.ball[1] -
            planted.right.ball[1]) /
          2;
        const forward: number = mx * Math.cos(heading) - mz * Math.sin(heading);
        const leftward: number =
          -mx * Math.sin(heading) - mz * Math.cos(heading);
        const rear: Footsteps.Side = input.lead === "left" ? "right" : "left";
        side =
          Math.abs(forward) >= Math.abs(leftward)
            ? forward >= 0
              ? input.lead
              : rear
            : leftward >= 0
              ? "left"
              : "right";

        // Within one movement the feet alternate; the direction rule only picks the first foot.
        if (side === last && t - lastEnd < 0.35)
          side = side === "left" ? "right" : "left";
      }

      // A single step covers at most 0.9 m; a longer journey takes more steps.
      const reach: number = Math.hypot(
        target[side].ball[0] - planted[side].ball[0],
        target[side].ball[1] - planted[side].ball[1],
      );
      if (reach > 0.9) {
        const u: number = 0.9 / reach;
        target[side] = {
          ...target[side],
          ball: [
            planted[side].ball[0] +
              (target[side].ball[0] - planted[side].ball[0]) * u,
            planted[side].ball[1] +
              (target[side].ball[1] - planted[side].ball[1]) * u,
          ],
        };
      }
      const step: Footsteps.Step = {
        side,
        start: t,
        end: t + input.duration,
        from: planted[side],
        to: target[side],
        kind: "swing",
      };
      this.segments[side].push(step);
      planted[side] = target[side];
      free = step.end - (input.overlap ?? -0.03);
      last = side;
      lastEnd = step.end;
    }
    this.steps = [...this.segments.left, ...this.segments.right]
      .filter((step: Footsteps.Step): boolean => step.kind === "swing")
      .sort(
        (x: Footsteps.Step, y: Footsteps.Step): number => x.start - y.start,
      );
    this.height = input.height;
  }

  /** Peak swing clearance, metres. */
  private readonly height: number;

  /**
   * Placement and phase of one foot at a film second.
   *
   * @evidence contracts/common.md#implementation-and-ownership Binary search over the precomputed segments of that side.
   * @evidence contracts/common.md#authoring-interface A reserved foot reports `busy` with the placement it left and the one it will land on; its owner animates it.
   */
  public at(side: Footsteps.Side, t: number): Footsteps.State {
    const list: Footsteps.Step[] = this.segments[side];
    let low: number = 0;
    let high: number = list.length - 1;
    let found: number = -1;
    while (low <= high) {
      const middle: number = (low + high) >> 1;
      if (list[middle]!.start <= t) {
        found = middle;
        low = middle + 1;
      } else high = middle - 1;
    }
    if (found < 0)
      return { phase: "planted", placement: this.initial[side], progress: 0 };
    const step: Footsteps.Step = list[found]!;
    if (t >= step.end)
      return { phase: "planted", placement: step.to, progress: 1 };
    const progress: number = (t - step.start) / (step.end - step.start);
    if (step.kind === "busy")
      return { phase: "busy", placement: step.from, progress, step };
    return {
      phase: "swing",
      placement: Foot.swing(step.from, step.to, progress, this.height),
      progress,
      step,
    };
  }
}

/**
 * Types of {@link Footsteps}.
 */
export namespace Footsteps {
  /**
   * Anatomical side.
   *
   * @evidence contracts/common.md#implementation-and-ownership Closed anatomical side.
   * @evidence contracts/common.md#authoring-interface The performer's own foot.
   */
  export type Side = "left" | "right";

  /**
   * Generator input.
   *
   * @evidence contracts/common.md#implementation-and-ownership Configuration read once by the constructor.
   * @evidence contracts/common.md#authoring-interface Seconds and metres; `overlap` lets the next foot lift before the previous lands.
   */
  export interface Input {
    /** First film second of the schedule. */ start: number;
    /** Last film second of the schedule. */ end: number;
    /**
     * Where the stance wants each foot at a second.
     *
     * @evidence contracts/common.md#implementation-and-ownership Called at 120 Hz during construction; must be pure for a reproducible schedule.
     * @evidence contracts/common.md#authoring-interface Film second in; world placements of both feet out.
     */
    desired: (t: number) => Record<Side, Foot.Placement>;
    /**
     * Stance heading at a second, radians.
     *
     * @evidence contracts/common.md#implementation-and-ownership Used only to pick the first foot of a movement.
     * @evidence contracts/common.md#authoring-interface Film second in; heading radians out.
     */
    heading: (t: number) => number;
    /** Reserved feet (kicks, checks, knockdown). */ busy: readonly Busy[];
    /** Swing duration, seconds. */ duration: number;
    /** Drift that triggers a step, metres. */ threshold: number;
    /** Peak swing clearance, metres. */ height: number;
    /** Lead foot of the stance. */ lead: Side;
    /** Seconds the next foot may lift before the previous lands (shuffle); default −0.03 (a short double support). */ overlap?: number;
  }

  /**
   * A reservation of one foot by another motion.
   *
   * @evidence contracts/common.md#implementation-and-ownership Reservation consumed by the constructor; the foot lands at the desired placement of `end`.
   * @evidence contracts/common.md#authoring-interface Seconds; the reserving motion animates the foot.
   */
  export interface Busy {
    /** Reserved side. */ side: Side;
    /** First reserved second. */ start: number;
    /** Second the foot must be planted again. */ end: number;
  }

  /**
   * One swing or reservation.
   *
   * @evidence contracts/common.md#implementation-and-ownership Immutable schedule entry; swings are interpolated by Foot.swing.
   * @evidence contracts/common.md#authoring-interface Seconds and world placements.
   */
  export interface Step {
    /** Side. */ side: Side;
    /** Lift-off second. */ start: number;
    /** Touch-down second. */ end: number;
    /** Placement left. */ from: Foot.Placement;
    /** Placement landed. */ to: Foot.Placement;
    /** Ordinary swing or a reservation animated by its owner. */ kind:
      | "swing"
      | "busy";
  }

  /**
   * Evaluated foot.
   *
   * @evidence contracts/common.md#implementation-and-ownership Evaluated lookup result.
   * @evidence contracts/common.md#authoring-interface Progress is unit time through the current segment; `step` is absent when planted.
   */
  export interface State {
    /** Support phase. */ phase: "planted" | "swing" | "busy";
    /** Current placement (for busy: the placement it left). */ placement: Foot.Placement;
    /** Unit progress through the current segment. */ progress: number;
    /** Current segment when moving. */ step?: Step;
  }
}

/** Signed smallest difference a − b in radians. */
function angleDelta(a: number, b: number): number {
  let delta: number = (a - b) % (2 * Math.PI);
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
}
