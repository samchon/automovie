import { createAutoMovieReferenceProvider } from "@automovie/mcp";
import { TestValidator } from "@nestia/e2e";
import type { AutoMovieReferenceResult } from "../../../../packages/mcp/src/structures/AutoMovieReferenceResult";
import type { IAutoMovieReferenceHeading } from "../../../../packages/mcp/src/structures/IAutoMovieReferenceHeading";

/**
 * Explicit source identity and heading depth decide the exact subtree.
 *
 * Scenarios:
 * 1. H2/H3/H4 reads end before the next sibling or parent and retain descendants.
 * 2. Missing, repeated and unsupported anchors refuse while drafts remain readable.
 * 3. H1 absence, group indices, empty files and final headings invent no title.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads actual H2/H3/H4 subtrees and file navigation, asserting exact bodies, selected anchors, original parent ordinals and H1 title presence/absence. Missing/duplicate/unsupported anchors produce distinct refusals, drafts remain file-readable and empty/BOM/CR boundary source text is preserved exactly.
 * @evidence contracts/testing.md#independent-expectations Authored heading hierarchy independently defines five literal subtree bodies, parent [null,0,1,1,0,null], Group title and refusal/addressability populations. Exact source strings supply the boundary content oracle; the test does not derive expected structure from provider headings or parse snapshots.
 * @evidence contracts/testing.md#distinguishing-cases Keeps nested and sibling cutoffs, final empty section, no H1, H1-only group, unanchored draft, duplicate anchor, absent anchor and H1/H5/H6 refusals, plus empty/hash-only/final-heading/BOM with CR files. Comment-context projection and source-coordinate/race boundaries belong to neighboring reference tests.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous test_reference_navigation owns three portable groups through one provider whose injected reader observes the currently arranged string each call. No physical path, source write, process, server, browser or renderer participates; exact product navigation is tested rather than repository/document arrangement.
 */
export async function test_reference_navigation(): Promise<void> {
  const file: string = "docs/briefs/unit.md";
  let source: string =
    "## Owner {#owner}\nroot\n### Shot {#shot}\nshot\n#### Beat {#beat}\nbeat\n#### End {#end}\nend\n### Next {#next}\nnext\n## Last {#last}\n";
  const provider: ReturnType<typeof createAutoMovieReferenceProvider> = createAutoMovieReferenceProvider({
    read: async (): Promise<Uint8Array> => Buffer.from(source),
    list: async (): Promise<readonly string[]> => [file],
  });
  for (const [anchor, content] of [
    [
      "owner",
      "root\n### Shot {#shot}\nshot\n#### Beat {#beat}\nbeat\n#### End {#end}\nend\n### Next {#next}\nnext\n",
    ],
    ["shot", "shot\n#### Beat {#beat}\nbeat\n#### End {#end}\nend\n"],
    ["beat", "beat\n"],
    ["end", "end\n"],
    ["last", ""],
  ]) {
    const result: AutoMovieReferenceResult = await provider({
      operation: "read_section_without_annotations",
      location: `${file}#${anchor}`,
      detail: true,
    });
    if (!result.ok || !("content" in result.data))
      throw new Error("Expected a section.");
    TestValidator.equals(`subtree ${anchor}`, result.data.content, content);
    TestValidator.equals(
      "selected heading separated",
      result.data.heading?.anchor,
      anchor,
    );
  }
  const index: AutoMovieReferenceResult = await provider({ operation: "get_index_of_file", file });
  if (!index.ok || !("headings" in index.data))
    throw new Error("Expected an index.");
  TestValidator.equals("no fabricated title", index.data.title, null);
  TestValidator.equals(
    "original parents",
    index.data.headings.map((heading: IAutoMovieReferenceHeading): number | null => heading.parent),
    [null, 0, 1, 1, 0, null],
  );
  source = "# Group {#group}\n\n[Unit](unit.md)\n";
  const group: AutoMovieReferenceResult = await provider({ operation: "get_index_of_file", file });
  if (!group.ok || !("headings" in group.data))
    throw new Error("Expected a group index.");
  TestValidator.equals("group title", group.data.title, "Group");
  TestValidator.equals("group is not invented unit", group.data.headings, []);
  source =
    "# Top {#top}\n\n## Draft\n\n## One {#same}\n\n## Two {#same}\n\n##### Deep {#deep}\n\n###### Last {#six}";
  for (const [anchor, code] of [
    ["absent", "MISSING_SECTION"],
    ["same", "AMBIGUOUS_ANCHOR"],
    ["top", "UNSUPPORTED_DEPTH"],
    ["deep", "UNSUPPORTED_DEPTH"],
    ["six", "UNSUPPORTED_DEPTH"],
  ]) {
    const result: AutoMovieReferenceResult = await provider({
      operation: "read_section_without_annotations",
      location: `${file}#${anchor}`,
    });
    TestValidator.equals(
      `refusal ${anchor}`,
      result.ok ? "success" : result.error.code,
      code,
    );
  }
  const draft: AutoMovieReferenceResult = await provider({ operation: "get_index_of_file", file });
  if (!draft.ok || !("headings" in draft.data))
    throw new Error("Expected draft index.");
  TestValidator.equals(
    "draft status",
    draft.data.headings.map((heading: IAutoMovieReferenceHeading): IAutoMovieReferenceHeading["addressability"] => heading.addressability),
    ["unaddressable", "ambiguous", "ambiguous"],
  );
  const rawDraft: AutoMovieReferenceResult = await provider({
    operation: "read_file_without_annotations",
    file,
  });
  TestValidator.predicate("draft remains file-readable", rawDraft.ok);
  for (source of [
    "",
    "##",
    "## Empty {#empty}",
    "\uFEFF## Bom {#bom}\rbody\r",
  ]) {
    const result: AutoMovieReferenceResult = await provider({
      operation: "read_file_without_annotations",
      file,
      detail: true,
    });
    if (!result.ok || !("content" in result.data))
      throw new Error("Expected boundary content.");
    TestValidator.equals("boundary bytes", result.data.content, source);
  }
}
