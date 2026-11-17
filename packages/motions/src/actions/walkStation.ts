import type { IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanFormation, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanWalkGait, IAutoMovieMotionHumanWalkPace, IAutoMovieMotionHumanWalkStation, IAutoMovieRandom, IAutoMovieVector3 } from "@automovie/interface";

import { createAutoMovieRandom, seededSmoothNoise } from "@automovie/engine";

import { HumanFormation } from "../ensemble/HumanFormation";
import { HumanRefusal } from "../law/HumanRefusal";
import { WalkPath } from "./WalkPath";
import { walkPaced } from "./walkPaced";

/**
 * A stepping plan walked to keep station on a moving point: a formation's
 * slot, a steered course, or a person followed. While the point moves, the
 * walker's speed along its own way follows the point's, and once the point
 * has stopped it walks the rest of its way at its own pace.
 *
 * Followers match a leader's speed: the follower's acceleration is
 * proportional to the difference of the two speeds, `a = c (v_point -
 * v_walker)` with `c` = `GAIN` (Rio, Rhea and Warren 2014, J Vis 14(2):4,
 * Table 1; fitted between 1 and 4 m of gap). Formations are kept the same
 * way, each member steering to its own place relative to a reference
 * (Balch and Arkin 1998; Reynolds 1999's offset pursuit), so a slot is
 * followed as a leader is. A walker sets off as the point does, slows where
 * it slows and stands while it stands, and after a change of the point's
 * speed by `dv` the gap has changed by `dv / c`. The law holds the gap, it
 * does not close it: what is left of the way when the point has stopped,
 * or from the place where the plan's own stop begins, is walked on the
 * plan's own clock, whose rate comes to 1 by the same first-order law, so
 * the walker stops as its own gait stops.
 *
 * The point's speed is the length it travels between readings `STEP`
 * apart, and no more than `FASTEST` times the gait's own cruising speed is
 * matched: a walker that cannot keep up falls behind and arrives after it.
 * The plan's way is the length its root travels, read at `SAMPLES`
 * instants; its cruising speed is the median of the speeds between them. A
 * point that does not move leaves the plan as it is. The plan's clock slows
 * with the speed, so a slower walker steps as long and less often, and one
 * whose point pauses holds its stride where it is.
 *
 * @param plan The walker's stepping plan at its own pace, laid along the point's way.
 * @param where Where the point is at a film second.
 * @param from The film second the walker's plan begins.
 * @param rests The film second the point comes to rest.
 * @returns The plan at the point's speed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law and its sources, what it does not do and how the way is finished, how the point and the plan are read.
 * @evidence contracts/development/implementation.md#principled-implementation The cited first-order law is integrated exactly over each `TICK` for a speed held constant in it; the travelled length is turned into the plan's second through the plan's own way, and `walkPaced` plays the plan on that clock. Speed is continuous where the plan's own clock takes over because that clock starts at the rate the speed has there.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the point's speeds, read the plan's way, integrate the two phases into one clock, hand it to `walkPaced`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `GAIN` is the cited fit; `FASTEST`, `STEP`, `TICK`, `SAMPLES` and `CRUISE` are named and provisional. The speed bound is the gait's, not a clamp of what was asked: the walker then arrives late, as stated.
 * @evidence contracts/development/implementation.md#efficient-algorithms One reading of the point every `STEP` seconds and `SAMPLES` postures of the plan, once per plan; each tick of the clock costs one search of the way.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache beyond the readings and the clock built once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds the clock for as long as the returned plan is held.
 */
