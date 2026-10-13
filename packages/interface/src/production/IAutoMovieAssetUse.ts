import { IAutoMovieAssetConsumer } from "./IAutoMovieAssetConsumer";

/** One downstream purpose that makes an asset part of one production. */
export interface IAutoMovieAssetUse {
  /** Exact production id; project-global assets repeat uses when shared. */
  production: string;

  /** Typed, addressable consumer inside that production. */
  consumer: IAutoMovieAssetConsumer;

  /** Why this production needs the asset. */
  reason: string;
}
