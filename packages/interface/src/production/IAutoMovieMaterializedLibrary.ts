import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieMaterializedLibraryOwner } from "./IAutoMovieMaterializedLibraryOwner";

/**
 * The builder-owned index of everything a library compile materialized.
 *
 * A film reads its own generated output through the shot and model manifests it
 * already publishes. A library has neither, so this index is how a later
 * process -- an offline observation command, a viewer, a second compile --
 * answers which design owner a published building or model belongs to without
 * re-executing source.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Lets every published library artifact be traced to its owner, source, and compile identity.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types the derived index that carries target identity, source snapshot, and output paths.
 * @author Samchon
 */
export interface IAutoMovieMaterializedLibrary {
  /** Closed schema version. */
  version: 1;
  /** Compiler protocol that produced this index. */
  builder: string;
  /** Production namespace this library was compiled under. */
  production: string;
  /** Compiler input identity this index was derived at. */
  inputFingerprint: AutoMovieContentDigest;
  /** Executed owners in stable branch-and-address order. */
  owners: IAutoMovieMaterializedLibraryOwner[];
}
