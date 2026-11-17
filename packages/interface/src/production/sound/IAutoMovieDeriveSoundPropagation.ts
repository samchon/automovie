import type { IAutoMovieSoundPropagationProfile } from "../IAutoMovieSoundPropagationProfile";

/**
 * Data and callback contracts shared by the DeriveSoundPropagation operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Derive distance gain, one film-clock arrival and the selected segment/spectral outcome. Member documentation states the supplied records, units and absence meanings used by deriveAutoMovieSoundPropagation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Propagation policy is supplied as the canonical profile; segment and film limits remain explicit rather than a per-scene delay exception.
 * @evidence contracts/development/design.md#principled-representation distanceMeters is source-to-listener distance, fps converts the delay to film frames, and emissionFrame, segmentEndFrame and totalFrames use the finished-film clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieDeriveSoundPropagation, used by deriveAutoMovieSoundPropagation. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieDeriveSoundPropagation {
  /**
   * Derive distance gain, one film-clock arrival and the selected segment/spectral outcome.
   *
   * Distance is finite and nonnegative; fps and sound speed are finite and positive.
   * Emission, segment end and film end are safe integer frame addresses, with
   * emission before segment end and segment end no later than film end. Delay is
   * distance divided by speed, rounded once to the nearest film frame. An arrival
   * at or beyond the film end throws. Crossing a cut follows the profile's carry
   * or trim policy; the emission clock itself is unchanged.
   *
   * The profile must have a nonblank id and assumptions and supported gain,
   * boundary and spectral policies. Refusals throw before a receipt is returned.
   * The caller owns the new scalar receipt; no input record is retained.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Derive distance gain, one film-clock arrival and the selected segment/spectral outcome. Member documentation states the supplied records, units and absence meanings used by deriveAutoMovieSoundPropagation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Propagation policy is supplied as the canonical profile; segment and film limits remain explicit rather than a per-scene delay exception.
   * @evidence contracts/development/design.md#principled-representation distanceMeters is source-to-listener distance, fps converts the delay to film frames, and emissionFrame, segmentEndFrame and totalFrames use the finished-film clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieDeriveSoundPropagation.IProps, used by deriveAutoMovieSoundPropagation. Its distanceMeters, emissionFrame, segmentEndFrame, fps, totalFrames, profile members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Effective source/listener distance in metres. */
    distanceMeters: number;
    /** Nonnegative safe integer emission frame on the finished-film clock, before segmentEndFrame. */
    emissionFrame: number;
    /** Safe integer exclusive end of the owning film segment, at most totalFrames. */
    segmentEndFrame: number;
    /** Finite positive finished-film frames per second used for nearest-frame delay rounding. */
    fps: number;
    /** Positive safe integer exclusive film-frame bound; an arrival at or beyond it throws. */
    totalFrames: number;
    /** Explicitly selected production propagation profile. */
    profile: IAutoMovieSoundPropagationProfile;
  };
}
