import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";

/**
 * The entry files of each revision digest's import graph.
 *
 * @evidence contracts/common.md#principled-implementation A record keyed by every revision domain requires an entry-file array for browser, face, body and person import graphs.
 * @evidence contracts/common.md#clear-and-simple-design Deriving keys from the revision record keeps graph roots aligned with the digests consumers use.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Entries describe real source roots rather than a precomputed list of expected digest outputs.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies import-graph entry files; readonly arrays prevent mutation through this root-set contract.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This keyed type selects no import traversal or path-resolution algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Root lists establish dependencies but store no completed graph or memoized source text themselves.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Readonly file-name arrays own no threads or open files; their lifetime follows revision-owner configuration.
 *
 * @author Samchon
 */
export type IHumanViewerRevisionsEntries = Record<
  keyof IHumanViewerRevisions,
  readonly string[]
>;
