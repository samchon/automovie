import type { IAutoMovieSoundPropagationProfile } from "./IAutoMovieSoundPropagationProfile";

/** Data and callback contracts shared by the DeriveSoundPropagation operations. */
export namespace IAutoMovieDeriveSoundPropagation {
  /**
   * Derive distance gain, one film-clock arrival and the selected
   * segment/spectral outcome.
   *
   * Distance is finite and nonnegative; fps and sound speed are finite and
   * positive. Emission, segment end and film end are safe integer frame
   * addresses, with emission before segment end and segment end no later than
   * film end. Delay is distance divided by speed, rounded once to the nearest
   * film frame. An arrival at or beyond the film end throws. Crossing a cut
   * follows the profile's carry or trim policy; the emission clock itself is
   * unchanged.
   *
   * The profile must have a nonblank id and assumptions and supported gain,
   * boundary and spectral policies. Refusals throw before a receipt is
   * returned. The caller owns the new scalar receipt; no input record is
   * retained.
   */
  export type IProps = {
    /** Effective source/listener distance in metres. */
    distanceMeters: number;
    /**
     * Nonnegative safe integer emission frame on the finished-film clock,
     * before segmentEndFrame.
     */
    emissionFrame: number;
    /**
     * Safe integer exclusive end of the owning film segment, at most
     * totalFrames.
     */
    segmentEndFrame: number;
    /**
     * Finite positive finished-film frames per second used for nearest-frame
     * delay rounding.
     */
    fps: number;
    /**
     * Positive safe integer exclusive film-frame bound; an arrival at or beyond
     * it throws.
     */
    totalFrames: number;
    /** Explicitly selected production propagation profile. */
    profile: IAutoMovieSoundPropagationProfile;
  };
}
