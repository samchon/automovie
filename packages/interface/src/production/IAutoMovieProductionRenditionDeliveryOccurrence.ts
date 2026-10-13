import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/** The lane-independent identity of one exact delivered occurrence. */
export interface IAutoMovieProductionRenditionDeliveryOccurrence {
  /** Stable timeline occurrence identity. */
  occurrence: string;

  /** Exact compiled shot id. */
  shot: string;

  /** Render-root-relative immutable visual source. */
  path: string;

  /** Exact current visual source digest. */
  digest: AutoMovieContentDigest;
}
