import { createAutoMovieReferenceProvider } from "@automovie/mcp";
import { TestValidator } from "@nestia/e2e";
import type { AutoMovieReferenceResult } from "../../../../packages/mcp/src/structures/AutoMovieReferenceResult";
import type { IAutoMovieReferenceFileIndex } from "../../../../packages/mcp/src/structures/IAutoMovieReferenceFileIndex";

/**
 * Layer pages have deterministic order and cannot combine different revisions.
 *
 * Scenarios:
 * 1. Explicit and default pages return bounded sorted file indices with continuation.
 * 2. Source edits, out-of-range continuations and duplicate identities refuse.
 * 3. A smaller budget reduces a page or fails explicitly without truncating a file.
 *
 * @evidence contracts/testing.md#behavioral-verification Requests actual layer pages and asserts sorted complete file indices, total/offset/non-atomic disclosure, continuation completion and budget-selected page parity. Wrong offsets, stale source revision, duplicate/mismatched inventory and an empty population have distinct expected outcomes.
 * @evidence contracts/testing.md#independent-expectations The unsorted literal b/a/c inventory independently yields a then b/c, total three and offsets one/four. Serialized UTF-8 size of the first one-file response supplies a boundary measurement; equality with that same provider response checks page-selection consistency rather than independently validating its content/digest calculation.
 * @evidence contracts/testing.md#distinguishing-cases Keeps explicit first limit, default continuation, exact one-file budget and one byte short, out-of-range offset, edited source, duplicate and wrong-layer identities, plus empty completion. Larger limit endpoints and input/resource ceilings belong to admission/budget units; atomic cross-file snapshots are explicitly not promised.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous test_reference_pagination owns three portable groups using one provider with resident mutable path/text capabilities. Current bytes are reread through the injected port and no physical file, process, MCP server, browser or renderer starts.
 */
export async function test_reference_pagination(): Promise<void> {
  let paths: string[] = [
    "docs/treatments/b.md",
    "docs/treatments/a.md",
    "docs/treatments/c.md",
  ];
  let suffix: string = "";
  const provider: ReturnType<typeof createAutoMovieReferenceProvider> = createAutoMovieReferenceProvider({
    read: async (file: string): Promise<Uint8Array> => Buffer.from(`# ${file}\n${suffix}`),
    list: async (): Promise<readonly string[]> => paths,
  });
  const first: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_layer",
    layer: "treatments",
    limit: 1,
  });
  if (!first.ok || !("files" in first.data) || first.data.continuation === null)
    throw new Error("Expected a partial page.");
  TestValidator.equals(
    "stable order",
    first.data.files.map((item: IAutoMovieReferenceFileIndex): string => item.file),
    ["docs/treatments/a.md"],
  );
  TestValidator.equals(
    "partial disclosed",
    {
      total: first.data.total,
      offset: first.data.continuation.offset,
      atomic: first.data.atomic,
    },
    { total: 3, offset: 1, atomic: false },
  );
  const next: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_layer",
    layer: "treatments",
    continuation: first.data.continuation,
  });
  if (!next.ok || !("files" in next.data))
    throw new Error("Expected next page.");
  TestValidator.equals(
    "remaining order",
    next.data.files.map((item: IAutoMovieReferenceFileIndex): string => item.file),
    ["docs/treatments/b.md", "docs/treatments/c.md"],
  );
  TestValidator.equals("complete disclosed", next.data.continuation, null);
  const oneBudget: number = Buffer.byteLength(JSON.stringify(first));
  const bounded: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_layer",
    layer: "treatments",
    budgetBytes: oneBudget,
  });
  TestValidator.equals("budget selects whole file", bounded, first);
  const tooSmall: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_layer",
    layer: "treatments",
    budgetBytes: oneBudget - 1,
  });
  TestValidator.equals(
    "minimum item cannot fit",
    tooSmall.ok ? "success" : tooSmall.error.code,
    "BUDGET_EXCEEDED",
  );
  const outside: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_layer",
    layer: "treatments",
    continuation: { revision: first.data.revision, offset: 4 },
  });
  TestValidator.equals(
    "invalid offset",
    outside.ok ? "success" : outside.error.code,
    "INVALID_CONTINUATION",
  );
  suffix = "changed";
  const stale: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_layer",
    layer: "treatments",
    continuation: first.data.continuation,
  });
  TestValidator.equals(
    "source-bound pages",
    stale.ok ? "success" : stale.error.code,
    "STALE_REFERENCE",
  );
  paths = ["docs/treatments/a.md", "docs/treatments/a.md"];
  const duplicate: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_layer",
    layer: "treatments",
  });
  TestValidator.equals(
    "duplicate identity",
    duplicate.ok ? "success" : duplicate.error.code,
    "PATH_IDENTITY_CHANGED",
  );
  paths = ["docs/settings/a.md"];
  const mismatched: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_layer",
    layer: "treatments",
  });
  TestValidator.equals(
    "wrong population",
    mismatched.ok ? "success" : mismatched.error.code,
    "PATH_IDENTITY_CHANGED",
  );
  paths = [];
  const empty: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_layer",
    layer: "treatments",
  });
  if (!empty.ok || !("files" in empty.data))
    throw new Error("Expected empty page.");
  TestValidator.equals(
    "empty complete",
    {
      files: empty.data.files,
      total: empty.data.total,
      continuation: empty.data.continuation,
    },
    { files: [], total: 0, continuation: null },
  );
}
