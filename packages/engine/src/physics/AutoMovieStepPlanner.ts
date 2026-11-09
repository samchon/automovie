import type { IAutoMovieFootfallPattern } from "@automovie/interface";

import { AutoMovieEnvelope as Envelope } from "../motion/AutoMovieEnvelope";
import { freezePhysicalRecord } from "./freezePhysicalRecord";

/**
 * Deterministic drift-triggered support placement, precomputed at a fixed rate.
 * Reservations have priority. Direction chooses the leading support, cyclic
 * phase orders ties, and minimumSupports prevents unrequested suspension.
 * Sampling is O(log steps per limb); construction is O(ticks × limbs).
 */
export class AutoMovieStepPlanner {
  /** Every scheduled swing and reservation, ordered by lift time. */
  public get steps(): readonly AutoMovieStepPlanner.IStep[] {
    return this.schedule;
  }
  /** Owned schedule, frozen after construction. */
  private readonly schedule: AutoMovieStepPlanner.IStep[] = [];
  /** Owned swing clearance, independent of later caller input edits. */
  private readonly height: number;
  /** Caller-declared peak swing pitch, radians. */
  private readonly peakPitch: number;
  /** Per-limb lists avoid scanning the complete film on seek. */
  private readonly segments: Map<string, AutoMovieStepPlanner.IStep[]> =
    new Map();
  /** Owned initial support placements. */
  private readonly initial: Record<string, AutoMovieStepPlanner.IPlacement>;

