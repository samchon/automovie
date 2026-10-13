import { IAutoMovieDerivedArtifactSource } from "./IAutoMovieDerivedArtifactSource";

/**
 * What one library source module is told about the owner it is building.
 *
 * A library owner receives its design address and verified precomputed inputs instead of a shot scene or clock. Source can therefore realize the selected decision without choosing a different owner or implicitly generating dependencies.
 *
 * @evidence contracts/common.md#principled-implementation createAutoMovieLibraryOwnerContexts projects graph-admitted production, branch, document and H2 identity and the attempt's verified derivation closure into each owner evaluation.
 * @evidence contracts/common.md#clear-and-simple-design Separates owner identity from contribution output and exposes only current declared artifacts; the context has no shot-only staging API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Context construction uses admitted owner addresses and current artifact bytes; it does not discover undeclared inputs, run a generator or fabricate a library clock.
 * @evidence contracts/common.md#meaningful-documentation Defines namespace, branch, project-relative document, exact anchor and verified artifact map supplied to one owner.
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
   * Declared precomputed artifacts whose basis and output bytes the builder verified before execution, keyed by project-relative output path.
   */
  derivedArtifacts: Readonly<Record<string, IAutoMovieDerivedArtifactSource>>;
}
