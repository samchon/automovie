import { createAutoMovieReferenceProvider } from "@automovie/mcp";
import { TestValidator } from "@nestia/e2e";
import type { AutoMovieReferenceResult } from "../../../../packages/mcp/src/structures/AutoMovieReferenceResult";

/**
 * Budgets count serialized UTF-8 bytes and refuse oversized complete results.
 *
 * Scenarios:
 * 1. Exact result budgets succeed and one byte less returns BUDGET_EXCEEDED.
 * 2. Oversized source and inventory limits refuse before parsing the population.
 * 3. Large annotations do not inflate the default per-comment metadata surface.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes actual file-index/read and layer operations, measuring a complete successful UTF-8 envelope then checking that exact budget accepts and one byte less refuses. Oversized individual source, inventory and aggregate source populations return RESOURCE_LIMIT, and default serialized output omits annotationRanges.
 * @evidence contracts/testing.md#independent-expectations Buffer.byteLength over the serialized success independently measures the provider's declared byte unit, including Korean and emoji; exact-result comparison is supplementary same-provider parity, not an independent content oracle. Authored 8 MiB+1, 10001 paths and five 8 MiB sources cross literal resource ceilings; only refusal codes, not absence of every payload field, are asserted.
 * @evidence contracts/testing.md#distinguishing-cases Retains index and full-file budget endpoints, per-file source rejection through both direct and layer paths, inventory overflow and aggregate overflow, with thirty comments testing compact default metadata. Detailed ranges, layer continuation, exact maximum inventory admission and successful 32 MiB aggregate boundary are owned elsewhere or unclaimed here.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous test_reference_budgets owns three portable scenario groups through injected resident read/list capabilities and current parser dependencies. Arrays and byte buffers stay invocation-local; no physical file, process, MCP server, browser or renderer starts.
 */
export async function test_reference_budgets(): Promise<void> {
  const file: string = "docs/research/source.md";
  let bytes: Uint8Array = Buffer.from(
    "## Source {#source}\n한글😀\n" + "<!-- note -->\n".repeat(30),
  );
  let paths: string[] = [file];
  const provider: ReturnType<typeof createAutoMovieReferenceProvider> = createAutoMovieReferenceProvider({
    read: async (): Promise<Uint8Array> => bytes,
    list: async (): Promise<readonly string[]> => paths,
  });
  for (const operation of [
    "get_index_of_file",
    "read_file_without_annotations",
  ] as const) {
    const result: AutoMovieReferenceResult = await provider({ operation, file });
    if (!result.ok) throw new Error("Expected normal result.");
    const budgetBytes: number = Buffer.byteLength(JSON.stringify(result));
    TestValidator.predicate("budget above minimum", budgetBytes >= 256);
    TestValidator.equals(
      "exact budget",
      await provider({ operation, file, budgetBytes }),
      result,
    );
    const less: AutoMovieReferenceResult = await provider({
      operation,
      file,
      budgetBytes: budgetBytes - 1,
    });
    TestValidator.equals(
      "one byte short",
      less.ok ? "success" : less.error.code,
      "BUDGET_EXCEEDED",
    );
    TestValidator.predicate(
      "default metadata excludes annotation ranges",
      !JSON.stringify(result).includes("annotationRanges"),
    );
  }
  bytes = new Uint8Array(8_388_609);
  const large: AutoMovieReferenceResult = await provider({ operation: "get_index_of_file", file });
  TestValidator.equals(
    "source bound",
    large.ok ? "success" : large.error.code,
    "RESOURCE_LIMIT",
  );
  const layerSource: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_layer",
    layer: "research",
  });
  TestValidator.equals(
    "layer individual source bound",
    layerSource.ok ? "success" : layerSource.error.code,
    "RESOURCE_LIMIT",
  );
  paths = Array.from({ length: 10_001 }, (_: unknown, i: number): string => `docs/research/${i}.md`);
  const inventory: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_layer",
    layer: "research",
  });
  TestValidator.equals(
    "inventory bound",
    inventory.ok ? "success" : inventory.error.code,
    "RESOURCE_LIMIT",
  );
  paths = Array.from({ length: 5 }, (_: unknown, i: number): string => `docs/research/${i}.md`);
  bytes = new Uint8Array(8_388_608);
  const total: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_layer",
    layer: "research",
  });
  TestValidator.equals(
    "aggregate bound",
    total.ok ? "success" : total.error.code,
    "RESOURCE_LIMIT",
  );
}