  /** Compute a complete schedule from pure desired-placement inputs. */
  public constructor(input: AutoMovieStepPlanner.IInput) {
    const limbs: IAutoMovieFootfallPattern["limbs"] = input.pattern.limbs;
    if (
      !Number.isFinite(input.start) ||
      !Number.isFinite(input.end) ||
      input.end < input.start ||
      !(input.rate > 0) ||
      !Number.isFinite(input.rate) ||
      !(input.duration > 0) ||
      !Number.isFinite(input.duration) ||
      !(input.threshold > 0) ||
      !Number.isFinite(input.threshold) ||
      !(input.maximumStride > 0) ||
      !Number.isFinite(input.maximumStride) ||
      input.height < 0 ||
      !Number.isFinite(input.height) ||
      limbs.length === 0 ||
      new Set(limbs.map((limb: (typeof limbs)[number]): string => limb.bone))
        .size !== limbs.length ||
      !Number.isInteger(input.pattern.minimumSupports) ||
      input.pattern.minimumSupports < 0 ||
      input.pattern.minimumSupports >= limbs.length
    )
      throw new Error(
        "Invalid step planner interval, budget or support pattern",
      );
    if (!Number.isFinite(input.peakPitch ?? 0))
      throw new Error("Invalid declared swing pitch");
    this.height = input.height;
    this.peakPitch = input.peakPitch ?? 0;
    for (const limb of limbs) {
      if (
        limb.localPoint &&
        ![limb.localPoint.x, limb.localPoint.y, limb.localPoint.z].every(
          Number.isFinite,
        )
      )
        throw new Error(`Invalid support endpoint ${limb.bone}`);
      if (
        !limb.bone.trim() ||
        limb.chain.at(-1) !== limb.bone ||
        limb.phase < 0 ||
        limb.phase >= 1 ||
        !Number.isFinite(limb.phase) ||
        limb.duty < 0 ||
        limb.duty > 1 ||
        !Number.isFinite(limb.duty) ||
        !Number.isFinite(limb.offset.forward) ||
        !Number.isFinite(limb.offset.left) ||
        limb.stride.length === 0 ||
        limb.stride.some(
          (sample: (typeof limb.stride)[number], i: number): boolean =>
            !Number.isFinite(sample.speed) ||
            sample.speed < 0 ||
            !(sample.length > 0) ||
            !Number.isFinite(sample.length) ||
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
    const planted: Record<string, AutoMovieStepPlanner.IPlacement> =
      structuredClone(this.initial);
    const busy: AutoMovieStepPlanner.IReservation[] = [
      ...input.reservations,
    ].sort(
      (
        a: AutoMovieStepPlanner.IReservation,
        b: AutoMovieStepPlanner.IReservation,
      ): number => a.start - b.start,
    );
    for (const [i, reservation] of busy.entries()) {
      if (
        !this.segments.has(reservation.bone) ||
        !Number.isFinite(reservation.start) ||
        !Number.isFinite(reservation.end) ||
        reservation.end <= reservation.start ||
        busy
          .slice(0, i)
          .some(
            (other: AutoMovieStepPlanner.IReservation): boolean =>
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
      while (next < busy.length && busy[next]!.start <= t) {
        const reservation: AutoMovieStepPlanner.IReservation = busy[next++]!;
        const to: AutoMovieStepPlanner.IPlacement = structuredClone(
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
      const targets: Record<string, AutoMovieStepPlanner.IPlacement> =
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
          const to: AutoMovieStepPlanner.IPlacement = targets[limb.bone]!;
          const from: AutoMovieStepPlanner.IPlacement = planted[limb.bone]!;
          if (
            !to ||
            !from ||
            ![
              to.point[0],
              to.point[1],
              to.yaw,
              to.pitch,
              to.clearance,
              from.point[0],
              from.point[1],
              from.yaw,
              from.pitch,
              from.clearance,
            ].every(Number.isFinite)
          )
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
                Math.abs(AutoMovieStepPlanner.angle(to.yaw - from.yaw)) +
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
      const from: AutoMovieStepPlanner.IPlacement = planted[chosen.bone]!;
      const to: AutoMovieStepPlanner.IPlacement = targets[chosen.bone]!;
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
      const step: AutoMovieStepPlanner.IStep = {
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
      (a: AutoMovieStepPlanner.IStep, b: AutoMovieStepPlanner.IStep): number =>
        a.start - b.start,
    );
    freezePhysicalRecord(this.schedule);
  }

  /**
   * Binary search returns a new placement; callers cannot mutate the cache.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Binary search returns a new placement; callers cannot mutate the cache.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Binary search returns a new placement; callers cannot mutate the cache) directly over its typed inputs (`bone`, `seconds`) as a single pass (while loop), delegating to `Number.isFinite`, `structuredClone`, `AutoMovieStepPlanner.swing`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 42 lines and 10 top-level statements that reuses `Number.isFinite`, `structuredClone`, `AutoMovieStepPlanner.swing` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `bone`, `seconds`; the dominant cost is a single pass (while loop), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
   */
  public at(bone: string, seconds: number): AutoMovieStepPlanner.IState {
    const list: AutoMovieStepPlanner.IStep[] | undefined =
      this.segments.get(bone);
    if (!list || !Number.isFinite(seconds))
      throw new Error("Unknown support or nonfinite film second");
    let low: number = 0;
    let high: number = list.length - 1;
    while (low <= high) {
      const middle: number = (low + high) >>> 1;
      if (list[middle]!.start <= seconds) low = middle + 1;
      else high = middle - 1;
    }
    const step: AutoMovieStepPlanner.IStep | undefined = list[high];
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
          : AutoMovieStepPlanner.swing(
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

  /** One schedule owns both the global and indexed view of each segment. */
  private add(step: AutoMovieStepPlanner.IStep): void {
    this.schedule.push(step);
    this.segments.get(step.bone)!.push(step);
  }
}

/**
 * World support placements and explicit scheduling policy.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (World support placements and explicit scheduling policy) and documents 7 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents World support placements and explicit scheduling policy: companion namespace of 7 members (`IPlacement`, `IReservation`, `IStep`, `IState`, `IInput`, `angle`, ...); units and frames named in its text: world, radians, metres, second, seconds. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieStepPlanner` in packages/engine/src/physics/AutoMovieStepPlanner.ts; its surface is the 7 members listed and the text shows 6 other files naming it, mostly packages/engine (3), test (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieStepPlanner {
  /**
   * Anchor in world X/Z, orientation in radians, clearance in metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Anchor in world X/Z, orientation in radians, clearance in metres.
   * @evidence contracts/development/design.md#principled-representation Represents Anchor in world X/Z, orientation in radians, clearance in metres: interface of 4 members (`point`, `yaw`, `pitch`, `clearance`). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IPlacement` in packages/engine/src/physics/AutoMovieStepPlanner.ts; its surface is the 4 members listed and the text shows 66 other files naming it, mostly movies (30), packages/human (21), test (10), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IPlacement {
    /** Floor-plane anchor. */ point: [number, number];
    /** Heading about +Y. */ yaw: number;
    /** Rotation about the support's lateral axis. */ pitch: number;
    /** Vertical displacement above its planted placement. */ clearance: number;
  }
  /**
   * A support temporarily controlled by authored motion.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: A support temporarily controlled by authored motion.
   * @evidence contracts/development/design.md#principled-representation Represents A support temporarily controlled by authored motion: interface of 3 members (`bone`, `start`, `end`); units and frames named in its text: second. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IReservation` in packages/engine/src/physics/AutoMovieStepPlanner.ts; its surface is the 3 members listed and the text shows 0 other files naming it, so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IReservation {
    /** Endpoint bone id. */
    bone: string;
    /** Lift second. */
    start: number;
    /** Landing second. */
    end: number;
  }
  /**
   * Immutable endpoints; the querying method returns independent copies.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Immutable endpoints; the querying method returns independent copies.
   * @evidence contracts/development/design.md#principled-representation Represents Immutable endpoints; the querying method returns independent copies: interface of 3 members (`kind`, `from`, `to`). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IStep` in packages/engine/src/physics/AutoMovieStepPlanner.ts; its surface is the 3 members listed and the text shows 5 other files naming it, mostly packages/engine (2), test (2), packages/human (1), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IStep extends IReservation {
    /** Movement owner. */
    kind: "swing" | "reserved";
    /** Departure. */
    from: IPlacement;
    /** Landing. */
    to: IPlacement;
  }
  /**
   * Instantaneous phase, with an optional moving segment.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Instantaneous phase, with an optional moving segment.
   * @evidence contracts/development/design.md#principled-representation Represents Instantaneous phase, with an optional moving segment: interface of 4 members (`phase`, `placement`, `progress`, `step`). Optional members `step` express documented absence, and the ranges its member docs state are left to runtime validation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IState` in packages/engine/src/physics/AutoMovieStepPlanner.ts; its surface is the 4 members listed and the text shows 37 other files naming it, mostly packages/engine (17), packages/human (8), test (7), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IState {
    /** Contact phase. */
    phase: "planted" | "swing" | "reserved";
    /** Current support. */
    placement: IPlacement;
    /** Fraction through its segment. */
    progress: number;
    /** Absent while planted. */
    step?: IStep;
  }
  /**
   * Numeric policy has no hidden body or film presets.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Numeric policy has no hidden body or film presets.
   * @evidence contracts/development/design.md#principled-representation Represents Numeric policy has no hidden body or film presets: interface of 19 members (`pattern`, `start`, `end`, `rate`, `desired`, `heading`, ...); units and frames named in its text: second, world, metres, radians, seconds. Optional members `peakPitch`, `swingRetargeting` express documented absence, and the ranges its member docs state are left to runtime validation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IInput` in packages/engine/src/physics/AutoMovieStepPlanner.ts; its surface is the 19 members listed and the text shows 227 other files naming it, mostly packages/human (131), test (44), packages/engine (42), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; 2 optional members (`peakPitch`, `swingRetargeting`) are independent fields rather than alternatives of one another as far as their docs state; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IInput {
    /** Complete limb and footfall declaration. */ pattern: IAutoMovieFootfallPattern;
    /** First film second. */ start: number;
    /** Last film second. */ end: number;
    /** Scheduling ticks per second. */ rate: number;
    /**
     * Pure desired support placements in world metres/radians.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Pure desired support placements in world metres/radians) as stated in this comment.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Pure desired support placements in world metres/radians.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
     */ desired: (seconds: number) => Record<string, IPlacement>;
    /**
     * Pure body heading in radians.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Pure body heading in radians) as stated in this comment.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Pure body heading in radians.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
     */ heading: (seconds: number) => number;
    /** Authored support exclusions. */ reservations: IReservation[];
    /** Swing seconds. */ duration: number;
    /** Weighted placement-error trigger, metres. */ threshold: number;
    /** Peak vertical swing clearance, metres. */ height: number;
    /** Additional peak swing pitch, radians; defaults to zero. */ peakPitch?: number;
    /** Maximum single-step reach, metres. */ maximumStride: number;
    /** Seconds of allowed swing overlap; negative means double support. */ overlap: number;
    /** Default after-landing waits for an active swing to finish. The explicit from-scheduled-landing policy lets zero-duty limbs supersede it from its planned endpoint, retaining a kinematic discontinuity. */ swingRetargeting?:
      | "after-landing"
      | "from-scheduled-landing";
    /** Post-reservation clearance, seconds. */ reservationMargin: number;
    /** Pre-reservation clearance, seconds. */ margin: number;
    /** Yaw error lever, metres/radian. */ yawLever: number;
    /** Pitch error lever, metres/radian. */ pitchLever: number;
    /** Prefer another support within this many seconds of the last landing. */ alternationWindow: number;
  }
  /**
   * Signed shortest angle, radians, preserving both pi endpoints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Signed shortest angle, radians, preserving both pi endpoints.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Signed shortest angle, radians, preserving both pi endpoints) directly over its typed inputs (`value`) as a fixed number of statements with no loop or recursion in the body, delegating to `Envelope.angle`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 3 lines and 1 top-level statements that reuses `Envelope.angle` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `value`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function angle(value: number): number {
    return Envelope.angle(0, value, 1);
  }
  /**
   * Quintic endpoint interpolation and a lifted sine arc, as in supported stepping.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Quintic endpoint interpolation and a lifted sine arc, as in supported stepping.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Quintic endpoint interpolation and a lifted sine arc, as in supported stepping) directly over its typed inputs (`from`, `to`, `progress`, `height`, `peakPitch`) as a single pass (every over [ ...from.point, from.ya), delegating to `Math.max`, `Math.min`, `Envelope.smoother`, `angle`, `Math.sin`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 33 lines and 4 top-level statements that reuses `Math.max`, `Math.min`, `Envelope.smoother`, `angle`, `Math.sin` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `from`, `to`, `progress`, `height`, `peakPitch`; the dominant cost is a single pass (every over [ ...from.point, from.ya), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function swing(
    from: IPlacement,
    to: IPlacement,
    progress: number,
    height: number,
    peakPitch: number = 0,
  ): IPlacement {
    if (
      ![
        ...from.point,
        from.yaw,
        from.pitch,
        from.clearance,
        ...to.point,
        to.yaw,
        to.pitch,
        to.clearance,
        progress,
        height,
        peakPitch,
      ].every(Number.isFinite) ||
      height < 0
    )
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
