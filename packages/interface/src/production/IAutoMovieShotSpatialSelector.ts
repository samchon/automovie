import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A world-space spatial operand resolved from one current compiled shot or its
 * production world.
 */
export type IAutoMovieShotSpatialSelector =
  | {
      /** One compiled scene node. */
      kind: "node";

      /** Exact scene-node id. */
      id: string;
    }
  | {
      /**
       * Stored formation position centroid under whole-unit motion, without
       * recomputing reform layouts or member exceptions.
       */
      kind: "formation";

      /** Exact formation design id. */
      id: string;
    }
  | {
      /** One named production-world landmark. */
      kind: "landmark";

      /** Exact landmark id. */
      id: string;
    }
  | {
      /** One literal world-space point. */
      kind: "point";

      /** Exact point in meters. */
      position: IAutoMovieVector3;
    };
