import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieResolveContactEvents,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanSegment } from "./HumanSegment";
import { HumanSegmentSelection } from "./HumanSegmentSelection";

/**
 * The speed bounds a performance states to the engine's contact scan
 * (`IAutoMovieResolveContactEvents.IWeapon.speed`, `IBody.speed`), each on
 * one search's grid, so the scan reads no grid second a clear gap rules out
 * and finds the contact a scan of every second finds.
 *
 * A weapon's bound is read off its own path: the most any end of its axis
 * moves between two neighbouring grid seconds of its live window, over
 * their interval, which by the triangle inequality bounds every pair of grid
 * seconds and, the radii being fixed, every point of its sphere or capsule.
 * A person's bound is 0 where the display pipeline proves the shown pose
 * constant (`still`), and none elsewhere: a limb fit states no rate bound,
 * so a moving pose has no certified one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both bounds, why each holds on the grid and where none is stated.
 * @evidence contracts/development/design.md#principled-representation Bounds on the search's own grid, the only seconds the scan reads where it advances.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The weapon's grid bound and the person's still certificate the contact resolution states.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No bound is estimated: the weapon's is measured on the grid from its own path, the person's is 0 only where the pose provably does not change.
 */
export namespace HumanPerformanceContactSpeed {
  /**
   * A weapon's bound on a search's grid, from its own path.
   *
   * @param read The weapon's axis at a second: its centre or first end, and its capsule's other end.
   * @param from The weapon's live start, seconds.
   * @param to The weapon's live end, seconds.
   * @param grid The search's grid.
   * @returns The bound between two grid seconds of the live window; undefined at a second off the grid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reader, the window and the off-grid answer.
   * @evidence contracts/development/implementation.md#principled-implementation The largest end displacement between neighbouring grid seconds over their interval bounds the displacement between any two grid seconds by the triangle inequality, and every capsule point moves no farther than its ends do (each is a fixed affine mix of them).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The grid seconds from the first one asked to the live end are read once, their rates kept with their suffix maxima.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every grid second of the window is read from the actual path; a second off the grid is given no bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms One read per grid second of the window a search, which the caller shares with the scan's own reads at those seconds; each ask to the live end is a constant lookup, a shorter one a walk of its steps.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The grid seconds read are the scan's own.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Two number arrays over the window's steps, released with the search.
   */
  export function weapon(
    read: (
      seconds: number,
    ) => readonly [IAutoMovieVector3, IAutoMovieVector3 | undefined],
    from: number,
    to: number,
    grid: IAutoMovieResolveContactEvents.IGrid,
  ): IAutoMovieResolveContactEvents.Speed {
    // The grid's seconds as the scan computes them, and the index of its end.
    const second = (k: number): number =>
      Math.min(grid.to, grid.from + k * grid.step);
    const ends: number = Math.max(
      0,
      Math.ceil((grid.to - grid.from) / grid.step),
    );
    const index = (seconds: number): number | undefined => {
      const k: number = Math.min(
        ends,
        Math.max(0, Math.round((seconds - grid.from) / grid.step)),
      );
      return second(k) === seconds ? k : seconds === grid.to ? ends : undefined;
    };

    // The last grid second inside the live window.
    let last: number = Math.min(
      ends,
      Math.max(0, Math.floor((to - grid.from) / grid.step)),
    );
    while (last > 0 && second(last) > to) --last;
    if (last < ends && second(last + 1) <= to) ++last;
    let first: number | undefined;
    let rates: number[] = [];
    let suffix: number[] = [];
    const build = (start: number): void => {
      first = start;
      rates = [];
      let before: readonly [IAutoMovieVector3, IAutoMovieVector3 | undefined] =
        read(second(start));
      for (let k: number = start; k < last; ++k) {
        const after: readonly [
          IAutoMovieVector3,
          IAutoMovieVector3 | undefined,
        ] = read(second(k + 1));
        const moved: number = Math.max(
          Vector3.distance(before[0], after[0]),
          Vector3.distance(before[1] ?? before[0], after[1] ?? after[0]),
        );
        rates.push(moved / (second(k + 1) - second(k)));
        before = after;
      }
      suffix = new Array<number>(rates.length + 1);
      suffix[rates.length] = 0;
      for (let i: number = rates.length - 1; i >= 0; --i)
        suffix[i] = Math.max(rates[i]!, suffix[i + 1]!);
    };
    return (at: number, until: number): number | undefined => {
      const k: number | undefined = index(at);
      if (k === undefined || at < from) return undefined;
      if (k >= last) return 0;
      if (first === undefined || k < first) build(k);
      const i: number = k - first!;
      if (until >= second(last)) return suffix[i];
      let bound: number = 0;
      for (
        let j: number = i;
        j < rates.length && second(first! + j + 1) <= until;
        ++j
      )
        bound = Math.max(bound, rates[j]!);
      return bound;
    };
  }

  /**
   * Whether a person's shown pose is one and the same over an interval.
   *
   * @param person The person, with the stops of the search installed.
   * @param from The interval's start, film seconds.
   * @param to Its end, film seconds.
   * @returns Whether the pose is constant there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is certified and over what.
   * @evidence contracts/development/implementation.md#principled-implementation The shown pose (`HumanSegmentPose.seeded`) is a function of the second only through the active action's posture at its clamped local second, the layers, the overlays, the held props, the stopped weapons and a live transition offset; with no layer, overlay, hold or stop, one action active over the interval (`HumanSegmentSelection.last` is the same at both ends, so at every second between) and its offset decayed, the pose is constant where that clamped second is, or where the plan declares its posture still.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One gate per term of the shown pose, then the plan's clamped interval.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Any term that may change refuses the certificate; nothing is estimated.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two selections and constant checks.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads the person's current state.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function still(
    person: HumanSegment.IPerson,
    from: number,
    to: number,
  ): boolean {
    if (
      person.layers.length !== 0 ||
      person.overlays.length !== 0 ||
      person.holds.length !== 0 ||
      person.stops.size !== 0
    )
      return false;
    const active: HumanSegment.ISegment | undefined =
      HumanSegmentSelection.last(person.segments, from);
    if (HumanSegmentSelection.last(person.segments, to) !== active)
      return false;
    if (active === undefined) return true;
    const transition: HumanSegment.ISegment["transition"] = active.transition;
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
}
