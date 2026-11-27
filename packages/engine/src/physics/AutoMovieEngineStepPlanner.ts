import type {
  IAutoMovieFootfallPattern,
  IAutoMovieStepPlanner,
} from "@automovie/interface";

import { AutoMovieEngineEnvelope as Envelope } from "../motion/AutoMovieEngineEnvelope";

/**
 * Deterministic drift-triggered support placement, precomputed at a fixed rate.
 * Reservations have priority. Direction chooses the leading support, cyclic
 * phase orders ties, and minimumSupports prevents unrequested suspension.
 * Sampling is O(log steps per limb); construction is O(ticks × limbs).
 */
export class AutoMovieEngineStepPlanner {
  /** Every scheduled swing and reservation, ordered by lift time. */
  public get steps(): readonly IAutoMovieStepPlanner.IStep[] {
    return this.schedule;
  }
  /*
   * Owned schedule, frozen after construction.
   */
  private readonly schedule: IAutoMovieStepPlanner.IStep[] = [];
  /*
   * Owned swing clearance, independent of later caller input edits.
   */
  private readonly height: number;
  /*
   * Caller-declared peak swing pitch, radians.
   */
  private readonly peakPitch: number;
  /*
   * Per-limb lists avoid scanning the complete film on seek.
   */
  private readonly segments: Map<string, IAutoMovieStepPlanner.IStep[]> =
    new Map();
  /*
   * Owned initial support placements.
   */
  private readonly initial: Record<string, IAutoMovieStepPlanner.IPlacement>;

