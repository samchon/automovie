import { fromMarkdown } from "mdast-util-from-markdown";
import { Parser } from "htmlparser2";

/**
 * The reference parser's production-owned native syntax capability. Its supported
 * dependencies are ordinary module inputs, while each request parses its actual
 * current source. This is neither a fixture warm-up nor a retained parse answer.
 */
export async function parseReferenceSyntax(source: string) {
  return { tree: fromMarkdown(source), Parser };
}
