import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";

/**
 * The entry files of each revision digest's import graph.
 *
 * @author Samchon
 */
export type IHumanViewerRevisionsEntries = Record<
  keyof IHumanViewerRevisions,
  readonly string[]
>;
