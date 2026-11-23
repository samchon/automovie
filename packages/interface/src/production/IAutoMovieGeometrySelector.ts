import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A world point, compiled actor root or bone, or named world landmark used by
 * geometry queries.
 */
export type IAutoMovieGeometrySelector =
  | {
      /** Explicit world-space point. */
      kind: "point";

      /** Position in meters. */
      position: IAutoMovieVector3;
    }
  | {
      /** Named actor root or bone. */
      kind: "actor";

      /** Actor id. */
      actor: string;

      /** Existing bone id; omission selects the sampled actor root. */
      bone?: string;
    }
  | {
      /** Named world landmark. */
      kind: "landmark";

      /** Landmark id. */
      landmark: string;
    };
