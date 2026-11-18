import type { IAutoMovieMotionHumanSegment } from "@automovie/interface";

import { HumanSegmentSelection } from "./HumanSegmentSelection";

/**
 * Where a person's shown pose holds still: one and the same pose over an
 * interval of film seconds, read off what the display pipeline makes it of
 * (`HumanSegmentPose.seeded`). The pose is a function of the second only
 * through the active action's posture at its clamped local second, the
 * layers, the overlays, the held props, the stopped weapons and a live
 * transition offset; with none of the others, one action active over the
 * interval and its offset decayed, the pose is the same wherever that
 * clamped second is the same, or wherever the plan declares its posture
 * still (`IAutoMovieMotionHumanActionPlan.still`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is certified, the terms of the shown pose it reads and the two cases of a constant posture input.
 * @evidence contracts/development/design.md#principled-representation An interval certificate and a representative second, both read from the person's current state.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `within` serves the contact scan's body bound and `representative` the display's kept poses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is estimated or kept: any term that may change refuses the certificate.
 */
export namespace HumanSegmentStill {
  /**
   * Whether a person's shown pose is one and the same over an interval.
   *
   * @param person The person, with the stops of the moment installed.
   * @param from The interval's start, film seconds.
   * @param to Its end, film seconds.
   * @returns Whether the pose is constant there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is certified and over what.
   * @evidence contracts/development/implementation.md#principled-implementation With no layer, overlay, hold or stop, one action active over the interval (`HumanSegmentSelection.last` is the same at both ends, so at every second between) and its offset decayed at the start, the pose is constant where the clamped local second is, or where the plan declares its posture still.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One gate per term of the shown pose, then the plan's clamped interval.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Any term that may change refuses the certificate; nothing is estimated.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two selections and constant checks.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads the person's current state.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function within(person: IAutoMovieMotionHumanSegment.IPerson, from: number, to: number): boolean {
    if (person.layers.length !== 0 || person.overlays.length !== 0 || person.holds.length !== 0 || person.stops.size !== 0)
      return false;
    const active: IAutoMovieMotionHumanSegment | undefined = HumanSegmentSelection.last(person.segments, from);
    if (HumanSegmentSelection.last(person.segments, to) !== active) return false;
    if (active === undefined) return true;
    const transition: IAutoMovieMotionHumanSegment["transition"] = active.transition;
    if (transition !== undefined && transition.kind !== "redirect" && from - transition.cut < transition.blend)
      return false;
    const duration: number = active.plan.duration;
    const lo: number = Math.min(duration, Math.max(0, from - active.start));
    const hi: number = Math.min(duration, Math.max(0, to - active.start));
    if (lo === hi) return true;
    const window: readonly [number, number] | undefined = active.plan.still;
    return window !== undefined && lo >= window[0] && hi <= window[1];
  }

  /**
   * The earliest second before a given one whose shown pose is the given
   * one's, where the pose holds still between them: the end of the active
   * action's plan when the second lies past it, or the start of the plan's
   * still window when it lies inside one.
   *
   * @param person The person.
   * @param seconds Film seconds.
   * @returns The earlier second, or undefined where the pose does not hold still back to one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which second is returned and when none is.
   * @evidence contracts/development/implementation.md#principled-implementation The plan's end is taken as the least film second whose local second reaches the duration, so the clamped input there is the duration itself; the window's start is the plan's own; `within` certifies the stretch between.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One selection, one candidate second, one certificate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A candidate the certificate refuses is not returned; no tolerance stands for equality of the clamped input.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant checks and two selections.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads the person's current state.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function representative(person: IAutoMovieMotionHumanSegment.IPerson, seconds: number): number | undefined {
    const active: IAutoMovieMotionHumanSegment | undefined = HumanSegmentSelection.last(person.segments, seconds);
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
    while (at - active.start < target) at += Number.EPSILON * Math.max(1, Math.abs(at));
    return at < seconds && within(person, at, seconds) ? at : undefined;
  }
}
