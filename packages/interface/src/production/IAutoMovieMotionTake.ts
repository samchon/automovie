import type { IAutoMovieMotionTakeAnchor } from "./IAutoMovieMotionTakeAnchor";
import type { IAutoMovieMotionTakeProvenance } from "./IAutoMovieMotionTakeProvenance";
import type { IAutoMovieShotContract } from "./IAutoMovieShotContract";

/** Version 1 of a saved motion take for deterministic authored replay. */
export interface IAutoMovieMotionTake {
  /** Artifact schema version. */
  version: 1;

  /** Stable installed production identity. */
  production: string;

  /** Stable take identity within the production. */
  take: string;

  /**
   * Independently selected production module and named export that rebuild this
   * take.
   */
  source: IAutoMovieShotContract["source"];

  /** Reconstruction method for this schema. */
  replay: "authored";

  /** Exact occurrence and paired times where the take was saved. */
  anchor: IAutoMovieMotionTakeAnchor;

  /** Facts independently rederived by the host before reopening. */
  provenance: IAutoMovieMotionTakeProvenance;

  /** Parent take when this artifact publishes a branch. */
  parent?: IAutoMovieMotionTakeProvenance["files"][number];
}
