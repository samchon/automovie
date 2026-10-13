import type { Nodes } from "mdast";

import type { IAutoMovieReferenceRange } from "../structures/IAutoMovieReference";
import type { ParsedReference } from "./ParsedReference";
import { digest } from "./digest";
import { MAX_SOURCE_BYTES } from "./MAX_SOURCE_BYTES";
import { fail } from "./fail";
import { parseReferenceSyntax } from "./parseReferenceSyntax";
import { retainReferenceSource } from "./retainReferenceSource";

type Interval = ParsedReference["annotations"][number];
type Heading = ParsedReference["headings"][number];

/**
 * Parse syntax through trusted libraries, then select only original offsets.
 *
 *
 * @evidence contracts/common.md#principled-implementation Fatal UTF-8 decode captures byte digest before asynchronous syntax work; trusted parser positions drive HTML comment masking, original coordinates, heading ancestry and explicit-anchor ambiguity.
 * @evidence contracts/common.md#clear-and-simple-design One parsed snapshot owns source, revision and interval metadata reused by navigation and projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Comment-like code is masked from HTML parsing, headings are not regenerated, and ambiguous or unsupported-depth anchors remain explicit rather than guessed.
 * @evidence contracts/common.md#meaningful-documentation The comment and snapshot members identify original UTF-16 offsets, parser-trusted positions and current-source identity; parse failures become sanitized parser refusals.
 * @evidence contracts/performance.md#efficient-algorithms For L source characters, A comments and H headings, syntax parsing and coordinate scanning dominate; comment sorting is O(A log A), heading projections use O(H log A plus visible text), and coordinates use binary search over line starts.
 * @evidence contracts/performance.md#reuse-equivalent-work One source revision, line-start array, comment population and heading ancestry serve every view of the same snapshot; no parse is cached across requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The 8 MiB byte ceiling bounds input, while ASTs, masked text, decoded text and interval arrays coexist during parsing; returned closures retain source coordinate facts only for their snapshot lifetime.
 */
export async function parseReference(
  file: string,
  bytes: Uint8Array,
  syntax: typeof parseReferenceSyntax = parseReferenceSyntax,
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
  const revision: string = digest(bytes);
  const sourceBytes: number = bytes.byteLength;
  const { tree, Parser }: Awaited<ReturnType<typeof parseReferenceSyntax>> = await syntax(source).catch(() : never =>
    fail(
      "PARSER_ERROR",
      "Markdown parsing failed; inspect the canonical source.",
    ),
  );
  const annotations: Interval[] = [];
  const unterminated: Interval[] = [];
  const html: Interval[] = [];
  const visit: (node: Nodes) => void = (node: Nodes): void => {
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
  let htmlCursor: number = 0;
  for (const interval of html) {
    htmlParts.push(
      " ".repeat(interval.start - htmlCursor),
      source.slice(interval.start, interval.end),
    );
    htmlCursor = interval.end;
  }
  htmlParts.push(" ".repeat(source.length - htmlCursor));
  try {
    const parser: InstanceType<Awaited<ReturnType<typeof parseReferenceSyntax>>["Parser"]> = new Parser(
      {
        oncomment() : void {
          const start: number = parser.startIndex;
          if (!source.startsWith("<!--", start)) return;
          const end: number = Math.min(parser.endIndex + 1, source.length);
          const interval: Interval = { start, end };
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
  annotations.sort((a: Interval, b: Interval) : number => a.start - b.start);
  const lineStarts: number[] = [0];
  for (let i: number = 0; i < source.length; ++i) {
    if (source[i] === "\r") {
      if (source[i + 1] === "\n") ++i;
      lineStarts.push(i + 1);
    } else if (source[i] === "\n") lineStarts.push(i + 1);
  }
  const position: (offset: number) => IAutoMovieReferenceRange["start"] = (offset: number) : IAutoMovieReferenceRange["start"] => {
    let low: number = 0;
    let high: number = lineStarts.length;
    while (low + 1 < high) {
      const middle: number = Math.floor((low + high) / 2);
      if (lineStarts[middle] <= offset) low = middle;
      else high = middle;
    }
    return { offset, line: low + 1, column: offset - lineStarts[low] + 1 };
  };
  const range: (interval: Interval) => IAutoMovieReferenceRange = (interval: Interval): IAutoMovieReferenceRange => ({
    start: position(interval.start),
    end: position(interval.end),
  });
  const headings: Heading[] = [];
  const ancestry: Heading[] = [];
  for (const node of tree.children) {
    if (node.type !== "heading") continue;
    const start: number = node.position!.start.offset!;
    const end: number = node.position!.end.offset!;
    const first: Extract<Nodes,{type:"heading"}>["children"][number] | undefined = node.children[0];
    const last: Extract<Nodes,{type:"heading"}>["children"][number] | undefined = node.children[node.children.length - 1];
    const visible: string =
      first === undefined
        ? ""
        : retainReferenceSource(source, annotations, {
            start: first.position!.start.offset!,
            end: last.position!.end.offset!,
          }).content;
    const anchored: RegExpExecArray | null = /(?:^|[ \t]+)\{#([^{}\s#]+)\}[ \t]*$/u.exec(visible);
    const anchor: string | null = anchored === null ? null : anchored[1];
    while (
      ancestry.length > 0 &&
      ancestry[ancestry.length - 1].depth >= node.depth
    )
      ancestry.pop()!.subtreeEnd = start;
    const parent: Heading | undefined = ancestry[ancestry.length - 1];
    let bodyStart: number = end;
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
  const counts: Map<string,number> = new Map<string, number>();
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
