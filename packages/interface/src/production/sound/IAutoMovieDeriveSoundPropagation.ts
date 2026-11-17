import type { IAutoMovieSoundPropagationProfile } from "../IAutoMovieSoundPropagationProfile";

/** Data and callback contracts shared by the DeriveSoundPropagation operations. */
export namespace IAutoMovieDeriveSoundPropagation {
  /**
   * Derive distance gain, one film-clock arrival and the selected segment/spectral outcome.
   */
  export type IProps = {
    /** Effective source/listener distance in metres. */
    distanceMeters: number;
    /** Exact story emission frame. */
    emissionFrame: number;
    /** Exclusive end of the owning film segment. */
    segmentEndFrame: number;
    /** Production frame rate. */
    fps: number;
    /** Exclusive finished-film frame bound. */
    totalFrames: number;
    /** Explicitly selected production propagation profile. */
    profile: IAutoMovieSoundPropagationProfile;
  };
}
