import * as fs from "node:fs/promises";
import * as path from "node:path";
import { IAutoMovieProductionBinderAuthoredDocument } from "./IAutoMovieProductionBinderAuthoredDocument";
import { productionBinderListMarkdownFiles } from "./productionBinderListMarkdownFiles";
import { productionBinderStripAuthoringMarkers } from "./productionBinderStripAuthoringMarkers";
import { productionBinderStripHeadingAnchor } from "./productionBinderStripHeadingAnchor";

/**
 * Read a nonempty flat Markdown layer in global relative-path order.
 *
 * @evidence contracts/common.md#principled-implementation Enumerates globally ordered Markdown paths, decodes current UTF-8 text, strips author markers and requires the transformed document to open with an H1 before projecting title/body. Sequential reads are not a single source snapshot.
 * @evidence contracts/common.md#clear-and-simple-design Owns flat reader topology while traversal, marker handling and trailing heading-anchor removal stay with their dedicated helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty layer or missing title refuses; non-path-attributed enumeration errors become the existing no-authored-documents error rather than a fake empty reader edition.
 * @evidence contracts/common.md#meaningful-documentation Defines nonempty flat population, first-H1 title/body extraction and UTF-8 decoding behavior; this reader does not perform grouped index/unit rules.
 * @evidence contracts/performance.md#efficient-algorithms Includes full directory traversal/sorting and all B document bytes, marker scans and body copies; the complete document array is materialized for subsequent edition assembly.
 * @evidence contracts/performance.md#reuse-equivalent-work The one ordered path list drives all reads and each stripped document supplies its title/body; no parsed document cache spans invocations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns all parsed document strings to markdown assembly without a fixed population/byte cap; Node promise readers own their transient handles and no watcher or task is retained.
 */
export async function productionBinderReadFlatLayer(layerRoot: string): Promise<IAutoMovieProductionBinderAuthoredDocument[]> {
    const files: string[] = await productionBinderListMarkdownFiles(layerRoot).catch((error: unknown): never => {
        if (error instanceof Error && error.message.startsWith(layerRoot))
            throw error;
        throw new Error(`${layerRoot}: the production has no authored documents.`);
    });
    if (files.length === 0)
        throw new Error(`${layerRoot}: the production has no authored documents.`);
    const documents: IAutoMovieProductionBinderAuthoredDocument[] = [];
    for (const file of files) {
        const target: string = path.join(layerRoot, ...file.split("/"));
        const markdown: string = productionBinderStripAuthoringMarkers(await fs.readFile(target, "utf8"));
        const heading: RegExpExecArray | null = /^#[ \t]+(\S.*)(?:\n|$)/u.exec(markdown);
        if (heading === null)
            throw new Error(`${target}: an authored document must open with one H1 title.`);
        documents.push({
            title: productionBinderStripHeadingAnchor(heading[1]),
            body: markdown.slice(heading[0].length).trim(),
        });
    }
    return documents;
}
