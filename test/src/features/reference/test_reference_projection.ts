import { createAutoMovieReferenceProvider } from "@automovie/mcp";
import { TestValidator } from "@nestia/e2e";
import type { AutoMovieReferenceResult } from "../../../../packages/mcp/src/structures/AutoMovieReferenceResult";
import type { IAutoMovieReferenceRange } from "../../../../packages/mcp/src/structures/IAutoMovieReferenceRange";
import type { IAutoMovieReferenceHeading } from "../../../../packages/mcp/src/structures/IAutoMovieReferenceHeading";

/**
 * A reference is an exact original-source projection rather than an edition.
 *
 * Scenarios:
 * 1. Mixed Unicode and CRLF retain their original UTF-16 range coordinates.
 * 2. Comments disappear while code, escaped literals, HTML, scene carriers and
 *    timing selectors retain their exact bytes.
 * 3. Detail ranges reconstruct content and compact reads omit those arrays.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads actual detailed/compact content and navigation for one mixed Unicode/CRLF source, checking exact omission, UTF-8 source/content sizes, original-range reconstruction, first comment line/column/slice, EOF and exclusion of a fenced fake heading. Compact content must omit projection metadata.
 * @evidence contracts/testing.md#independent-expectations The authored source independently defines two comments to remove and literal line four/UTF-16 column four for the first opener after a Korean scalar and surrogate-pair emoji. Buffer.byteLength and source.slice independently check byte versus coordinate units; only the first annotation's exact coordinates are pinned, while all retained ranges must reconstruct the expected text.
 * @evidence contracts/testing.md#distinguishing-cases Retains true comments beside mixed-width text, fenced and inline code, escaped comment-like text, an HTML attribute, scene/timing carriers, detailed versus compact output and a fenced heading lookalike. Context interruption, malformed UTF-8, stale digests and subtree refusal decisions belong to adjacent reference units.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous test_reference_projection owns three portable groups through resident source/list ports and current parser dependencies. Scene/timing text is projection input rather than evaluated production content; no filesystem, authored program, process, MCP server, browser or renderer executes.
 */
export async function test_reference_projection(): Promise<void> {
  const file: string = "docs/screenplays/01/unit.md";
  const source: string =
    '# 題😀 {#title}\r\n\r\n## 한글 {#scene_a}\r\n가😀<!-- secret -->中<!-- two -->日\r\n\r\n```md\r\n<!-- literal -->\r\n## fake {#fake}\r\n```\r\n\r\n`<!-- inline -->` \\<!-- escaped -->\r\n\r\n<div title="<!-- attribute -->">HTML</div>\r\n\r\n@automovie-scene scene_a\r\n{@timing shot:shot_a/entry 1.25s}\r\n@end-automovie-scene';
  const expected: string = source
    .replace("<!-- secret -->", "")
    .replace("<!-- two -->", "");
  const provider: ReturnType<typeof createAutoMovieReferenceProvider> = createAutoMovieReferenceProvider({
    read: async (): Promise<Uint8Array> => Buffer.from(source),
    list: async (): Promise<readonly string[]> => [file],
  });
  const result: AutoMovieReferenceResult = await provider({
    operation: "read_file_without_annotations",
    file,
    detail: true,
  });
  if (
    !result.ok ||
    !("content" in result.data) ||
    result.data.projection === undefined
  )
    throw new Error("Expected a detailed content result.");
  TestValidator.equals("original projection", result.data.content, expected);
  TestValidator.equals(
    "content byte accounting",
    result.data.contentBytes,
    Buffer.byteLength(expected),
  );
  TestValidator.equals(
    "source byte accounting",
    result.data.sourceBytes,
    Buffer.byteLength(source),
  );
  TestValidator.equals(
    "piece reconstruction",
    result.data.projection.contentRanges
      .map((range: IAutoMovieReferenceRange): string => source.slice(range.start.offset, range.end.offset))
      .join(""),
    expected,
  );
  const first: IAutoMovieReferenceRange = result.data.projection.annotationRanges[0];
  TestValidator.equals(
    "UTF-16 start",
    { line: first.start.line, column: first.start.column },
    { line: 4, column: 4 },
  );
  TestValidator.equals(
    "source interval",
    source.slice(first.start.offset, first.end.offset),
    "<!-- secret -->",
  );
  TestValidator.equals("EOF", result.data.range.end.offset, source.length);
  const compact: AutoMovieReferenceResult = await provider({
    operation: "read_file_without_annotations",
    file,
  });
  TestValidator.predicate(
    "detail is opt-in",
    compact.ok && !("projection" in compact.data),
  );
  const index: AutoMovieReferenceResult = await provider({ operation: "get_index_of_file", file });
  if (!index.ok || !("headings" in index.data))
    throw new Error("Expected an index.");
  TestValidator.equals(
    "fake heading excluded",
    index.data.headings.map((heading: IAutoMovieReferenceHeading): string | null => heading.anchor),
    ["scene_a"],
  );
}
