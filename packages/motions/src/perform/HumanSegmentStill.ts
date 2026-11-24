import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import { HumanSegmentSelection } from "./HumanSegmentSelection";

/**
 * Where a person's shown pose holds still: one and the same pose over an
 * interval of film seconds, read off what the display pipeline makes it of
 * (`HumanSegmentPose.seeded`). The pose is a function of the second only
 * through the active action's posture at its clamped local second, the layers,
 * the overlays, the held props, the stopped weapons and a live transition
 * offset; with none of the others, one action active over the interval and its
 * offset decayed, the pose is the same wherever that clamped second is the
 * same, or wherever the plan declares its posture still
 * (`IAutoMovieMotionHumanActionPlan.still`).
 */
export namespace HumanSegmentStill {
  /**
   * What the reading takes of an action: its placement, transition and plan's
   * still window.
   */
  export interface ISegment extends Pick<
    IAutoMovieMotionHumanSegment,
    "entryTime" | "start" | "transition"
  > {
    /** The plan's duration and still window. */
    plan: Pick<IAutoMovieMotionHumanActionPlan, "duration" | "still">;
  }

  /**
   * What the reading takes of a person: what can move the pose, and the
   * actions.
   */
  export interface IPerson extends Pick<
    IAutoMovieMotionHumanSegment.IPerson,
    "layers" | "overlays" | "holds" | "stops"
  > {
    /** The placed actions, in film order. */
    segments: readonly ISegment[];
  }

  /**
   * Whether a person's shown pose is one and the same over an interval.
   *
   * @param person The person, with the stops of the moment installed.
   * @param from The interval's start, film seconds.
   * @param to Its end, film seconds.
   * @returns Whether the pose is constant there.
   */
  export function within(person: IPerson, from: number, to: number): boolean {
    if (
      person.layers.length !== 0 ||
      person.overlays.length !== 0 ||
      person.holds.length !== 0 ||
      person.stops.size !== 0
    )
      return false;
    const active: ISegment | undefined = HumanSegmentSelection.last(
      person.segments,
      from,
    );
    if (HumanSegmentSelection.last(person.segments, to) !== active)
      return false;
    if (active === undefined) return true;
    const transition: ISegment["transition"] = active.transition;
    if (
      transition !== undefined &&
      transition.kind !== "redirect" &&
      from - transition.cut < transition.blend
    )
      return false;
    const duration: number = active.plan.duration;
    const lo: number = Math.min(duration, Math.max(0, from - active.start));
    const hi: number = Math.min(duration, Math.max(0, to - active.start));
    if (lo === hi) return true;
    const window: readonly [number, number] | undefined = active.plan.still;
    return window !== undefined && lo >= window[0] && hi <= window[1];
  }

  /**
   * The earliest second before a given one whose shown pose is the given one's,
   * where the pose holds still between them: the end of the active action's
   * plan when the second lies past it, or the start of the plan's still window
   * when it lies inside one.
   *
   * @param person The person.
   * @param seconds Film seconds.
   * @returns The earlier second, or undefined where the pose does not hold
   *   still back to one.
   */
  export function representative(
    person: IPerson,
    seconds: number,
  ): number | undefined {
    const active: ISegment | undefined = HumanSegmentSelection.last(
      person.segments,
      seconds,
    );
    if (active === undefined) return undefined;
    const duration: number = active.plan.duration;
    const local: number = seconds - active.start;
    const window: readonly [number, number] | undefined = active.plan.still;
    const target: number | undefined =
      window !== undefined && local > window[0] && local <= window[1]
        ? window[0]
        : local > duration
          ? duration
          : undefined;
    if (target === undefined) return undefined;

    // The least second whose local second is the target itself.
    let at: number = active.start + target;
    while (at - active.start < target)
      at += Number.EPSILON * Math.max(1, Math.abs(at));
    return at < seconds && within(person, at, seconds) ? at : undefined;
  }
}
