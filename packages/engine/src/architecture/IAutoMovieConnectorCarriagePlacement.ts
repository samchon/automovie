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
 * @evidence contracts/common.md#principled-implementation Composes the carriage element's world affine matrix with state displacements, then decomposes translation, normalized rotation and scale. Finite representable world TRS is the premise, checked numerically by staged validation; this shape cannot preserve arbitrary affine shear.
 * @evidence contracts/common.md#clear-and-simple-design Pairs the pose with the carriage id, element, staged node id and served space, so a shot places the car and names its floor from one record; it parallels the opening panel placement and adds only `serves`, which a panel has no counterpart for.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A member without the named state, or without an entry in it, stands at rest rather than being interpolated or guessed, and `serves` is null for a counterweight or a missing entry rather than a defaulted space.
 * @evidence contracts/common.md#meaningful-documentation States the producer and order, the default state, how the pose composes displacements down the hierarchy, the rest fallback, the node id format, the world units of the pose, and both meanings of a null `serves`.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; composing every element's world matrix once per call and decomposing one per carriage is answered on `builtConnectorCarriagePlacements`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The producer builds one matrix table per call and shares it across that run's carriages; no placement is cached between states or calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds fresh vectors and strings only, owned by the caller's placement list; the producer's matrix table is dropped when it returns.
 */
export interface IAutoMovieConnectorCarriagePlacement {
  /** Carriage id inside its connector. */
  carriage: string;

  /** The visible element the carriage drives. */
  element: string;

  /**
   * The staged node id {@link lowerBuiltEnvironment} emits for that element,
   * `"<environment id>/<element id>"`.
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
