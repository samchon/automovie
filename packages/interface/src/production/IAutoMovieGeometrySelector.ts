import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A world point, compiled actor root or bone, or named world landmark used by geometry queries.
 *
 * @evidence contracts/common.md#principled-implementation Kind discrimination selects an explicit world point, current world landmark or actor pose resolved through FK and node placement; actor shot and sampling time come from the enclosing query.
 * @evidence contracts/common.md#clear-and-simple-design Each arm carries only the identifier or coordinates needed for its resolution path; optional bone refines actor selection without duplicating actor fields in another arm.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing landmarks, ambiguous actors and unavailable bones refuse by name; omission of bone selects the actor root rather than inventing a default skeletal landmark.
 * @evidence contracts/common.md#meaningful-documentation Defines world-meter point coordinates, actor and bone lookup, bone omission and named world landmarks.
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
