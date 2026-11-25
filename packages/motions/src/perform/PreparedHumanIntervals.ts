/** Prepare lookups over an immutable list of action seconds. */
export namespace PreparedHumanIntervals {
  /** A closed interval on the action clock. */
  export interface IInterval {
    /** The first included second. */
    readonly from: number;

    /** The last included second. */
    readonly to: number;
  }

  /**
   * Find the first sorted key at or after the requested second. Return the key
   * count if every key precedes it.
   */
  export function lowerBound(
    length: number,
    at: (index: number) => number,
    second: number,
  ): number {
    return bound(length, at, second, false);
  }

  /** Find the first sorted key strictly after the requested second. */
  export function upperBound(
    length: number,
    at: (index: number) => number,
    second: number,
  ): number {
    return bound(length, at, second, true);
  }

  /** Search a sorted prefix whose keys precede the selected boundary. */
  function bound(
    length: number,
    at: (index: number) => number,
    second: number,
    skipEqual: boolean,
  ): number {
    let low: number = 0;
    let high: number = length;
    while (low < high) {
      const mid: number = Math.floor((low + high) / 2);
      const time: number = at(mid);
      if (time < second || (skipEqual && time === second)) low = mid + 1;
      else high = mid;
    }
    return low;
  }

  /**
   * Index closed intervals by their declared priority. Store every endpoint and
   * each open space between consecutive endpoints as separate leaves, so a
   * shared second can have a different owner from either side. A phase is
   * stored on the nodes that exactly cover its leaf range. The lowest phase
   * index on the path to a leaf wins.
   */
  export function first<T extends IInterval>(
    intervals: readonly T[],
  ): (second: number) => T | undefined {
    const admitted: T[] = intervals.filter(
      (entry: T): boolean => entry.from <= entry.to,
    );
    const only: T | undefined = admitted[0];
    if (admitted.length < 2)
      return (second: number): T | undefined =>
        only !== undefined && second >= only.from && second <= only.to
          ? only
          : undefined;
    if (
      admitted.every(
        (phase: T, index: number): boolean =>
          index === 0 || phase.from >= admitted[index - 1]!.to,
      )
    ) {
      const endAt = (index: number): number => admitted[index]!.to;
      return (second: number): T | undefined => {
        const phase: T | undefined =
          admitted[lowerBound(admitted.length, endAt, second)];
        return phase !== undefined && second >= phase.from ? phase : undefined;
      };
    }
    const times: number[] = [
      ...new Set(
        admitted.flatMap((entry: T): number[] => [entry.from, entry.to]),
      ),
    ].sort((a: number, b: number): number => a - b);
    const size: number = 2 ** Math.ceil(Math.log2(2 * times.length - 1));
    const owners: number[] = new Array<number>(2 * size).fill(admitted.length);
    const timeAt = (index: number): number => times[index]!;
    admitted.forEach((entry: T, owner: number): void => {
      let left: number =
        size + 2 * lowerBound(times.length, timeAt, entry.from);
      let right: number = size + 2 * lowerBound(times.length, timeAt, entry.to);
      while (left <= right) {
        if (left % 2 === 1) {
          owners[left] = Math.min(owner, owners[left]!);
          ++left;
        }
        if (right % 2 === 0) {
          owners[right] = Math.min(owner, owners[right]!);
          --right;
        }
        left = Math.floor(left / 2);
        right = Math.floor(right / 2);
      }
    });
    for (let node: number = 2; node < owners.length; ++node)
      owners[node] = Math.min(owners[node]!, owners[Math.floor(node / 2)]!);
    return (second: number): T | undefined => {
      if (!(second >= times[0]! && second <= times[times.length - 1]!))
        return undefined;
      const upper: number = lowerBound(times.length, timeAt, second);
      const slot: number = 2 * upper - (times[upper] === second ? 0 : 1);
      return admitted[owners[size + slot]!];
    };
  }
}
