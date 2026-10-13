

/**
 * One current source selected by the authoring graph.
 *
 * @evidence contracts/common.md#principled-implementation Canonical project path and nullable semantic digest preserve every selected source, including missing or unreadable members.
 * @evidence contracts/common.md#clear-and-simple-design Snapshot capture deduplicates source paths and execution planning consumes their normalized digest population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null covers any read/normalization failure caught by capture, not only absence; the type does not authenticate path or digest.
 * @evidence contracts/common.md#meaningful-documentation Documents selected membership, normalized identity and null failure meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased path/digest pair hashes no source; captureAutoMovieLibraryAuthoringSnapshot owns strict normalization and source hashing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pair coordinates no reads; capture deduplicates selected paths and reuses each acquired digest within its current snapshot.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no bytes; capture discards source buffers after hashing and transfers path/digest records to the attempt caller.
 * @author Samchon
 */
export interface IAutoMovieLibraryAuthoringSourceSnapshot {

    /**
     * Canonical project-relative POSIX path.
     */
    path: string;

    /**
     * Semantic source digest, or null when source reading or strict normalization fails.
     */
    digest: string | null;
}
