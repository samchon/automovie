import type { Nodes } from "mdast";

import type { IAutoMovieReferenceRange } from "../structures/IAutoMovieReference";
import type { ParsedReference } from "./ParsedReference";
import { digest } from "./digest";
import { MAX_SOURCE_BYTES, fail } from "./referenceError";
import { parseReferenceSyntax } from "./parseReferenceSyntax";
import { retainReferenceSource } from "./retainReferenceSource";

type Interval = ParsedReference["annotations"][number];
type Heading = ParsedReference["headings"][number];

/**
 * Parse syntax through trusted libraries, then select only original offsets.
 *
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-selection Finds actual top-level heading identities and hierarchy rather than example headings.
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-source Recognizes annotation intervals while preserving every non-comment source character.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-selection Derives explicit anchors, unsupported depths, ambiguity and subtree boundaries.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-source Decodes UTF-8 fatally and retains original UTF-16 coordinates and annotation diagnostics.
 */
export async function parseReference(
  file: string,
  bytes: Uint8Array,
  syntax = parseReferenceSyntax,
): Promise<ParsedReference> {
  if (bytes.byteLength > MAX_SOURCE_BYTES)
    fail("RESOURCE_LIMIT", "Source exceeds the 8 MiB file limit.");
  let source: string;
  try {
    source = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      bytes,
    );
  } catch {
    return fail("INVALID_UTF8", "Source is not valid UTF-8.");
  }
  const revision = digest(bytes);
  const sourceBytes = bytes.byteLength;
  const { tree, Parser } = await syntax(source).catch(() =>
    fail(
      "PARSER_ERROR",
      "Markdown parsing failed; inspect the canonical source.",
    ),
  );
  const annotations: Interval[] = [];
  const unterminated: Interval[] = [];
  const html: Interval[] = [];
  const visit = (node: Nodes): void => {
    if (node.type === "html") {
      html.push({
        start: node.position!.start.offset!,
        end: node.position!.end.offset!,
      });
    } else if ("children" in node) node.children.forEach(visit);
  };
  visit(tree);
  // Keep HTML context across inline AST nodes while code and escaped text are
  // masked without moving any original UTF-16 offset.
  const htmlParts: string[] = [];
  let htmlCursor = 0;
  for (const interval of html) {
    htmlParts.push(
      " ".repeat(interval.start - htmlCursor),
      source.slice(interval.start, interval.end),
    );
    htmlCursor = interval.end;
  }
  htmlParts.push(" ".repeat(source.length - htmlCursor));
  try {
    const parser = new Parser(
      {
        oncomment() {
          const start = parser.startIndex;
          if (!source.startsWith("<!--", start)) return;
          const end = Math.min(parser.endIndex + 1, source.length);
          const interval = { start, end };
          annotations.push(interval);
          if (source.slice(end - 3, end) !== "-->") unterminated.push(interval);
        },
      },
      { decodeEntities: false },
    );
    parser.end(htmlParts.join(""));
  } catch {
    return fail(
      "PARSER_ERROR",
      "HTML parsing failed; inspect the canonical source.",
    );
  }
  annotations.sort((a, b) => a.start - b.start);
  const lineStarts = [0];
  for (let i = 0; i < source.length; ++i) {
    if (source[i] === "\r") {
      if (source[i + 1] === "\n") ++i;
      lineStarts.push(i + 1);
    } else if (source[i] === "\n") lineStarts.push(i + 1);
  }
  const position = (offset: number) => {
    let low = 0;
    let high = lineStarts.length;
    while (low + 1 < high) {
      const middle = Math.floor((low + high) / 2);
      if (lineStarts[middle] <= offset) low = middle;
      else high = middle;
    }
    return { offset, line: low + 1, column: offset - lineStarts[low] + 1 };
  };
  const range = (interval: Interval): IAutoMovieReferenceRange => ({
    start: position(interval.start),
    end: position(interval.end),
  });
  const headings: Heading[] = [];
  const ancestry: Heading[] = [];
  for (const node of tree.children) {
    if (node.type !== "heading") continue;
    const start = node.position!.start.offset!;
    const end = node.position!.end.offset!;
    const first = node.children[0];
    const last = node.children[node.children.length - 1];
    const visible =
      first === undefined
        ? ""
        : retainReferenceSource(source, annotations, {
            start: first.position!.start.offset!,
            end: last.position!.end.offset!,
          }).content;
    const anchored = /(?:^|[ \t]+)\{#([^{}\s#]+)\}[ \t]*$/u.exec(visible);
    const anchor = anchored === null ? null : anchored[1];
    while (
      ancestry.length > 0 &&
      ancestry[ancestry.length - 1].depth >= node.depth
    )
      ancestry.pop()!.subtreeEnd = start;
    const parent = ancestry[ancestry.length - 1];
    let bodyStart = end;
    if (source[bodyStart] === "\r") ++bodyStart;
    if (source[bodyStart] === "\n") ++bodyStart;
    const heading: Heading = {
      ordinal: headings.length,
      depth: node.depth,
      title:
        anchored === null
          ? visible
          : visible.slice(0, anchored.index).trimEnd(),
      anchor,
      location: anchor === null ? null : `${file}#${anchor}`,
      addressability: anchor === null ? "unaddressable" : "addressable",
      parent: parent?.ordinal ?? null,
      range: range({ start, end }),
      bodyStart,
      subtreeEnd: source.length,
    };
    headings.push(heading);
    ancestry.push(heading);
  }
  const counts = new Map<string, number>();
  for (const heading of headings)
    if (heading.anchor !== null)
      counts.set(heading.anchor, (counts.get(heading.anchor) ?? 0) + 1);
  for (const heading of headings) {
    if (heading.anchor !== null && counts.get(heading.anchor)! > 1)
      heading.addressability = "ambiguous";
    else if (heading.depth < 2 || heading.depth > 4)
      heading.addressability = "unsupported_depth";
  }
  return {
    source,
    file,
    revision,
    sourceBytes,
    headings,
    annotations,
    unterminated,
    range,
  };
}
