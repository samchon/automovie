import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * Target basis against which one external motion conversion was decided.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionConversionTarget {
  /** Target production model identity. */
  model: string;

  /** Target skeleton identity within the model. */
  skeleton: string;

  /** Canonical digest of the target skeleton basis. */
  basisDigest: AutoMovieContentDigest;
}
