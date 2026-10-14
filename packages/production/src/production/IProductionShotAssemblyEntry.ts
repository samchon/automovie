import { IAutoMovieShotContract, IAutoMovieVideoEdit } from "@automovie/interface";

/**
 * One contracted shot ordered by its first edit occurrence, or an unplaced graph remainder. Contract and placement records are borrowed from the compilation attempt.
 *
 * @evidence contracts/common.md#principled-implementation The id joins the design contract while nullable placement/index represent whether an authoritative edit occurrence established its compilation position.
 * @evidence contracts/common.md#clear-and-simple-design The shared entry connects ordering and hard-cut eligibility without copying the entire contract or introducing a separate occurrence service.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null placement/index do not fabricate an edit position; only the ordering owner constructs paired placed values, a coherence premise not enforced by the interface alone.
 * @evidence contracts/common.md#meaningful-documentation Documents borrowed rows, first-placement identity, zero-based edit index and unplaced null meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased row shape performs no ordering scan; shotAssemblyOrder owns first-placement indexing and remainder traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type adds no edit-order cache; the producer rebuilds ordered rows for current edit and contract inputs.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires no resource; contracts, placements and returned rows are owned by the compilation attempt.
 * @author Samchon
 */
export interface IProductionShotAssemblyEntry {
  /** Exact contracted shot id used to join source and compiled maps. */
  id: string;

  /** Borrowed design contract whose source is compiled once. */
  contract: IAutoMovieShotContract;

  /** First edit occurrence, or null for the unplaced graph remainder. */
  placement: IAutoMovieVideoEdit | null;

  /** Zero-based edit occurrence index, or null when placement is absent. */
  placementIndex: number | null;
}