  /**
   * Compute a complete schedule from pure desired-placement inputs, sampled
   * every `1 / rate` seconds from start to end: (end - start) rate samples.
   * Throws when that period no longer advances the clock at some sample.
   */
  public constructor(input: IAutoMovieStepPlanner.IInput) {
    const limbs: IAutoMovieFootfallPattern["limbs"] = input.pattern.limbs;
    if (
      input.end < input.start ||
      input.rate <= 0 ||
      input.duration <= 0 ||
      input.threshold <= 0 ||
      input.maximumStride <= 0 ||
      input.height < 0 ||
      limbs.length === 0 ||
      new Set(limbs.map((limb: (typeof limbs)[number]): string => limb.bone))
        .size !== limbs.length ||
      input.pattern.minimumSupports < 0 ||
      input.pattern.minimumSupports >= limbs.length
    )
      throw new Error(
        "Invalid step planner interval, budget or support pattern",
      );

    this.height = input.height;
    this.peakPitch = input.peakPitch ?? 0;
    for (const limb of limbs) {
      if (
        !limb.bone.trim() ||
        limb.chain.at(-1) !== limb.bone ||
        limb.phase < 0 ||
        limb.phase >= 1 ||
        limb.duty < 0 ||
        limb.duty > 1 ||
        limb.stride.length === 0 ||
        limb.stride.some(
          (sample: (typeof limb.stride)[number], i: number): boolean =>
            sample.speed < 0 ||
            sample.length <= 0 ||
            (i > 0 && sample.speed <= limb.stride[i - 1]!.speed),
        )
      )
        throw new Error(`Invalid footfall limb ${limb.bone}`);
      this.segments.set(limb.bone, []);
    }
    this.initial = structuredClone(input.desired(input.start));
    if (
      input.swingRetargeting !== undefined &&
      input.swingRetargeting !== "after-landing" &&
      input.swingRetargeting !== "from-scheduled-landing"
    )
      throw new Error("Invalid swing retargeting policy");
    const planted: Record<string, IAutoMovieStepPlanner.IPlacement> =
      structuredClone(this.initial);
    const busy: IAutoMovieStepPlanner.IReservation[] = [
      ...input.reservations,
    ].sort(
      (
        a: IAutoMovieStepPlanner.IReservation,
        b: IAutoMovieStepPlanner.IReservation,
      ): number => a.start - b.start,
    );
    for (const [i, reservation] of busy.entries()) {
      if (
        !this.segments.has(reservation.bone) ||
        reservation.end <= reservation.start ||
        busy
          .slice(0, i)
          .some(
            (other: IAutoMovieStepPlanner.IReservation): boolean =>
              other.bone === reservation.bone && other.end > reservation.start,
          )
      )
        throw new Error("Invalid or overlapping support reservation");
    }
    let free: number = input.start;
    let next: number = 0;
    let last: string | undefined;
    let lastEnd: number = -Infinity;
    const available: Map<string, number> = new Map();
    for (let t: number = input.start; t < input.end; t += 1 / input.rate) {
      // A sample period under half the spacing of doubles at `t` leaves the
      // clock where it is, and the schedule would never reach its end.
      if (!(t + 1 / input.rate > t))
        throw new Error(
          `The step planner's rate ${input.rate} is finer than the resolution of second ${t}`,
        );
      while (next < busy.length && busy[next]!.start <= t) {
        const reservation: IAutoMovieStepPlanner.IReservation = busy[next++]!;
        const to: IAutoMovieStepPlanner.IPlacement = structuredClone(
          input.desired(reservation.end)[reservation.bone]!,
        );
        this.add({
          ...reservation,
          kind: "reserved",
          from: planted[reservation.bone]!,
          to,
        });
        planted[reservation.bone] = to;
        free = Math.max(free, reservation.end + input.reservationMargin);
      }
      if (
        t < free ||
        t + input.duration + input.margin > (busy[next]?.start ?? Infinity)
      )
        continue;
      const targets: Record<string, IAutoMovieStepPlanner.IPlacement> =
        structuredClone(input.desired(t + input.duration));
      const active: Set<string> = new Set(
        limbs
          .filter(
            (limb: (typeof limbs)[number]): boolean =>
              (this.segments.get(limb.bone)!.at(-1)?.end ?? -Infinity) > t,
          )
          .map(
            (limb: IAutoMovieFootfallPattern["limbs"][number]): string =>
              limb.bone,
          ),
      );
      const over: IAutoMovieFootfallPattern["limbs"] = limbs.filter(
        (limb: (typeof limbs)[number]): boolean => {
          const to: IAutoMovieStepPlanner.IPlacement | undefined =
            targets[limb.bone];
          const from: IAutoMovieStepPlanner.IPlacement | undefined =
            planted[limb.bone];
          if (to === undefined || from === undefined)
            throw new Error(`Invalid support placement ${limb.bone}`);
          const retarget: boolean =
            input.swingRetargeting === "from-scheduled-landing" &&
            active.has(limb.bone) &&
            limb.duty === 0;
          const capacity: boolean =
            limbs.length - active.size - (active.has(limb.bone) ? 0 : 1) >=
            input.pattern.minimumSupports;
          return (
            capacity &&
            (retarget ||
              (!active.has(limb.bone) &&
                t >= (available.get(limb.bone) ?? -Infinity))) &&
            limb.duty < 1 &&
            Math.hypot(
              to.point[0] - from.point[0],
              to.point[1] - from.point[1],
            ) +
              input.yawLever *
                Math.abs(AutoMovieEngineStepPlanner.angle(to.yaw - from.yaw)) +
              input.pitchLever * Math.abs(to.pitch - from.pitch) >
              input.threshold
          );
        },
      );
      if (over.length === 0) continue;
      const heading: number = input.heading(t);
      const dx: number =
        limbs.reduce(
          (
            sum: number,
            limb: IAutoMovieFootfallPattern["limbs"][number],
          ): number =>
            sum + targets[limb.bone]!.point[0] - planted[limb.bone]!.point[0],
          0,
        ) / limbs.length;
      const dz: number =
        limbs.reduce(
          (
            sum: number,
            limb: IAutoMovieFootfallPattern["limbs"][number],
          ): number =>
            sum + targets[limb.bone]!.point[1] - planted[limb.bone]!.point[1],
          0,
        ) / limbs.length;
      const forward: number = dx * Math.cos(heading) - dz * Math.sin(heading);
      const left: number = -dx * Math.sin(heading) - dz * Math.cos(heading);
      over.sort(
        (
          a: (typeof over)[number],
          b: IAutoMovieFootfallPattern["limbs"][number],
        ): number => {
          const direction: number =
            Math.abs(forward) >= Math.abs(left)
              ? Math.sign(forward) * (b.offset.forward - a.offset.forward)
              : Math.sign(left) * (b.offset.left - a.offset.left);
          return direction || a.phase - b.phase;
        },
      );
      let chosen: IAutoMovieFootfallPattern["limbs"][number] = over[0]!;
      if (
        chosen.bone === last &&
        t - lastEnd < input.alternationWindow &&
        over.length > 1
      )
        chosen = over[1]!;
      const from: IAutoMovieStepPlanner.IPlacement = planted[chosen.bone]!;
      const to: IAutoMovieStepPlanner.IPlacement = targets[chosen.bone]!;
      const reach: number = Math.hypot(
        to.point[0] - from.point[0],
        to.point[1] - from.point[1],
      );
      const speed: number = Math.hypot(dx, dz) / input.duration;
      const samples: { speed: number; length: number }[] = chosen.stride;
      const upper: number = samples.findIndex(
        (sample: { speed: number; length: number }): boolean =>
          sample.speed >= speed,
      );
      const hi: { speed: number; length: number } =
        samples[upper < 0 ? samples.length - 1 : upper]!;
      const lo: { speed: number; length: number } =
        samples[Math.max(0, upper - 1)]!;
      const stride: number =
        upper <= 0
          ? hi.length
          : lo.length +
            ((hi.length - lo.length) * (speed - lo.speed)) /
              (hi.speed - lo.speed);
      const limit: number = Math.min(input.maximumStride, stride);
      if (reach > limit)
        to.point = [
          from.point[0] + ((to.point[0] - from.point[0]) * limit) / reach,
          from.point[1] + ((to.point[1] - from.point[1]) * limit) / reach,
        ];
      const step: IAutoMovieStepPlanner.IStep = {
        bone: chosen.bone,
        kind: "swing",
        start: t,
        end: t + input.duration,
        from,
        to,
      };
      this.add(step);
      planted[chosen.bone] = structuredClone(to);
      available.set(
        chosen.bone,
        step.end + (input.duration * chosen.duty) / (1 - chosen.duty),
      );
      free = step.end - input.overlap;
      last = chosen.bone;
      lastEnd = step.end;
    }
    this.schedule.sort(
      (
        a: IAutoMovieStepPlanner.IStep,
        b: IAutoMovieStepPlanner.IStep,
      ): number => a.start - b.start,
    );
  }

