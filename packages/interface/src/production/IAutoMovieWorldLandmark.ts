import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Named world-meter point with authored selection/clearance radius and semantic meaning.
 *
 * @evidence contracts/common.md#principled-implementation Geometry queries resolve exact landmark position and world placement checks combine its positive radius with route clearance; authored meaning supplies human narrative or tactical context rather than an executable behavior.
 * @evidence contracts/common.md#clear-and-simple-design Stable address, point, radius and meaning keep reusable world anchoring independent of scene-node or rig identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing ids and non-positive radii refuse; semantic meaning is not parsed to infer geometry or motion and radius is not an automatically measured mesh extent.
 * @evidence contracts/common.md#meaningful-documentation Defines stable identity, world-meter center, positive selection/clearance radius and nonblank semantic purpose.
 * @author Samchon
 */
export interface IAutoMovieWorldLandmark {
  /** Stable landmark id. */
  id: string;

  /** Center in meters. */
  position: IAutoMovieVector3;

  /** Finite selection and clearance radius in meters, strictly above zero. */
  radius: number;

  /** Non-blank narrative or tactical meaning. */
  meaning: string;
}