export function walkStation(
  plan: IAutoMovieMotionHumanActionPlan,
  where: (seconds: number) => IAutoMovieVector3,
  from: number,
  rests: number,
): IAutoMovieMotionHumanActionPlan {
  // The point's speed between readings.
  const count: number = Math.ceil((rests - from) / walkStation.STEP);
  if (count < 1) return plan;
  const step: number = (rests - from) / count;
  const speeds: number[] = [];
  let before: IAutoMovieVector3 = where(from);
  let led: number = 0;
  for (let i: number = 1; i <= count; ++i) {
    const now: IAutoMovieVector3 = where(from + i * step);
    const length: number = Math.hypot(now.x - before.x, now.z - before.z);
    speeds.push(length / step);
    led += length;
    before = now;
  }

  // The plan's way: the length its root has travelled at each sampled second.
  const seconds: number[] = [0];
  const lengths: number[] = [0];
  let root: IAutoMovieMotionHumanPosture["root"] = plan.posture(0).root;
  for (let i: number = 1; i <= walkStation.SAMPLES; ++i) {
    const t: number = (i / walkStation.SAMPLES) * plan.duration;
    const now: IAutoMovieMotionHumanPosture["root"] = plan.posture(t).root;
    seconds.push(t);
    lengths.push(lengths[i - 1]! + Math.hypot(now.x - root.x, now.z - root.z));
    root = now;
  }
  const whole: number = lengths[walkStation.SAMPLES]!;
  if (led < 1e-6 || whole < 1e-9) return plan;
  const rate = (i: number): number =>
    (lengths[i]! - lengths[i - 1]!) / (seconds[i]! - seconds[i - 1]!);
  const rates: number[] = seconds
    .slice(1)
    .map((_: number, i: number): number => rate(i + 1));
  const cruise: number = [...rates].sort(
    (a: number, b: number): number => a - b,
  )[rates.length >> 1]!;

  // Where the plan's own stop begins: the end of its last stretch at cruising speed.
  let brake: number = whole;
  for (let i: number = walkStation.SAMPLES; i >= 1; --i)
    if (rates[i - 1]! >= walkStation.CRUISE * cruise) {
      brake = lengths[i]!;
      break;
    }
  const secondAt = (length: number): number => {
    let i: number = 1;
    while (i < walkStation.SAMPLES && lengths[i]! < length) ++i;
    const span: number = lengths[i]! - lengths[i - 1]!;
    return (
      seconds[i - 1]! +
      (span < 1e-12 ? 0 : Math.min(1, (length - lengths[i - 1]!) / span)) *
        (seconds[i]! - seconds[i - 1]!)
    );
  };

  // The walker's speed follows the point's while it moves and the plan's own stop has not begun.
  const tick: number = walkStation.TICK;
  const decay: number = Math.exp(-walkStation.GAIN * tick);
  const clock: number[] = [0];
  let travelled: number = 0;
  let speed: number = 0;
  for (
    let t: number = 0;
    t < rests - from && travelled < brake && clock.length < walkStation.TICKS;
    t += tick
  ) {
    const asked: number = Math.min(
      walkStation.FASTEST * cruise,
      speeds[Math.min(count - 1, Math.floor(t / step))]!,
    );
    travelled +=
      asked * tick + ((speed - asked) * (1 - decay)) / walkStation.GAIN;
    speed = asked + (speed - asked) * decay;
    clock.push(secondAt(Math.min(travelled, whole)));
  }

  // The rest of the way on the plan's own clock, its rate coming to 1 from the rate the speed has here.
  let planned: number = clock[clock.length - 1]!;
  const own: number =
    rates[
      Math.min(
        walkStation.SAMPLES - 1,
        Math.floor((planned / plan.duration) * walkStation.SAMPLES),
      )
    ]!;
  let pace: number =
    own > 1e-6 ? Math.min(walkStation.FASTEST, speed / own) : 1;
  while (planned < plan.duration - 1e-9 && clock.length < walkStation.TICKS) {
    planned += tick + ((pace - 1) * (1 - decay)) / walkStation.GAIN;
    pace = 1 + (pace - 1) * decay;
    clock.push(Math.min(plan.duration, planned));
  }
  clock[clock.length - 1] = plan.duration;
  return walkPaced(plan, tick, clock);
}

/**
 * Constants of {@link walkStation}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each constant states its unit, and its source or that it is provisional.
 * @evidence contracts/development/design.md#principled-representation A cited rate, a dimensionless factor, intervals in seconds and counts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The numbers the function reads, and the station's readers the walk family calls: `resolve` (the way), `rests` (its end), `point` (the dressed slot) and `cadenced` (a called gait's way on it), with `IStationed`, `SPACING` and `DRESS_FREQUENCY`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Named and marked, not numbers inside the function.
 */
export namespace walkStation {
  /** The gain of speed matching, per second: a follower's acceleration per unit of speed difference from the leader (Rio, Rhea and Warren 2014, J Vis 14(2):4, Table 1). */
  export const GAIN: number = 1.87;

  /** The most of its gait's cruising speed a follower matches (provisional: beyond it a walk would have to become a run). */
  export const FASTEST: number = 1.5;

  /** Seconds between two readings of the point's place (provisional: a few readings a step). */
  export const STEP: number = 0.25;

  /** Seconds between two entries of the follower's clock (provisional: under a film frame). */
  export const TICK: number = 0.02;

  /** The most entries a clock holds: ten minutes of them, which no shot reaches. */
  export const TICKS: number = 30_000;

  /** Instants of the plan at which its way is read (provisional: a step is read several times over). */
  export const SAMPLES: number = 80;

  /** The share of its cruising speed under which the plan is taken to be stopping (provisional). */
  export const CRUISE: number = 0.9;

