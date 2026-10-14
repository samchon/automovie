
/**
 * Revision-bracketed observations used to judge reuse of a read-only source gate answer.
 *
 * The builder input fingerprint names the design, source, content, derivation and owner edges a result is built from, but the gate also observes the screenplay index, requested prose and listed generated entries beside their resident manifest. A snapshot records those beside the revision and, for a library, the resident guard identity that includes the checkout root and declaration location. Generated population completeness remains the supplied walk's premise; the default walker reports regular files and symbolic links.
 *
 * Retention compares every field except revision, including revision for an answer that read it. Fresh equality concerns these finite observations rather than proving an atomic filesystem state or detecting edits outside the revision protocol.
 *
 * @evidence contracts/common.md#principled-implementation A before-and-after revision observation brackets the input fingerprint, resident library identity, screenplay, requested prose and generated namespace facts; matching these fields proves only the observed inputs, with the documented changed-and-restored race limit on the retention owner.
 * @evidence contracts/common.md#clear-and-simple-design One fresh snapshot groups dependencies outside the ordinary builder fingerprint rather than widening that output protocol; evaluation separately identifies which documents and revision the executed gate read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null records absence or unreadability explicitly, and absolute resident library identity participates only where the project contract requires it; an incomplete acquisition yields no reusable snapshot.
 * @evidence contracts/common.md#meaningful-documentation Defines every digest domain, sort order, missing-value meaning, revision bracket and timed-versus-library resident identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface declares the observation result; source snapshot acquisition owns file walks, reads, sorting and hashing.
 * @evidence contracts/performance.md#reuse-equivalent-work Retention compares freshly acquired snapshots across calls and the gate's actual read dependencies; revision equality matters only for a revision-bound answer, while every other named input always participates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The retained-status closure keeps at most one snapshot and answer; snapshot size scales with requested documents and generated entries, retaining digests and paths rather than file buffers, without a fixed byte cap.
 * @author Samchon
 */
export interface IAutoMovieProductionSourceSnapshot {
  /**
   * Project revision, read before acquisition and compared after generated reads.
   *
   * Retention compares revision for an answer that read the number itself; the other recorded fields independently participate in every equivalence decision.
   */
  revision: number;

  /**
   * Builder input identity of the current inputs.
   *
   * A timed production reads it through the projection the builder's own publication guard compares. A library reads its namespace, portable authoring projection and derived content closure.
   */
  inputFingerprint: string;

  /**
   * Resident library authoring snapshot digest, including the checkout root text and declaration location, or null for a timed production. Physical root admission remains the project handle's responsibility rather than this digest's proof.
   */
  resident: string | null;

  /** Canonical digest of the screenplay index record, or `null` without one. */
  screenplay: string | null;

  /**
   * Distinct author-owned documents requested for this observation, in code-unit path order, with the digest of the UTF-8 text read or null for an absent document.
   */
  documents: Array<{
    /** Project-relative document path. */
    path: string;

    /** Digest of the document text, or `null` when it is absent. */
    digest: string | null;
  }>;

  /** Resident builder-owned output. */
  generated: {
    /** Input fingerprint the resident manifest records, or `null` without one. */
    inputFingerprint: string | null;

    /** Canonical digest of the resident manifest, or `null` without one. */
    manifest: string | null;

    /**
     * Supplied listed entries under the builder-owned root in code-unit path order, with their byte digest or null when an owned-file read fails. The default walk reports regular files and symbolic links, without following link targets.
     */
    files: Array<{
      /** Path relative to the builder-owned root. */
      path: string;

      /** Digest of the owned bytes, or `null` when they cannot be read. */
      digest: string | null;
    }>;
  };
}
