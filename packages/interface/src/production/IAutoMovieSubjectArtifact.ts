import { IAutoMovieCompiledShotSource } from "./IAutoMovieCompiledShotSource";

/** One compiled shot paired with the revision that makes its answers fresh. */
export interface IAutoMovieSubjectArtifact {
  /** Stable content or compile revision of {@link compiled}. */
  revision: string;

  /** Fully compiled shot data inspected by the engine. */
  compiled: IAutoMovieCompiledShotSource;
}
