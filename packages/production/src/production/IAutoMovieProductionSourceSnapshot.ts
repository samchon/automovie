
/**
 * Every input one read-only source gate answer depends on, read together.
 *
 * The builder input fingerprint names the design, source, content, derivation
 * and owner edges a result is built from, but the gate's answer depends on
 * more than that identity. Screenplay validation reads the screenplay index and
 * the prose documents it addresses, which no fingerprint field carries, and the
 * ownership check compares every file under the builder-owned root with the
 * resident manifest. A snapshot therefore records those beside the revision
 * and, for a library, the resident guard identity that covers the checkout root
 * and the declaration location.
 *
 * Two snapshots observed the same inputs only when every field but the revision
 * is equal, and the revision counts too for an answer that read it. That
 * equality, taken from a fresh read, is the only fact that lets an earlier
 * successful answer stand for the current one.
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
   * Project revision, read first and confirmed unchanged by the last read.
   *
   * It names when the observation was taken. Every project write that moves a
   * gate input also moves another field here, so reuse compares the revision
   * only for an answer that read the revision number itself.
   */
  revision: number;

  /**
   * Builder input identity of the current inputs.
   *
   * A timed production reads it through the projection the builder's own
   * publication guard compares. A library reads its namespace, portable
   * authoring projection and derived content closure.
   */
  inputFingerprint: string;

  /**
   * Resident library authoring snapshot digest, covering the checkout root and
   * the declaration location, or `null` for a timed production, whose project
   * handle refuses a replaced root on every read instead.
   */
  resident: string | null;

  /** Canonical digest of the screenplay index record, or `null` without one. */
  screenplay: string | null;

  /**
   * Author-owned documents requested for this observation, in path order, with
   * the digest of the UTF-8 text read or `null` for an absent document.
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
     * Every entry under the builder-owned root in path order, with its byte
     * digest or `null` when it cannot be read as an owned regular file.
     */
    files: Array<{
      /** Path relative to the builder-owned root. */
      path: string;

      /** Digest of the owned bytes, or `null` when they cannot be read. */
      digest: string | null;
    }>;
  };
}
