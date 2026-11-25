import type { IAutoMovieCaptureStorage } from "./IAutoMovieCaptureStorage.js";

/**
 * Storage and round identities used to prepare one capture folder.
 * AutoMovieCaptureFolder.open removes trailing slashes from root and rejects an
 * empty result. It checks the compared complete record and foreign entries
 * before deleting prior owned files. Round-name admission belongs to capture
 * request parsing; the factory does not independently validate round path
 * syntax.
 */
export interface IAutoMovieCaptureFolderOpenProps {
  /** Where files are read and written. */
  storage: IAutoMovieCaptureStorage;

  /** The capture's root folder. */
  root: string;

  /** Round the capture is kept as, or null for the root. */
  round: string | null;

  /** Earlier round compared against, or null. */
  compare: string | null;
}
