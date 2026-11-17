import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * Contracts used by HumanPreshape.open.
 *
 * @evidence contracts/development/common.md#meaningful-documentation joints: Opened finger-joint rotations in clinical degrees. aperture: Actual thumb-to-index opening in metres after fitting within joint limits.
 * @evidence contracts/development/design.md#principled-representation joints: Opened finger-joint rotations in clinical degrees. aperture: Actual thumb-to-index opening in metres after fitting within joint limits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanPreshape.ts (HumanPreshape.open, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanPreshape {
  /**
   * The open pre-shape whose thumb-index aperture is the peak aperture for a width. Result returned by HumanPreshape.open. The pre-shape's angles and the aperture it reaches, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation joints: Opened finger-joint rotations in clinical degrees. aperture: Actual thumb-to-index opening in metres after fitting within joint limits.
   * @evidence contracts/development/design.md#principled-representation joints: Opened finger-joint rotations in clinical degrees. aperture: Actual thumb-to-index opening in metres after fitting within joint limits.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanPreshape.ts (HumanPreshape.open, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IOpenResult = {
    /** Opened finger-joint rotations in clinical degrees. */
    joints: IAutoMovieMotionHumanPosture["joints"];
    /** Actual thumb-to-index opening in metres after fitting within joint limits. */
    aperture: number;
  };
}
