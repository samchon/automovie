import { IAutoMovieDerivedArtifactSource } from "./IAutoMovieDerivedArtifactSource";

/**
 * What one library source module is told about the owner it is building.
 *
 * A library has no shot, so a library owner receives no scene, no clock, and no
 * staged world. What it receives is its own address, because the module has to
 * be able to state which completed decision it is realizing without reading a
 * file. Verified precomputed inputs arrive through the build context; the
 * builder still performs no filesystem access or implicit generation.
 *
 * @author Samchon
 */
export interface IAutoMovieLibraryBuildContext {
  /** Production namespace this library is compiled under. */
  production: string;

  /** Active design branch the owner belongs to, such as `spaces`. */
  branch: string;

  /** Project-relative POSIX path of the completed design document. */
  design: string;

  /** Exact H2 anchor of the completed decision this owner realizes. */
  anchor: string;

  /**
   * Declared precomputed artifacts whose basis and output bytes the builder
   * verified before execution, keyed by project-relative output path.
   */
  derivedArtifacts: Readonly<Record<string, IAutoMovieDerivedArtifactSource>>;
}
