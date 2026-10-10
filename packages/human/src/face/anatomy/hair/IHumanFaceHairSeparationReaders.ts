import type { IAutoMovieMeshSeparationQuery } from "@automovie/engine";

/**
 * The two compiled separation readers of one hair host skin.
 *
 * `source` reads the binary64 resident snapshot and `represented` its exact
 * Float32 buffer preimage. Both are compiled once by the hair builder from the
 * same current skin, so a complete row or cell is certified only when both
 * frames prove the requested gap. The readers are pure over their immutable
 * snapshots apart from spending the caller's shared budget.
 *
 * @author Samchon
 */
export interface IHumanFaceHairSeparationReaders {
  /** Separation reader over the binary64 source skin snapshot. */
  source: IAutoMovieMeshSeparationQuery;

  /** Separation reader over the exact Float32 representation of that skin. */
  represented: IAutoMovieMeshSeparationQuery;
}
