import type { IAutoMovieCompiledShotSource } from "./IAutoMovieCompiledShotSource";

/**
 * One compiled shot paired with the caller-supplied revision used to qualify
 * inspection answers.
 */
export interface IAutoMovieSubjectArtifact {
  /** Stable content or compile revision of {@link compiled}. */
  revision: string;

  /** Fully compiled shot data inspected by the engine. */
  compiled: IAutoMovieCompiledShotSource;
}
