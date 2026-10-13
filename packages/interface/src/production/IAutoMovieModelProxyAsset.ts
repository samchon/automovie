import { IAutoMovieGeneratedCollisionProxy } from "./IAutoMovieGeneratedCollisionProxy";
import { IAutoMovieGeneratedMeasurementProxy } from "./IAutoMovieGeneratedMeasurementProxy";

/**
 * Versioned manifest-owned JSON carrying explicit collision or projection-envelope data.
 *
 * @evidence contracts/common.md#principled-implementation productionAssetInventory admits exact digest-matched JSON bytes and selects the collision or measurement field requested by the owning model's proxy reference, then validates positive recipe dimensions.
 * @evidence contracts/common.md#clear-and-simple-design One asset can carry either or both existing proxy contracts; selection context determines which optional field is required instead of creating separate nearly identical JSON envelopes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An omitted field cannot satisfy a reference to that proxy kind, and appearance-mesh inference is not a fallback for absent registered proxy data.
 * @evidence contracts/common.md#meaningful-documentation Defines schema version, optional collision and measurement carriers and the requirement imposed by the selecting model reference.
 * @author Samchon
 */
export interface IAutoMovieModelProxyAsset {
  /** Proxy asset schema. */
  version: 1;

  /** Optional collision shape when cited as a collision proxy. */
  collision?: IAutoMovieGeneratedCollisionProxy;

  /** Projection-radius envelope required when cited as a measurement proxy. */
  measurement?: IAutoMovieGeneratedMeasurementProxy;
}
