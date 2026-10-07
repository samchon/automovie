import type { IHumanViewerRevisions } from "./IHumanViewerRevisions";

/**
 * The entry files of each revision digest's import graph.
 *
 * @evidence contracts/common.md#meaningful-documentation Keys follow the revision domains.
 * @author Samchon
 */
export type IHumanViewerRevisionsEntries = Record<
  keyof IHumanViewerRevisions,
  readonly string[]
>;
