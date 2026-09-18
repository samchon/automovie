import { IAutoMovieDerivedArtifactSource } from "./IAutoMovieDerivedArtifactSource";

/**
 * What one library source module is told about the owner it is building.
 *
 * A library has no shot, so a library owner receives no scene, no clock, and no
 * staged world. What it receives is its own address, because the module has to
 * be able to state which reviewed decision it is realizing without reading a
 * file. Verified precomputed inputs arrive through the build context; the
 * builder still performs no filesystem access or implicit generation.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Carries the exact owner address a materialized library artifact is traced back through.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types the declared input a library derivation attempt receives.
 * @author Samchon
 */
export interface IAutoMovieLibraryBuildContext {
  /** Production namespace this library is compiled under. */
  production: string;
  /** Active design branch the owner belongs to, such as `spaces`. */
  branch: string;
  /** Project-relative POSIX path of the reviewed design document. */
  design: string;
  /** Exact H2 anchor of the reviewed decision this owner realizes. */
  anchor: string;
  /**
   * Declared precomputed artifacts whose basis and output bytes the builder
   * verified before execution, keyed by project-relative output path.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-compile-refusal Supplies only current declared precomputed inputs to library owners.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-freshness Carries the verified bytes included in the library compilation fingerprint.
   */
  derivedArtifacts: Readonly<Record<string, IAutoMovieDerivedArtifactSource>>;
}
