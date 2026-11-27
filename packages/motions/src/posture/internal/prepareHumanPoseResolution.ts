import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { IAutoMoviePoseResolution } from "@automovie/interface";

/**
 * The exact-FK reader of one synchronous person evaluation: the reader its
 * parent lends (`IAutoMoviePoseResolution.ISource`), or a fresh native reader
 * where none is lent. Release the returned getter with that evaluation; it must
 * not enter a retained plan, body fit entry or public result closure.
 *
 * @param source The parent evaluation's reader or its getter; absent, a fresh
 *   native reader.
 * @returns The getter of the evaluation's reader.
 */
export function prepareHumanPoseResolution(
  source?: IAutoMoviePoseResolution.ISource,
): () => ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution> {
  const reader: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution> =
    prepareHumanPoseResolution.read(source);
  return (): ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution> => reader;
}

/** The reader an evaluation reads and whether it is the engine's own. */
export namespace prepareHumanPoseResolution {
  /**
   * The reader of an evaluation: the lent one, the one its getter returns, or a
   * fresh native reader where none is lent.
   *
   * @param source The lent reader or its getter.
   * @returns The reader.
   */
  export function read(
    source?: IAutoMoviePoseResolution.ISource,
  ): ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution> {
    if (source === undefined) return AutoMovieEngineKinematics.preparePoseResolution();
    return typeof source === "function" ? source() : source;
  }
}
