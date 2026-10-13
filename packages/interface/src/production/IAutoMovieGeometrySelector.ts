import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** A point, actor or named world anchor used by geometry queries. */
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

      /** Optional bone id. */
      bone?: string;
    }
  | {
      /** Named world landmark. */
      kind: "landmark";

      /** Landmark id. */
      landmark: string;
    };
