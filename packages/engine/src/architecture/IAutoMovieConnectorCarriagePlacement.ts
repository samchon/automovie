import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Where one carriage of a run stands, in world space, at one state.
 *
 * Produced by `builtConnectorCarriagePlacements`, one per carriage in authored
 * order. Without a named state the record's own current state is used. The
 * pose is the carriage element's world matrix with every moving member's
 * displacement for that state applied down the hierarchy; a member whose
 * operation lacks the named state contributes none and stands at its rest
 * transform.
 *
 * @evidence contracts/common.md#principled-implementation Composes each element's rest TRS with its travel displacement for the state (a translation along the axis or a turn about the pivot), multiplies down the parent chain, and decomposes the carriage element's world matrix into translation, normalized quaternion and per-axis scale.
 * @evidence contracts/common.md#clear-and-simple-design Returns the served space beside the pose, so where the car is and which floor that is come from one state lookup, and carries the staged node id so a shot addresses the same element.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `node` is spelled `<environment id>/<element id>` exactly as `lowerBuiltEnvironment` stages it; a member whose operation lacks the named state is placed at rest, not at its own current state, which only matters when it is an ancestor of the carriage.
 * @evidence contracts/common.md#meaningful-documentation States the producer and ordering, the state default, the frames of the pose fields, the node spelling, the rest placement of members without the state, and when `serves` is null.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record owning fresh pose vectors; its producer composes world matrices for every element of the environment per call and per state to answer one connector, an O(elements) pass where only the carriages' ancestor chains are read, and drops the matrix map on return.
 * @author Samchon
 */
export interface IAutoMovieConnectorCarriagePlacement {
  /** Carriage id inside its connector. */
  carriage: string;

  /** The visible element the carriage drives. */
  element: string;

  /**
   * The staged node id {@link lowerBuiltEnvironment} emits for that element.
   */
  node: string;

  /** World translation of the carriage's element. */
  position: IAutoMovieVector3;

  /** World rotation of the carriage's element, as a unit quaternion. */
  rotation: IAutoMovieQuaternion;

  /** World per-axis scale of the carriage's element. */
  scale: IAutoMovieVector3;

  /**
   * Logical space the state says this carriage serves, or null when it serves
   * none (a counterweight) or the state gives the carriage no entry.
   */
  serves: string | null;
}
