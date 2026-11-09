import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Named world-meter point with authored selection/clearance radius and semantic meaning.
 *
 * @evidence contracts/development/design.md#principled-representation Geometry queries read the authored point; finite coordinates, positive finite radius and nonblank meaning remain caller premises. Explicit assertWorldPlacements considers a landmark reachable on any walkable XZ footprint or within radius plus half route width in plan, without testing vertical access or a connected navigable path; that helper is not an automatic world admission gate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Stable address, point, radius and meaning keep reusable world anchoring independent of scene-node or rig identity.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This type does not enforce ids or positive radii. Semantic meaning is not parsed to infer geometry or motion and radius is not an automatically measured mesh extent; actual query owners define their missing-id outcome.
 * @evidence contracts/development/common.md#meaningful-documentation Defines stable identity, world-meter center, positive selection/clearance radius and nonblank semantic purpose.
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
