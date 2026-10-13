import type {
  AutoMovieContentDigest,
  IAutoMovieBuildProjectOutput,
  IAutoMovieDiagnostic,
} from "@automovie/interface";

import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import { createAutoMovieBuildInputRaceFailure } from "./createAutoMovieBuildInputRaceFailure";

/**
 * Confirm one non-publishing compilation result through the shared authority.
 *
 * The authority owns lock acquisition, both fresh input checks and revision
 * comparison. This compiler boundary returns null when the confirmation holds,
 * converts only its generation-race error to the shared structured refusal,
 * and propagates unrelated failures unchanged. Timed and library compilation
 * therefore use one error policy without acquiring independent locks.
 */
export const confirmAutoMovieBuildInputSnapshot = (props: {
  diagnostics: IAutoMovieDiagnostic[];
  inputCurrent: () => boolean;
  inputFingerprint: AutoMovieContentDigest;
  inputRevision: number;

  /** Shared project authority; this boundary neither reads nor writes files. */
  authority: {
    confirmCurrentSnapshot: (
      current: () => boolean,
      revision: number,
    ) => number;
    revision: () => number;
  };
}): IAutoMovieBuildProjectOutput | null => {
  try {
    props.authority.confirmCurrentSnapshot(
      props.inputCurrent,
      props.inputRevision,
    );
    return null;
  } catch (error) {
    if (error instanceof AutoMovieProductionInputRaceError === false)
      throw error;
    return createAutoMovieBuildInputRaceFailure({
      ...props,
      failure: error,
      currentRevision: () => props.authority.revision(),
    });
  }
};
