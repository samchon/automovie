import type { IAutoMovieChannel } from "@automovie/interface";

/**
 * Historical prop control metadata retained when reading a v1 project record.
 *
 * Conversion preserves this stored format but omits controls from the engine profile: no runtime ever applied their defaults or bound their channels.
 *
 * @evidence contracts/common.md#principled-implementation The stored record keeps its historical channel and default-vector representation; current engine profiles contain only fields with runtime semantics.
 * @evidence contracts/common.md#clear-and-simple-design Historical metadata belongs to the legacy project boundary instead of remaining an unread active interface capability.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Conversion does not invent control execution or apply previously ignored defaults; omission is the explicit historical behavior.
 * @evidence contracts/common.md#meaningful-documentation States persistence purpose, absence of runtime application and the meanings of the historical fields.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type declares stored data and executes no migration or binding algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Historical metadata starts no work and participates in no runtime result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The enclosing legacy record owns the control list and default arrays; this declaration acquires no handle or task.
 * @author Samchon
 */
export interface IAutoMovieLegacyPropControl {
  /** Historical semantic handle name, never resolved by the runtime. */
  name: string;

  /** Stored channel address, never mapped through a profile binding. */
  channel: IAutoMovieChannel;

  /** Stored initial vector, never applied or checked against channel width. */
  default: number[];

  /** Historical editor category, or null when no category was supplied. */
  group: string | null;
}
