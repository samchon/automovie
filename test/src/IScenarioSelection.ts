import type { IScenarioShard } from "./IScenarioShard";

/**
 * An admitted command-line request retains include and exclude terms in their original occurrence order, including duplicates; an empty include list means all discovered basenames before exclusions. An optional shard then keeps one slice of that selection.
 */
export interface IScenarioSelection {
  /** The slice of the selection this run executes; the whole selection when absent. */
  shard?: IScenarioShard;

  /** Ordered nonblank include substrings matched against discovered module basenames. */
  include: string[];

  /** Ordered nonblank exclude substrings, each required to match some discovered module basename. */
  exclude: string[];
}
