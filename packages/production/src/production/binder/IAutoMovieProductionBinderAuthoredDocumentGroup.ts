import { IAutoMovieProductionBinderAuthoredDocument } from "./IAutoMovieProductionBinderAuthoredDocument";

/**
 * One index-titled reader group and its ordered current unit documents.
 *
 * @evidence contracts/common.md#principled-implementation The index H1 names one admitted group and ordered unit readers supply its document array under the scaffold topology.
 * @evidence contracts/common.md#clear-and-simple-design One internal group preserves title/unit partition for H2/H3 reader assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shape alone certifies neither nonempty units nor physical ownership; its reader performs those checks.
 * @evidence contracts/common.md#meaningful-documentation Members document index-derived title and ordered current unit documents rather than an authored membership override.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No algorithm executes in the interface; group readers own enumeration/sorting/text costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type defines no retained inventory or cross-group cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The assembly caller owns the document population and strings, with no resource acquired here.
 * @author Samchon
 */
export interface IAutoMovieProductionBinderAuthoredDocumentGroup {
    /** Current unit documents in numeric/code-unit filename order. */
    documents: IAutoMovieProductionBinderAuthoredDocument[];

    /** Current group index's first-H1 title without a trailing authored anchor. */
    title: string;
}
