import type { IAutoMovieCopyDriver } from "./IAutoMovieCopyDriver";
import type { IAutoMovieDrivenDriver } from "./IAutoMovieDrivenDriver";

/**
 * A value-space dependency driver evaluated before world-space scene
 * constraints.
 *
 * Copy drivers consume selected TRS channels from a source node and produce
 * those channels on their owner. Driven drivers consume one named channel and
 * produce one output channel. orderValueDrivers indexes every producer of each
 * exact channel key, excludes only a driver's own self-input edge, preserves
 * input-index DFS tie order and throws on a cycle. Its fresh output array
 * borrows the original driver records without mutating them; no channel
 * reference or numeric-value admission occurs during ordering, and recursive
 * traversal can still exceed the host stack on a deep chain.
 */
export type IAutoMovieValueDriver =
  | IAutoMovieCopyDriver
  | IAutoMovieDrivenDriver;
