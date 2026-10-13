import type { IAutoMovieDeliveryTocResult } from "./IAutoMovieDeliveryTocResult";
import { AUTO_MOVIE_DELIVERY_TOC_END } from "./AUTO_MOVIE_DELIVERY_TOC_END";
import { AUTO_MOVIE_DELIVERY_TOC_START } from "./AUTO_MOVIE_DELIVERY_TOC_START";
import { parseAutoMovieEvidenceMarkdownHeadings } from "./parseAutoMovieEvidenceMarkdownHeadings";

/** The single visible H1 of one unit or index. The heading parser blanks HTML comments and fenced code, so a title can never carry a managed delimiter; the raw delimiter count is judged separately by the managed-block check. */
function h1(source: string, path: string): { line: number; title: string } {
  const headings: ReturnType<typeof parseAutoMovieEvidenceMarkdownHeadings> = parseAutoMovieEvidenceMarkdownHeadings(source);
  const titles: ReturnType<typeof parseAutoMovieEvidenceMarkdownHeadings> = headings.filter((candidate: ReturnType<typeof parseAutoMovieEvidenceMarkdownHeadings>[number]): boolean => candidate.depth === 1);
  if (titles.length !== 1 || headings[0]?.depth !== 1)
    throw new Error(`${path} must contain exactly one H1 title.`);
  return { line: titles[0]!.line, title: titles[0]!.title.trim() };
}

function markdownLinkLabel(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]");
}

function occurrences(source: string, value: string): number {
  return source.split(value).length - 1;
}

const unitPath: RegExp = /^\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;

function withoutManagedBlock(indexSource: string, indexPath: string): string {
  const startCount: number = occurrences(indexSource, AUTO_MOVIE_DELIVERY_TOC_START);
  const endCount: number = occurrences(indexSource, AUTO_MOVIE_DELIVERY_TOC_END);
  if (startCount > 1 || endCount > 1)
    throw new Error(`${indexPath} contains duplicate managed TOC delimiters.`);
  if (startCount !== endCount)
    throw new Error(`${indexPath} contains a malformed managed TOC block.`);
  if (startCount === 0) return indexSource;
  const match: RegExpExecArray | null =
    /<!-- automovie:toc:start -->[\s\S]*?<!-- automovie:toc:end -->/u.exec(
      indexSource,
    );
  if (match === null)
    throw new Error(`${indexPath} contains a malformed managed TOC block.`);
  return `${indexSource.slice(0, match.index)}${indexSource.slice(match.index + match[0].length)}`;
}

/** The raw H1 line of one index whose only other content is whitespace and at most one well-formed managed block. */
function indexTitleLine(indexSource: string, indexPath: string): string {
  const rest: string = withoutManagedBlock(indexSource, indexPath);
  const lines: string[] = rest.split(/\r?\n/u);
  const title: string = lines[h1(rest, indexPath).line - 1]!;
  if (lines.some((line: string): boolean => line !== title && line.trim().length !== 0))
    throw new Error(
      `${indexPath} may contain only its H1 title and generated unit links.`,
    );
  return title;
}

/**
 * Render or inspect one delivery-group index from its numbered unit files.
 *
 * The canonical index is the authored H1 line, one blank line, and the managed link block in unit filename order; check and write compare and emit those same bytes.
 *
 * @evidence contracts/common.md#principled-implementation Generate canonical managed links from sorted numbered units and compare the exact resulting index bytes.
 * @evidence contracts/common.md#clear-and-simple-design Check and generation modes share one renderer and return source plus read-only freshness diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate units, malformed managed blocks and extra index prose throw; titles are escaped as link labels rather than trusted as delimiters.
 * @evidence contracts/common.md#meaningful-documentation check controls stale diagnostics, changed records byte inequality, and the result and diagnostics array are frozen.
 * @evidence contracts/performance.md#efficient-algorithms Sorting costs O(U log U), while title parsing and output construction scale with total index and unit bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work One canonical source serves both comparison and generation; title extraction is performed once per mapped unit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns frozen result strings and diagnostics; this pure planner opens no files and retains no unit cache.
 */
export function planAutoMovieDeliveryToc(props: {
  /** When true, a byte mismatch also emits a stale-index diagnostic. */
  check?: boolean;
  /** Diagnostic address of the index being planned. */
  indexPath: string;
  /** Current index bytes containing its title and optional managed block. */
  indexSource: string;
  /** Numbered unit filenames and complete Markdown sources used to render links. */
  units: readonly { /** One numbered Markdown filename relative to the delivery group. */
  path: string; /** Unit Markdown bytes whose single visible H1 becomes its link label. */
  source: string }[];
}): IAutoMovieDeliveryTocResult {
  const title: string = indexTitleLine(props.indexSource, props.indexPath);
  const units: { /** One numbered Markdown filename relative to the delivery group. */
  path: string; /** Unit Markdown bytes whose single visible H1 becomes its link label. */
  source: string; }[] = [...props.units].sort((left: { /** One numbered Markdown filename relative to the delivery group. */
  path: string; /** Unit Markdown bytes whose single visible H1 becomes its link label. */
  source: string; }, right: { /** One numbered Markdown filename relative to the delivery group. */
  path: string; /** Unit Markdown bytes whose single visible H1 becomes its link label. */
  source: string; }): 1 | -1 | 0 =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  );
  const seen: Set<string> = new Set<string>();
  for (const unit of units) {
    if (!unitPath.test(unit.path))
      throw new Error(`Delivery inventory has invalid unit path ${unit.path}.`);
    if (seen.has(unit.path))
      throw new Error(`Delivery inventory repeats ${unit.path}.`);
    seen.add(unit.path);
  }
  const block: string = [
    AUTO_MOVIE_DELIVERY_TOC_START,
    ...units.map(
      (unit: { /** One numbered Markdown filename relative to the delivery group. */
      path: string; /** Unit Markdown bytes whose single visible H1 becomes its link label. */
      source: string; }): string =>
        `- [${markdownLinkLabel(h1(unit.source, unit.path).title)}](./${unit.path})`,
    ),
    AUTO_MOVIE_DELIVERY_TOC_END,
  ].join("\n");
  const source: string = `${title}\n\n${block}\n`;
  const changed: boolean = source !== props.indexSource;
  return Object.freeze({
    changed,
    diagnostics: Object.freeze(
      changed && props.check === true
        ? [
            `${props.indexPath} has a missing, stale, or misordered delivery TOC.`,
          ]
        : [],
    ),
    source,
  });
}
