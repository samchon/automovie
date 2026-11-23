import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/** Contracts used by HumanPreshape.open. */
export namespace IAutoMovieMotionHumanPreshape {
  /**
   * The open pre-shape whose thumb-index aperture is the peak aperture for a
   * width. Result returned by HumanPreshape.open. The pre-shape's angles and
   * the aperture it reaches, metres.
   */
  export type IOpenResult = {
    /** Opened finger-joint rotations in clinical degrees. */
    joints: IAutoMovieMotionHumanPosture["joints"];
    /**
     * Actual thumb-to-index opening in metres after fitting within joint
     * limits.
     */
    aperture: number;
  };
}
