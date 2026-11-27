import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieResolveContactEvents,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * The speed bounds a performance states to the engine's contact scan
 * (`IAutoMovieResolveContactEvents.IWeapon.speed`, `IBody.speed`), each on one
 * search's grid, so the scan reads no grid second a clear gap rules out and
 * finds the contact a scan of every second finds.
 *
 * A weapon's bound is read off its own path: the most any end of its axis moves
 * between two neighbouring grid seconds of its live window, over their
 * interval, which by the triangle inequality bounds every pair of grid seconds
 * and, the radii being fixed, every point of its sphere or capsule. A person's
 * bound is 0 where the display pipeline proves the shown pose constant
 * (`HumanSegmentStill.within`), and none elsewhere: a limb fit states no rate
 * bound, so a moving pose has no certified one.
 */
export namespace HumanPerformanceContactSpeed {
  /*
   * A weapon's bound on a search's grid, from its own path.
   * Parameter read: The weapon's axis at a second: its centre or first end, and its
   * capsule's other end.
   * Parameter from: The weapon's live start, seconds.
   * Parameter to: The weapon's live end, seconds.
   * Parameter grid: The search's grid.
   * Returns: The bound between two grid seconds of the live window; undefined
   * at a second off the grid.
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
    // The rates of neighbouring grid seconds read so far, from the first one
    // asked: rates[i] lies between second(first + i) and the next. They are
    // extended only as far as an ask reaches, the axis of the last second
    // read kept for the next rate.
    let first: number | undefined;
    const rates: number[] = [];
    let before:
      | readonly [IAutoMovieVector3, IAutoMovieVector3 | undefined]
      | undefined;
    const extend = (end: number): void => {
      for (let k: number = first! + rates.length; k < end; ++k) {
        const after: readonly [
          IAutoMovieVector3,
          IAutoMovieVector3 | undefined,
        ] = read(second(k + 1));
        const moved: number = Math.max(
          Vector3.distance(before![0], after[0]),
          Vector3.distance(before![1] ?? before![0], after[1] ?? after[0]),
        );
        rates.push(moved / (second(k + 1) - second(k)));
        before = after;
      }
    };
    return (at: number, until: number): number | undefined => {
      const k: number | undefined = index(at);
      if (k === undefined || at < from) return undefined;
      if (k >= last) return 0;
      if (first === undefined || k < first) {
        first = k;
        rates.length = 0;
        before = read(second(k));
      }

      // The last grid second of the live window within the ask.
      let end: number = k;
      while (end < last && second(end + 1) <= until) ++end;
      extend(end);
      let bound: number = 0;
      for (let j: number = k - first; j < end - first; ++j)
        bound = Math.max(bound, rates[j]!);
      return bound;
    };
  }
}
