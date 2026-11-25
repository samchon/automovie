import type { IAutoMovieAssetConsumer } from "./IAutoMovieAssetConsumer";

/**
 * One reasoned asset use by a live consumer in a production namespace. Shared
 * assets repeat uses for each production that consumes them.
 */
export interface IAutoMovieAssetUse {
  /** Exact production id; project-global assets repeat uses when shared. */
  production: string;

  /** Typed, addressable consumer inside that production. */
  consumer: IAutoMovieAssetConsumer;

  /** Why this production needs the asset. */
  reason: string;
}
