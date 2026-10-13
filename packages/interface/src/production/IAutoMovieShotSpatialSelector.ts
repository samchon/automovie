import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A world-space spatial operand resolved from one current compiled shot or its production world.
 *
 * @evidence contracts/common.md#principled-implementation Selector discrimination resolves sampled node placement, compact formation centroid, named world landmark or literal meter point through the shared shot-contract subject reader.
 * @evidence contracts/common.md#clear-and-simple-design Each arm names only the required identity or explicit vector, keeping pose sampling and formation motion composition with the compiled subject reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing compiled identities fail measurement rather than choosing another node or a design-only anchor; explicit points are authored operands, not inferred subject geometry.
 * @evidence contracts/common.md#meaningful-documentation Defines each node, formation, landmark and world-meter point address consumed by position and distance predicates.
 * @author Samchon
 */
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
