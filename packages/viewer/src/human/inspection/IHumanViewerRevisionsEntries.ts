import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";

/**
 * The entry files of each revision digest's import graph.
 *
 * @evidence contracts/common.md#principled-implementation Every revision domain receives its own readonly entry-file population through the keys of IHumanViewerRevisions.
 * @evidence contracts/common.md#clear-and-simple-design A mapped record reuses the domain owner instead of declaring a second set of digest names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The entry record declares the actual import-graph roots without excluding files according to a subject or capture.
 * @evidence contracts/common.md#meaningful-documentation States that each readonly string population names a digest's import-graph entry files.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Every revision domain receives its own readonly entry-file population through the keys of IHumanViewerRevisions.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity A mapped record reuses the domain owner instead of declaring a second set of digest names.
 * @author Samchon
 */
export type IHumanViewerRevisionsEntries = Record<
  keyof IHumanViewerRevisions,
  readonly string[]
>;