  /** Binary search returns a new placement; callers cannot mutate the cache. */
  public at(bone: string, seconds: number): IAutoMovieStepPlanner.IState {
    const list: IAutoMovieStepPlanner.IStep[] | undefined =
      this.segments.get(bone);
    if (!list) throw new Error("Unknown support");
    let low: number = 0;
    let high: number = list.length - 1;
    while (low <= high) {
      const middle: number = (low + high) >>> 1;
      if (list[middle]!.start <= seconds) low = middle + 1;
      else high = middle - 1;
    }
    const step: IAutoMovieStepPlanner.IStep | undefined = list[high];
    if (!step)
      return {
        phase: "planted",
        placement: structuredClone(this.initial[bone]!),
        progress: 0,
      };
    if (seconds >= step.end)
      return {
        phase: "planted",
        placement: structuredClone(step.to),
        progress: 1,
      };
    const progress: number = (seconds - step.start) / (step.end - step.start);
    return {
      phase: step.kind,
      placement:
        step.kind === "reserved"
          ? structuredClone(step.from)
          : AutoMovieEngineStepPlanner.swing(
              step.from,
              step.to,
              progress,
              this.height,
              this.peakPitch,
            ),
      progress,
      step: structuredClone(step),
    };
  }

  /*
   * One schedule owns both the global and indexed view of each segment.
   */
  private add(step: IAutoMovieStepPlanner.IStep): void {
    this.schedule.push(step);
    this.segments.get(step.bone)!.push(step);
  }
}

/** World support placements and explicit scheduling policy. */
export namespace AutoMovieEngineStepPlanner {
  /** Signed shortest angle, radians, preserving both pi endpoints. */
  export function angle(value: number): number {
    return Envelope.angle(0, value, 1);
  }
  /**
   * Quintic endpoint interpolation and a lifted sine arc, as in supported
   * stepping.
   */
  export function swing(
    from: IAutoMovieStepPlanner.IPlacement,
    to: IAutoMovieStepPlanner.IPlacement,
    progress: number,
    height: number,
    peakPitch: number = 0,
  ): IAutoMovieStepPlanner.IPlacement {
    if (height < 0)
      throw new Error("Invalid support swing placement or declared policy");
    const t: number = Math.max(0, Math.min(1, progress));
    const u: number = Envelope.smoother(t);
    return {
      point: [
        from.point[0] + (to.point[0] - from.point[0]) * u,
        from.point[1] + (to.point[1] - from.point[1]) * u,
      ],
      yaw: from.yaw + angle(to.yaw - from.yaw) * u,
      pitch:
        from.pitch +
        (to.pitch - from.pitch) * u +
        peakPitch * Math.sin(Math.PI * t),
      clearance: height * Math.sin(Math.PI * t),
    };
  }
}
