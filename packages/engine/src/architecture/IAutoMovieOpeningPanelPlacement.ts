import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Where one movable panel stands, in world space, at one operating state.
 *
 * Produced by `builtOpeningPanelPlacements`, one per panel in authored order;
 * without a named state the record's own current state is used, and a state
 * the opening does not declare throws. A state is a configuration, not a
 * moment: a door swinging on screen is a shot motion clip over `node`.
 *
 * @evidence contracts/common.md#principled-implementation Applies each moving member's single-degree-of-freedom displacement after its element's rest transform, composes down the parent chain so a folding leaf rides its parent, and decomposes the panel element's world matrix.
 * @evidence contracts/common.md#clear-and-simple-design Mirrors the carriage placement minus `serves`, since a panel has a configuration but serves no space; its producer repeats `worldMatricesOf`, `operationDeltas` and `travelDelta` verbatim from `builtConnectorCarriagePlacements.ts` and `builtOpeningSweepEnvelope.ts` rather than sharing them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Members of other openings or runs that lack the named state get no displacement and stand at rest, not at their own current state, which differs from the sweep envelope's current-state ancestors when a panel is parented under another member.
 * @evidence contracts/common.md#meaningful-documentation States the producer and ordering, the state default and refusal, the world frame of each pose field, and that a state is a configuration rather than a clip.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record owning decomposed vectors and a quaternion; its producer recomposes every element's world matrix per opening query and per state, a full pass where the panels' ancestor chains would suffice, and discards its matrix and displacement maps on return.
 * @author Samchon
 */
export interface IAutoMovieOpeningPanelPlacement {
  /** Panel id inside its opening. */
  panel: string;

  /** The visible element the panel drives. */
  element: string;

  /**
   * The staged node id {@link lowerBuiltEnvironment} emits for that element.
   */
  node: string;

  /** World translation of the panel's element. */
  position: IAutoMovieVector3;

  /** World rotation of the panel's element, as a unit quaternion. */
  rotation: IAutoMovieQuaternion;

  /** World per-axis scale of the panel's element. */
  scale: IAutoMovieVector3;
}