  /** The fastest a member's dress deviation swings, hertz (provisional: once in about two strides of a march at quick time). */
  export const DRESS_FREQUENCY: number = 0.25;

  /** Metres between two kept corners of a slot's way handed to the stepping plan (provisional: about a stride, so no corner falls within one step of the last). */
  export const SPACING: number = 1;

  /**
   * A walk's context with a station resolved into its way: `to` the slot
   * where the frame comes to rest and `via` the slot's way from the action's
   * start, its corners kept `SPACING` apart. A context without a station is
   * returned as it is.
   *
   * @param context The walk's context.
   * @returns The context the stepping plan reads.
   * @throws {HumanRefusal} When the station ends before the action starts, or a guide frame's station names no end.
   */
  export function resolve<P extends IAutoMovieMotionHumanWalkStation.IStationed>(
    context: IAutoMovieMotionHumanActionContext<P>,
  ): IAutoMovieMotionHumanActionContext<P> {
    const station: IAutoMovieMotionHumanFormation.IStation | undefined =
      context.params.station;
    if (station === undefined) return context;
    const from: number = context.start;
    const until: number = rests(context, station);
    // The slot's way at the formation's sampling, each point the member's dressed place there.
    const at: (seconds: number) => IAutoMovieVector3 = point(context, station);
    const samples: IAutoMovieMotionHumanFormation.ISample[] = [];
    const count: number =
      until > from
        ? Math.ceil((until - from) / HumanFormation.SAMPLE - 1e-9)
        : 0;
    for (let k: number = 0; k <= count; ++k) {
      const seconds: number =
        k === count ? Math.max(from, until) : from + k * HumanFormation.SAMPLE;
      samples.push({ seconds, ...at(seconds) });
    }
    const last: IAutoMovieMotionHumanFormation.ISample = samples[samples.length - 1]!;
    const via: IAutoMovieVector3[] = [];
    let kept: IAutoMovieVector3 = context.entry.posture.root;
    for (const s of samples.slice(0, -1))
      if (
        Math.hypot(s.x - kept.x, s.z - kept.z) >= SPACING &&
        Math.hypot(last.x - s.x, last.z - s.z) >= SPACING
      ) {
        kept = { x: s.x, y: 0, z: s.z };
        via.push(kept);
      }
    return {
      ...context,
      params: {
        ...context.params,
        to: { x: last.x, y: 0, z: last.z },
        ...(via.length === 0 ? {} : { via }),
      },
    };
  }

