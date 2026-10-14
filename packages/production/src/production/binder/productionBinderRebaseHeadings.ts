import { productionBinderStripHeadingAnchor } from "./productionBinderStripHeadingAnchor";

/**
 * Shift supported nonfenced ATX headings into the reader's group/document depth.
 *
 * @evidence contracts/common.md#principled-implementation Preserves recognized fenced lines and shifts supported column-zero ATX headings by the caller's grouping level, refusing depth beyond H6 and removing trailing citation anchors from heading titles.
 * @evidence contracts/common.md#clear-and-simple-design Owns presentation heading depth independently of comment removal and physical document acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonheading lines and recognized code remain unchanged; unsupported CommonMark contexts and indented ATX headings are not silently claimed as fully parsed or rebased.
 * @evidence contracts/common.md#meaningful-documentation Defines shift supplied by flat/grouped assembly, H6 refusal and the narrow ATX/fence profile without a general Markdown rendering claim.
 * @evidence contracts/performance.md#efficient-algorithms Splits/maps all body lines and rejoins full text, with per-fenced-line regex construction and heading/title scans; B text and L line populations drive work and intermediate strings.
 * @evidence contracts/performance.md#reuse-equivalent-work One fence state spans the current map traversal and the heading-anchor rule is shared with title readers; no cross-document transform cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input remains borrowed, line/output arrays are local and only transformed text transfers; no native handle, parser DOM or task is retained.
 */
export function productionBinderRebaseHeadings(body: string, shift: number): string {
    let fence: {
        character: string;
        length: number;
    } | undefined;
    return body
        .split("\n")
        .map((line: string): string => {
        if (fence !== undefined) {
            if (new RegExp(`^ {0,3}${fence.character}{${fence.length},}[ \t]*$`, "u").test(line))
                fence = undefined;
            return line;
        }
        const opening: RegExpExecArray | null = /^ {0,3}(`{3,}|~{3,})/u.exec(line);
        if (opening !== null) {
            fence = { character: opening[1][0], length: opening[1].length };
            return line;
        }
        const heading: RegExpExecArray | null = /^(#{1,6})[ \t]+(\S.*)$/u.exec(line);
        if (heading === null)
            return line;
        if (heading[1].length + shift > 6)
            throw new Error(`A bound heading may not exceed H6: ${line.trim()}`);
        return `${"#".repeat(shift)}${heading[1]} ${productionBinderStripHeadingAnchor(heading[2])}`;
    })
        .join("\n");
}
