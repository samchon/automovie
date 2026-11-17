import type { IAutoMovieRecoveryImageObservation } from "../../index";

/**
 * Admit measured image supports and prepare their common physical row chart. Retain every original row inside the shared interval; interpolate other views linearly only within their measured domains. This changes neither image bytes nor the meaning of a recorded row. Cameras and rigidity remain supplied inputs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Minimum common admitted vertical support coordinate in millimetres. Maximum common admitted vertical support coordinate in millimetres.
 * @evidence contracts/development/design.md#principled-representation Minimum common admitted vertical support coordinate in millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface fitAutoMovieRecoveryImageLoft, fitAutoMovieRecoveryImageSupportLoft, prepareRecoveryImageSupports share IAutoMovieRecoveryImageSupportsPreparationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryImageSupportsPreparationOperation {
  /**
   * Admit measured image supports and prepare their common physical row chart. Retain every original row inside the shared interval; interpolate other views linearly only within their measured domains. This changes neither image bytes nor the meaning of a recorded row. Cameras and rigidity remain supplied inputs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Minimum common admitted vertical support coordinate in millimetres. Maximum common admitted vertical support coordinate in millimetres.
   * @evidence contracts/development/design.md#principled-representation Minimum common admitted vertical support coordinate in millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface fitAutoMovieRecoveryImageLoft, fitAutoMovieRecoveryImageSupportLoft, prepareRecoveryImageSupports share IAutoMovieRecoveryImageSupportsPreparationOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    observation: IAutoMovieRecoveryImageObservation,
    limits: {
      /** Maximum admitted image-view population for this support solve. */
      maxViews: number;
      /** Maximum admitted support-observation rows across the selected views. */
      maxRows: number;
    },
  ) => {
    /** Minimum common admitted vertical support coordinate in millimetres. */
    lower: number;

    /** Maximum common admitted vertical support coordinate in millimetres. */
    upper: number;

    /** Declared physical projection or tangent directions in the owning observation chart. */
    directions: {
      /** Cosine of the view's declared azimuth; dimensionless horizontal direction coefficient. */
      c: number;
      /** Sine of the view's declared azimuth; dimensionless horizontal direction coefficient. */
      s: number;
    }[];

    /** Sorted common vertical image-observation stations in millimetres. */
    stations: number[];

    /** Original source-incidence support assigned to the corresponding boundary observations. */
    supports: {
      /** Lower physical support or componentwise enclosure bound, in the declared registered millimetre frame. */
      lowerMm: number;
      /** Upper physical support or componentwise enclosure bound, in the declared registered millimetre frame. */
      upperMm: number;
    }[][];
  };
}
