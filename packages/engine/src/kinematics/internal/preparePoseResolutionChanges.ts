/*
 * Select the articulations of one admitted pose on a rooted rig, as numbers.
 *
 * A query begins, writes each successfully admitted articulation by its bone's
 * row, a later write of a row winning, and completes. Completion selects, for
 * every row, the query's last write or, for a row the query did not write, the
 * fixed baseline (the identity without one), and says whether any selected
 * component differs from the selection before, signed zeros told apart. A query
 * that does not complete (its admission threw) leaves the last completed
 * selection as it is.
 * Parameter count: The rig's rooted bones.
 * Parameter baseline: The articulation a row no query writes is selected at, four
 * numbers a row (x, y, z, w); the identity for every row when absent.
 * Returns: The tracker.
 */
export function preparePoseResolutionChanges(
  count: number,
  baseline?: Float64Array,
): preparePoseResolutionChanges.ITracker {
  let generation: number = 0;
  let version: number = 0;
  const stamps: Float64Array = new Float64Array(count);
  const staged: Float64Array = new Float64Array(4 * count);
  const selected: Float64Array = new Float64Array(4 * count);
  if (baseline !== undefined) selected.set(baseline);
  else
    for (let index: number = 0; index < count; ++index)
      selected[4 * index + 3] = 1;
  return {
    selected,
    begin: (): void => {
      ++generation;
    },
    write: (
      index: number | undefined,
      x: number,
      y: number,
      z: number,
      w: number,
    ): void => {
      if (index === undefined) return;
      const row: number = 4 * index;
      stamps[index] = generation;
      staged[row] = x;
      staged[row + 1] = y;
      staged[row + 2] = z;
      staged[row + 3] = w;
    },
    complete: (): void => {
      let changed: boolean = false;
      for (let index: number = 0; index < count; ++index) {
        const row: number = 4 * index;
        const written: boolean = stamps[index] === generation;
        for (let k: number = 0; k < 4; ++k) {
          const next: number = written
            ? staged[row + k]!
            : baseline !== undefined
              ? baseline[row + k]!
              : k === 3
                ? 1
                : 0;
          if (Object.is(selected[row + k], next)) continue;
          selected[row + k] = next;
          changed = true;
        }
      }
      if (changed) ++version;
    },
    version: (): number => version,
  };
}

/*
 * The tracker's type.
 */
export namespace preparePoseResolutionChanges {
  /*
   * The selection of one live operation on an immutable rig.
   */
  export interface ITracker {
    /*
     * The completed selection, four numbers a row (x, y, z, w): read after
     * `complete`, never written by a reader.
     */
    readonly selected: Float64Array;

    /*
     * Start a query's writes without changing the completed selection.
     */
    begin(): void;

    /*
     * Record one admitted articulation's four components (x, y, z, w); a later
     * write of its row wins, and an undefined row is ignored.
     */
    write(
      index: number | undefined,
      x: number,
      y: number,
      z: number,
      w: number,
    ): void;

    /*
     * Select every row's last write of this query, or its baseline, and advance
     * the version when any component changed.
     */
    complete(): void;

    /*
     * The count of completions that changed the selection.
     */
    version(): number;
  }
}
