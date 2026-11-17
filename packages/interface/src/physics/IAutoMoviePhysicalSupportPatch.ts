import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Current resolved support points in world metres.
 *
 * @evidence contracts/development/design.md#principled-representation Contact-patch vertices determine support area while the endpoint position determines proposed recovery travel.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bone id links one actual patch and endpoint to the existing footfall pattern.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Patch vertices are observed contacts, not an invented standing footprint; input geometry is borrowed and must be admitted by its producer.
 * @evidence contracts/development/common.md#meaningful-documentation All positions are world metres; points and position serve distinct hull and endpoint roles.
 */
export interface IAutoMoviePhysicalSupportPatch {
  /** Endpoint bone from the footfall pattern. */
  bone: string;

  /** Contact patch vertices, not an invented standing footprint. */
  points: IAutoMovieVector3[];

  /** Current endpoint world position. */
  position: IAutoMovieVector3;
}
