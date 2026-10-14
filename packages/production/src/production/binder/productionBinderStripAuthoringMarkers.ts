/**
 * Remove nonfenced author-comment spans while preserving the supported fenced-code profile.
 *
 * @evidence contracts/common.md#principled-implementation A line/state scan normalizes CRLF, preserves supported fenced code and removes HTML-comment spans elsewhere before trimming the result. This is a narrow reader transform and does not parse inline code, indented code or the complete CommonMark block grammar.
 * @evidence contracts/common.md#clear-and-simple-design Owns author-comment removal separately from heading rebasing so shared flat/grouped readers use the same transformation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Comment-like text inside recognized fences remains literal; no prose keyword, quality score or expected reader sentence controls output. Unsupported Markdown contexts are not represented as a complete-parser guarantee.
 * @evidence contracts/common.md#meaningful-documentation Documents fence/comment state, whitespace normalization, final trim and supported-profile limits; unterminated author comments consume the remaining nonfenced text.
 * @evidence contracts/performance.md#efficient-algorithms Splits L lines, scans comment spans and constructs output fragments; repeated immutable-string concatenation can copy growing fragments, while each fenced line constructs its closing-pattern regex. Input/output text and line populations determine memory.
 * @evidence contracts/performance.md#reuse-equivalent-work Fence/comment state is carried across current lines; no transformed document or regex result is cached across mutable source reads.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Line/output arrays and fragment strings are local and the transformed string transfers to the reader; no file handle, task or persistent document store is owned.
 */
export function productionBinderStripAuthoringMarkers(markdown: string): string {
    const output: string[] = [];
    let fence: {
        character: string;
        length: number;
    } | undefined;
    let htmlComment: boolean = false;
    for (const sourceLine of markdown.replaceAll("\r\n", "\n").split("\n")) {
        if (fence !== undefined) {
            output.push(sourceLine);
            if (new RegExp(`^ {0,3}${fence.character}{${fence.length},}[ \\t]*$`, "u").test(sourceLine))
                fence = undefined;
            continue;
        }
        const opening: string | undefined = htmlComment === false
            ? /^ {0,3}(`{3,}|~{3,})/u.exec(sourceLine)?.[1]
            : undefined;
        if (opening !== undefined) {
            fence = { character: opening[0], length: opening.length };
            output.push(sourceLine);
            continue;
        }
        let line: string = "";
        for (let cursor: number = 0; cursor < sourceLine.length;) {
            if (htmlComment) {
                const close: number = sourceLine.indexOf("-->", cursor);
                if (close === -1)
                    break;
                cursor = close + 3;
                htmlComment = false;
            }
            else {
                const open: number = sourceLine.indexOf("<!--", cursor);
                if (open === -1) {
                    line += sourceLine.slice(cursor);
                    break;
                }
                line += sourceLine.slice(cursor, open);
                cursor = open + 4;
                htmlComment = true;
            }
        }
        if (line !== "" || output.at(-1) !== "")
            output.push(line);
    }
    return output.join("\n").trim();
}
