import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/**
 * Data and callback contracts shared by the ViewParallelAxis operations.
 *
 * @evidence contracts/development/design.md#principled-representation IOrigin supplies three scalar world-mm coordinates as functions of the same physical-mm station.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ViewParallelAxis consumes the existing ViewPart outline contract for each axis component.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Three coordinates define an origin, not an independently fitted orientation; finite source coverage remains axis preparation admission.
 * @evidence contracts/development/common.md#meaningful-documentation States world components and their shared station clock.
 */
export namespace IAutoMovieViewParallelAxis {
  /**
   * Three source coordinates of an origin in world millimetres.
   *
   * @evidence contracts/development/design.md#principled-representation Independent scalar source curves locate a fixed-basis plane at the same authored station.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three existing outline records carry the origin without sampled frame data.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The origin remains authored source data and is not recentered by an emitted section.
   * @evidence contracts/development/common.md#meaningful-documentation States world space, millimetres and shared station meaning.
   */
  export interface IOrigin {
    /** World X by authored station, both millimetres. */
    x: IAutoMovieViewPart.IOutline;

    /** World Y by the same authored station, millimetres. */
    y: IAutoMovieViewPart.IOutline;

    /** World Z by the same authored station, millimetres. */
    z: IAutoMovieViewPart.IOutline;
  }
}
