import { fromMarkdown } from "mdast-util-from-markdown";
import { Parser } from "htmlparser2";

/**
 * The reference parser's production-owned native syntax capability. Its supported
 * dependencies are ordinary module inputs, while each request parses its actual
 * current source. This is neither a fixture warm-up nor a retained parse answer.
 *
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-source Parses current Markdown bytes through the maintained native syntax owner.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-source Supplies real Markdown and HTML parsers to the reference projection without copied syntax snapshots.
 */
export async function parseReferenceSyntax(source: string) {
  return { tree: fromMarkdown(source), Parser };
}
