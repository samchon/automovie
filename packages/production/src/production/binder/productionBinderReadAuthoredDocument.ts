import { IAutoMovieProductionBinderAuthoredDocument } from "./IAutoMovieProductionBinderAuthoredDocument";
import { productionBinderReadPhysicalMarkdown } from "./productionBinderReadPhysicalMarkdown";
import { productionBinderStripHeadingAnchor } from "./productionBinderStripHeadingAnchor";

/**
 * Extract the first admitted H1 title and transformed body from a grouped unit.
 *
 * @evidence contracts/common.md#principled-implementation Reads admitted regular Markdown, removes author markers, requires an initial H1 and splits the transformed text into anchor-free title and trimmed body.
 * @evidence contracts/common.md#clear-and-simple-design One document projection serves grouped units without repeating physical reading or marker rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/invalid H1 refuses and neither filename nor group title substitutes for the document title.
 * @evidence contracts/common.md#meaningful-documentation Documents transformed first-title/body extraction and propagated read/refusal, without certifying all CommonMark semantics.
 * @evidence contracts/performance.md#efficient-algorithms Full B-byte read/decode and marker processing plus heading/body slicing drive work and temporary strings.
 * @evidence contracts/performance.md#reuse-equivalent-work One transformed Markdown string supplies both result fields; no cross-file or cross-invocation result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Title/body strings transfer to the group; intermediate Markdown is local and the promise reader owns transient descriptor cleanup.
 */
export async function productionBinderReadAuthoredDocument(target: string): Promise<IAutoMovieProductionBinderAuthoredDocument> {
    const markdown: string = await productionBinderReadPhysicalMarkdown(target);
    const heading: RegExpExecArray | null = /^#[ \t]+(\S.*)(?:\n|$)/u.exec(markdown);
    if (heading === null)
        throw new Error(`${target}: an authored document must open with one H1 title.`);
    return {
        title: productionBinderStripHeadingAnchor(heading[1]),
        body: markdown.slice(heading[0].length).trim(),
    };
}
