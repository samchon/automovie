import { AutoMovieDerivedArtifactEncoding } from "./AutoMovieDerivedArtifactEncoding";
import { IAutoMovieDerivedArtifactDependency } from "./IAutoMovieDerivedArtifactDependency";

/**
 * Tracked identity of one explicitly generated deterministic artifact.
 *
 * @evidence contracts/common.md#principled-implementation Normalized generator and sorted raw-input digests form a domain-separated basis, with a separate digest for exact output bytes. Inspection rechecks those declared identities; generation invokes a supplied callback twice rather than loading the declared generator file, so this record does not prove callback/source correspondence, all-run determinism or dependency completeness.
 * @evidence contracts/common.md#clear-and-simple-design Output path and encoding sit beside generator, dependencies, basis identity and byte identity, separating what produced the artifact from how source code receives its payload.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching output bytes alone cannot hide a changed generator or input basis, and outputs stay within the dedicated derived namespace rather than overwriting source or undeclared assets.
 * @evidence contracts/common.md#meaningful-documentation Gives the derived path boundary, normalized generator identity, sorted raw input identities, domain-separated basis and exact output digest, with UTF-8 or base64 transport.
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifactRecord {
  /** Canonical output path below `automovie/derived/`. */
  path: string;

  /** Source-context representation of the exact output bytes. */
  encoding: AutoMovieDerivedArtifactEncoding;

  /** Generator source identity and normalized-source digest. */
  generator: IAutoMovieDerivedArtifactDependency;

  /** Declared input files sorted by canonical path. */
  inputs: IAutoMovieDerivedArtifactDependency[];

  /** Domain-separated digest of generator and declared input identities. */
  basisDigest: string;

  /** SHA-256 of the exact artifact bytes. */
  outputDigest: string;
}
