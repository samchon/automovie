/**
 * One slice of the selected scenarios for a sharded run: the scenarios whose position in the name-sorted selection, modulo `count`, equals `index`. Every scenario lands in exactly one of the `count` slices, so the slices together run the whole selection once.
 */
export interface IScenarioShard {
  /** Zero-based slice number, an integer in [0, count). */
  index: number;

  /** Number of slices, an integer of at least 1. */
  count: number;
}
