import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/** Result of rolling back one untouched applied import. */
export interface IAutoMovieLegacyImportRollbackOutput {
  /** Rollback completion marker. */
  status: "rolled-back";

  /** Fingerprint of the removed import plan. */
  fingerprint: AutoMovieContentDigest;
}
