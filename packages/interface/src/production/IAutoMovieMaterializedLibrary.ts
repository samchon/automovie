import { IAutoMovieMaterializedLibraryOwner } from "./IAutoMovieMaterializedLibraryOwner";

/**
 * The builder-owned index of everything a library compile materialized.
 *
 * Observation commands, viewers and later compiles read this index to recover artifact-to-owner attribution without re-executing source.
 *
 * @evidence contracts/common.md#principled-implementation Library compilation emits a versioned index bound to its protocol, namespace and aggregate input fingerprint, with accepted owners in canonical branch-and-address order.
 * @evidence contracts/common.md#clear-and-simple-design One generated index supplies provenance for library results that have no film shot manifest, while each owner entry names its semantic artifacts separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Index publication requires admitted owner registration and branch-specific contribution, from a build callback or verified precomputed artifact. Settings require zero semantic payload; naming an address alone establishes neither registration nor completion.
 * @evidence contracts/common.md#meaningful-documentation Defines generated ownership, compiler and production identities, current input binding and canonical owner ordering for readers.
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
  inputFingerprint: string;

  /** Admitted build or precomputed owners in stable branch-and-address order, including zero-payload settings lineage. */
  owners: IAutoMovieMaterializedLibraryOwner[];
}
