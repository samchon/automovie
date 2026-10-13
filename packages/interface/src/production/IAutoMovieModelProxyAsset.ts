import { IAutoMovieGeneratedCollisionProxy } from "./IAutoMovieGeneratedCollisionProxy";
import { IAutoMovieGeneratedMeasurementProxy } from "./IAutoMovieGeneratedMeasurementProxy";

/** Manifest-owned deterministic proxy data. */
export interface IAutoMovieModelProxyAsset {
  /** Proxy asset schema. */
  version: 1;

  /** Optional collision shape when cited as a collision proxy. */
  collision?: IAutoMovieGeneratedCollisionProxy;

  /** Optional measurement envelope when cited as a measurement proxy. */
  measurement?: IAutoMovieGeneratedMeasurementProxy;
}
