import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * Canonical converted motion result sealed by builder-owned digests.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionConversionResult {
  /** Stable project-native motion identity assigned to the result. */
  motionId: string;

  /** Canonical digest of the project-native motion value. */
  motionDigest: AutoMovieContentDigest;

  /** Production-relative builder-owned result file path. */
  outputPath: string;

  /** Content digest of the exact generated output file bytes. */
  outputDigest: AutoMovieContentDigest;
}
