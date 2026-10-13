/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */
import type { IAutoMovieAimDriver, IAutoMovieCopyDriver, IAutoMovieIKDriver, IAutoMovieParentDriver, IAutoMovieSpringDriver } from "@automovie/interface";
import type { IAutoMovieLegacyDrivenDriver } from "./IAutoMovieLegacyDrivenDriver";

/**
 * Records and conversion the v1 legacy project store reads and writes.
 *
 * These were part of a protocol payload module and a protocol converter that
 * no longer exist. Only the legacy import path reads them, so they live beside
 * it rather than in a package-wide surface nothing else consumes.
 */

/**
 * A prop profile driver as the v1 record wrote it, tuple-free.
 */
export type IAutoMovieLegacyPropDriver =
  | IAutoMovieCopyDriver
  | IAutoMovieAimDriver
  | IAutoMovieIKDriver
  | IAutoMovieParentDriver
  | IAutoMovieLegacyDrivenDriver
  | IAutoMovieSpringDriver;
