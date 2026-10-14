import { createAutoMovieReferenceProvider } from "@automovie/mcp";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import { parseReference } from "../../../../packages/mcp/src/internal/parseReference";
import type { AutoMovieReferenceResult } from "../../../../packages/mcp/src/structures/AutoMovieReferenceResult";
import type { IAutoMovieReferenceFileIndex } from "../../../../packages/mcp/src/structures/IAutoMovieReferenceFileIndex";

/**
 * Snapshot metadata cannot drift when an injected reader reuses mutable byte storage.
 *
 * Scenarios:
 * 1. Mutation during asynchronous syntax loading leaves decoded source and its
 *    digest tied to the bytes observed before that boundary.
 * 2. A layer reader reusing one buffer retains each file's original title/revision.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual private parser with a syntax callback that mutates its source buffer, checking that decoded A, SHA-256(A) and one-byte extent were captured before mutation to B. A provider then reads two files through one reused buffer and must preserve separate A/B titles and revisions.
 * @evidence contracts/testing.md#independent-expectations Literal A/B characters, one-byte count and Node crypto hashes of authored A and # A/# B text establish independent snapshots rather than copied parser output. The empty parser constructor assertion supplies only the end capability needed for an empty AST; that first case proves capture timing, not real Markdown/HTML syntax correctness.
 * @evidence contracts/testing.md#distinguishing-cases Keeps mutation at the asynchronous syntax boundary and sequential buffer reuse across layer reads, distinguishing source decode/hash timing from provider-owned byte copies. Real syntax/comment/navigation semantics and stale continuation decisions belong to adjacent units; no arbitrary concurrent buffer-write safety is claimed.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous test_reference_snapshot owns two portable groups through the actual source parser and resident injected reader. The first case supplies the existing empty syntax seam, while the second uses current real parsers; no filesystem, process, MCP server, browser or renderer starts.
 */
export async function test_reference_snapshot(): Promise<void> {
  const bytes: Buffer = Buffer.from("A");
  const originalDigest: string = createHash("sha256").update("A").digest("hex");
  const emptyParser: Awaited<ReturnType<NonNullable<Parameters<typeof parseReference>[2]>>>["Parser"] = class {
    end(): void {}
  } as unknown as Awaited<
    ReturnType<NonNullable<Parameters<typeof parseReference>[2]>>
  >["Parser"];
  const parsed: Awaited<ReturnType<typeof parseReference>> = await parseReference("docs/settings/a.md", bytes, async (): ReturnType<NonNullable<Parameters<typeof parseReference>[2]>> => {
    bytes[0] = 66;
    return { tree: { type: "root", children: [] }, Parser: emptyParser };
  });
  TestValidator.equals("mutation happened", bytes.toString(), "B");
  TestValidator.equals("source snapshot", parsed.source, "A");
  TestValidator.equals("digest snapshot", parsed.revision, originalDigest);
  TestValidator.equals("byte count snapshot", parsed.sourceBytes, 1);
  const shared: Buffer = Buffer.from("# A\n");
  const provider: ReturnType<typeof createAutoMovieReferenceProvider> = createAutoMovieReferenceProvider({
    list: async (): Promise<readonly string[]> => ["docs/settings/a.md", "docs/settings/b.md"],
    read: async (file: string): Promise<Uint8Array> => {
      shared[2] = file.endsWith("/a.md") ? 65 : 66;
      return shared;
    },
  });
  const result: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_layer",
    layer: "settings",
  });
  if (!result.ok || !("files" in result.data))
    throw new Error("Expected a layer.");
  TestValidator.equals(
    "per-read source titles",
    result.data.files.map((file: IAutoMovieReferenceFileIndex): string | null => file.title),
    ["A", "B"],
  );
  TestValidator.equals(
    "per-read byte revisions",
    result.data.files.map((file: IAutoMovieReferenceFileIndex): string => file.revision),
    ["# A\n", "# B\n"].map((source: string): string =>
      createHash("sha256").update(source).digest("hex"),
    ),
  );
}
