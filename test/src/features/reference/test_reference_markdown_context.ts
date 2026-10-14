import { createAutoMovieReferenceProvider } from "@automovie/mcp";
import { TestValidator } from "@nestia/e2e";
import type { AutoMovieReferenceResult } from "../../../../packages/mcp/src/structures/AutoMovieReferenceResult";
import type { IAutoMovieReferenceRange } from "../../../../packages/mcp/src/structures/IAutoMovieReferenceRange";

/**
 * Projection uses syntax context while retaining source bytes and original addresses.
 *
 * Scenarios:
 * 1. Inline raw-text HTML and code retain comment-like literals.
 * 2. Actual comments disappear around headings without admitting commented examples.
 * 3. Empty, adjacent and out-of-subtree annotations reconstruct through exact ranges.
 * 4. An HTML block interrupts backtick text, while a real multiline code span
 *    preserves its literal comment across LF and CRLF boundaries.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual reference provider for thirteen authored context pairs and a selected subtree, asserting exact visible content and reconstruction from original source ranges. Real comments disappear while raw-text HTML, code and incomplete comment-like text retain their original characters; section detail contains only its one interior annotation.
 * @evidence contracts/testing.md#independent-expectations Literal source/expected pairs encode Markdown block precedence and HTML raw-text/comment semantics independently of parser output. Reconstructing with source.slice uses original UTF-16 offsets and must equal that same authored expected text, though it does not independently pin every individual range endpoint or line/column coordinate.
 * @evidence contracts/testing.md#distinguishing-cases Keeps script/textarea, indented/fenced code, interrupted versus uninterrupted multiline backtick spans under LF/CRLF, adjacent comments, unclosed inline opener, CDATA/doctype/instruction, hidden heading examples and subtree-external annotations. Navigation/anchor failures and detailed coordinate/digest behavior belong to adjacent reference tests.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous test_reference_markdown_context owns four portable scenario groups, creating a reader/provider per context and one for subtree selection. Current parser dependencies consume in-memory authored Markdown; no filesystem, process, MCP server, browser or renderer is started and no authored prose is graded.
 */
export async function test_reference_markdown_context(): Promise<void> {
  const file: string = "docs/models/model.md";
  for (const [source, expected] of [
    [
      "prefix <script><!-- script literal --></script> suffix",
      "prefix <script><!-- script literal --></script> suffix",
    ],
    [
      "prefix <textarea><!-- text literal --></textarea> suffix",
      "prefix <textarea><!-- text literal --></textarea> suffix",
    ],
    [
      "    <!-- indented literal -->\n    ## code\n",
      "    <!-- indented literal -->\n    ## code\n",
    ],
    [
      "~~~html\n<!-- fenced literal -->\n~~~\n",
      "~~~html\n<!-- fenced literal -->\n~~~\n",
    ],
    // CommonMark block structure precedes inline parsing: a line-start comment
    // interrupts the paragraph, so these backticks do not form one code span.
    ["``multi\n<!-- inline literal -->\nline``", "``multi\n\nline``"],
    ["``multi\r\n<!-- inline literal -->\r\nline``", "``multi\r\n\r\nline``"],
    // Ordinary text before the opener keeps the paragraph (and code span) intact.
    [
      "``multi\ntext <!-- inline literal -->\nline``",
      "``multi\ntext <!-- inline literal -->\nline``",
    ],
    [
      "``multi\r\ntext <!-- inline literal -->\r\nline``",
      "``multi\r\ntext <!-- inline literal -->\r\nline``",
    ],
    ["<!-- a --><!-- b -->", ""],
    ["prefix <!-- unclosed", "prefix <!-- unclosed"],
    ["<![CDATA[<!-- literal -->]]>", "<![CDATA[<!-- literal -->]]>"],
    [
      "<!DOCTYPE html>\n\n<?instruction?>\n\n<!-- remove -->",
      "<!DOCTYPE html>\n\n<?instruction?>\n\n",
    ],
    [
      "<!--\n```\n## fake {#fake}\n-->\n\n## Real <!-- hidden --> {#real}\nbody",
      "\n\n## Real  {#real}\nbody",
    ],
  ]) {
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
      throw new Error("Expected source projection.");
    TestValidator.equals(
      "context keeps original content",
      result.data.content,
      expected,
    );
    TestValidator.equals(
      "context pieces reconstruct",
      result.data.projection.contentRanges
        .map((range: IAutoMovieReferenceRange): string => source.slice(range.start.offset, range.end.offset))
        .join(""),
      expected,
    );
  }
  const source: string =
    "<!-- before -->\n\n## A {#a}\n<!-- inside -->\nA\n\n## B {#b}\n<!-- after -->\nB";
  const provider: ReturnType<typeof createAutoMovieReferenceProvider> = createAutoMovieReferenceProvider({
    read: async (): Promise<Uint8Array> => Buffer.from(source),
    list: async (): Promise<readonly string[]> => [file],
  });
  const section: AutoMovieReferenceResult = await provider({
    operation: "read_section_without_annotations",
    location: `${file}#a`,
    detail: true,
  });
  if (
    !section.ok ||
    !("content" in section.data) ||
    section.data.projection === undefined
  )
    throw new Error("Expected subtree projection.");
  TestValidator.equals(
    "only subtree comments",
    section.data.projection.annotationRanges.length,
    1,
  );
  TestValidator.equals("only subtree content", section.data.content, "\nA\n\n");
}
