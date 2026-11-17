/**
 * An explicit endpoint identity and its compacted recipe control index.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Declared endpoint authority independent of occurrence direction. Index into the owning compiled recipe controls.
 * @evidence contracts/development/design.md#principled-representation Index into the owning compiled recipe controls.
 * @evidence contracts/development/design.md#minimal-and-owned-surface compileAutoMovieRecoveryNativeNamedChart share IAutoMovieRecoveryEndpointControlOwner's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Declared endpoint authority independent of occurrence direction.
 */

export interface IAutoMovieRecoveryEndpointControlOwner {
  /** Declared endpoint authority independent of occurrence direction. */
  id: string;

  /** Index into the owning compiled recipe controls. */
  controlId: number;
}
