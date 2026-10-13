import { AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL } from "./AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL";
import type { IAutoMovieDesignDerivationRecord } from "./IAutoMovieDesignDerivationRecord";

/**
 * Version-one inventory of records declared by one design candidate.
 *
 * @evidence contracts/common.md#principled-implementation Candidate assembly returns version one, the fixed derivation protocol and canonical target-ordered records after set/path matching.
 * @evidence contracts/common.md#clear-and-simple-design One inventory joins declared targets with their per-record lineage; run outcomes separately retain the original publication order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Complete refers to the supplied candidate set; unknown project records require separately supplied resident paths, and this inventory does not implement atomic publication.
 * @evidence contracts/common.md#meaningful-documentation Defines version/protocol and readonly record-array intent without deep runtime freezing or transactional storage guarantees.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface erases; candidate set validation/sorting and inspection membership scans remain the processing owners.
 * @evidence contracts/performance.md#reuse-equivalent-work The stored inventory is current only under matching declared basis/output authority, not merely equal protocol or record count.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller/store retains the record array and its input-sized bases until replacement; readonly typing adds no file, process or lifetime manager.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignDerivationManifest {
  /** Manifest schema version. */
  version: 1;

  /** Derivation protocol that gives the records their meaning. */
  protocol: typeof AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL;

  /** Canonically ordered inventory of the supplied candidate targets. */
  records: readonly IAutoMovieDesignDerivationRecord[];
}
