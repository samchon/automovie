import { fromMarkdown } from "mdast-util-from-markdown";
import { Parser } from "htmlparser2";

/**
 * The reference parser's production-owned native syntax capability. Its supported
 * dependencies are ordinary module inputs, while each request parses its actual
 * current source. This is neither a fixture warm-up nor a retained parse answer.
 *
 *
 * @evidence contracts/common.md#principled-implementation Supported Markdown and HTML parser dependencies supply native syntax capability for each actual source string.
 * @evidence contracts/common.md#clear-and-simple-design This boundary returns a Markdown tree and HTML parser constructor; source projection policy stays in parseReference.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture warm-up, foreign method patch or cached parse answer substitutes for current-source parsing.
 * @evidence contracts/common.md#meaningful-documentation The comment explains module capability versus per-request parse work; parser failures propagate to the owning sanitized boundary.
 * @evidence contracts/performance.md#efficient-algorithms Markdown parsing costs O(source size) under the dependency's parser behavior and allocates its AST; this helper adds no second source parse.
 * @evidence contracts/performance.md#reuse-equivalent-work The HTML constructor is shared module capability, while each Markdown source is parsed independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The tree transfers to its request owner; module dependencies remain process-resident and no file handle is opened.
 */
export async function parseReferenceSyntax(source: string) : Promise<{tree:ReturnType<typeof fromMarkdown>;Parser:typeof Parser}> {
  return { tree: fromMarkdown(source), Parser };
}