  /**
   * The film second a walk's station ends: its `until`, or its frame's rest.
   *
   * @param context The walk's context.
   * @param station The station.
   * @returns The second.
   * @throws {HumanRefusal} When a fixed or guide frame's station names no end, or it ends before the action starts.
   */
  export function rests(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWalkStation.IStationed>,
    station: IAutoMovieMotionHumanFormation.IStation,
  ): number {
    const until: number | null =
      station.until ?? HumanFormation.end(station.formation);
    if (until === null && station.formation.frame.kind === "fixed")
      return context.start;
    if (until === null)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "station.until",
        value: undefined,
        reason:
          "the station follows a guide, whose rest only the guide's own actions decide",
        fix: "give the station the film second it ends (until)",
      });
    if (until < context.start)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "station.until",
        value: until,
        feasible: {
          kind: "range",
          minimum: context.start,
          maximum: null,
          unit: "s",
        },
        reason: `the station ends at ${until.toFixed(3)} s, before the walk starts at ${context.start.toFixed(3)} s`,
        fix: "start the walk before its station ends, or end the station later",
      });
    return until;
  }

  /**
   * A cadenced walk's way on its station: the share of its way its pelvis
   * has gone at each second of the walk, where the slot then projects onto
   * that way (its nearest point, as path following reads a target), never
   * going back. A gait whose cadence is called keeps its count, so it
   * keeps its place by the length of its steps (`WalkPace`'s way set from
   * outside), as a drilled soldier lengthens or shortens his pace to keep his
   * dressing: it marks time while the slot stands, steps short while the
   * frame gathers speed and on the inner flank of a wheel, and halts as the
   * slot halts.
   *
   * The way is the stepping plan's own, from the feet's midpoint through the
   * resolved `via` to `to`, so a slot that swings round a corner the way cuts
   * holds the walker where it is rather than stretching every step. The
   * slot is read every `TICK`, and the pelvis goes no faster than `FASTEST`
   * times the walk's cruising speed: a walker who cannot keep up falls
   * behind and closes up once the slot slows or stops, and walks what is
   * left once it rests. Nothing when
   * the gait draws its own tempo (`walkStation` keeps its station by speed
   * matching), when the walk keeps no station, or when the slot does not
   * move.
   *
   * @param context The walk's context, its station resolved.
   * @param gait Whether the gait's cadence is called.
   * @param cruise The walk's cruising speed, m/s.
   * @returns The way to hand to the stepping plan, or nothing.
   */
  export function cadenced(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWalkStation.IStationed>,
    gait: Pick<IAutoMovieMotionHumanWalkGait, "called">,
    cruise: number,
  ): Pick<IAutoMovieMotionHumanWalkPace.IProps, "travel"> {
    const station: IAutoMovieMotionHumanFormation.IStation | undefined =
      context.params.station;
    if (station === undefined || gait.called !== true) return {};
    const from: number = context.start;
    const span: number = rests(context, station) - from;
    if (!(span > 0)) return {};

    // The plan's own way, as the stepping plan lays it: from the feet's midpoint through `via` to `to`.
    const feet: IAutoMovieMotionHumanActionContext["entry"]["feet"] = context.entry.feet;
    const way: WalkPath = new WalkPath(
      [
        {
          x: (feet.left.ankle.x + feet.right.ankle.x) / 2,
          y: 0,
          z: (feet.left.ankle.z + feet.right.ankle.z) / 2,
        },
        ...(context.params.via ?? []),
        context.params.to,
      ].map(
        (q: IAutoMovieVector3): IAutoMovieVector3 => ({ x: q.x, y: 0, z: q.z }),
      ),
    );
    if (way.length < 1e-6) return {};
    const where: (seconds: number) => IAutoMovieVector3 = point(
      context,
      station,
    );
    if (
      Math.hypot(
        where(from + span).x - where(from).x,
        where(from + span).z - where(from).z,
      ) < 1e-6
    )
      return {};

    // The walker's share: where the slot projects onto the way, never back, no faster than it can step.
    const rate: number = (FASTEST * cruise) / way.length;
    const shares: number[] = [0];
    for (let k: number = 1; shares[k - 1]! < 1 - 1e-9 && k < TICKS; ++k) {
      const slot: number =
        way.nearest(where(from + Math.min(span, k * TICK))) / way.length;
      const before: number = shares[k - 1]!;
      shares.push(
        k * TICK >= span
          ? Math.min(1, before + rate * TICK)
          : Math.max(before, Math.min(slot, before + rate * TICK)),
      );
    }
    return {
      travel: (seconds: number): number => {
        const u: number = Math.max(0, seconds / TICK);
        const i: number = Math.floor(u);
        if (i >= shares.length - 1) return 1;
        return shares[i]! + (shares[i + 1]! - shares[i]!) * (u - i);
      },
    };
  }
  /**
   * The point a walk's station keeps at a film second: its slot, moved by
   * the member's slow dress deviation when the station carries one.
   *
   * @param context The walk's context.
   * @param station The station.
   * @returns The slot's floor point at a second.
   */
  export function point(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWalkStation.IStationed>,
    station: IAutoMovieMotionHumanFormation.IStation,
  ): (seconds: number) => IAutoMovieVector3 {
    const read: IAutoMovieMotionHumanFormation.Reader = (
      subject: string,
      t: number,
    ): IAutoMovieMotionHumanActionContext.IRoot => context.performer(subject).root(t);
    const dress: { bound: number; seed: string } | undefined = station.dress;
    if (dress === undefined || !(dress.bound > 0))
      return (seconds: number): IAutoMovieVector3 =>
        HumanFormation.slot(station.formation, station.slot, seconds, read).at;

    // A slow deviation from the slot along each of the frame's axes, smooth and zero where the station begins and ends (`seededSmoothNoise`), swinging at most `DRESS_FREQUENCY` hertz.
    const local: IAutoMovieMotionHumanFormation.ILocal = HumanFormation.local(
      station.formation,
      station.slot,
    );
    const from: number = context.start;
    const span: number = Math.max(rests(context, station) - from, 1e-6);
    const random: IAutoMovieRandom = createAutoMovieRandom(dress.seed);
    const lateral: IAutoMovieRandom = random.stream("lateral");
    const depth: IAutoMovieRandom = random.stream("depth");
    return (seconds: number): IAutoMovieVector3 => {
      const u: number = (seconds - from) / span;
      return HumanFormation.place(
        HumanFormation.frame(station.formation, seconds, read),
        {
          lateral:
            local.lateral +
            dress.bound * seededSmoothNoise(lateral, u, span, DRESS_FREQUENCY),
          depth:
            local.depth +
            dress.bound * seededSmoothNoise(depth, u, span, DRESS_FREQUENCY),
        },
      );
    };
  }
}
