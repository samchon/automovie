import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** A spatial operand measured from one compiled shot. */
export type IAutoMovieShotSpatialSelector =
  | {
      /** One compiled scene node. */
      kind: "node";

      /** Exact scene-node id. */
      id: string;
    }
  | {
      /** Centroid of every builder-materialized formation slot. */
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
