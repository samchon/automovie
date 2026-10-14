import {
  createAutoMovieReferenceProvider,
  createAutoMovieReferenceReader,
} from "@automovie/mcp";
import { TestValidator } from "@nestia/e2e";
import * as path from "node:path";
import type { AutoMovieReferenceResult } from "../../../../packages/mcp/src/structures/AutoMovieReferenceResult";

import { createReferenceMemoryFileSystem } from "../internal/createReferenceMemoryFileSystem";

type MemoryObservations = ReturnType<typeof createReferenceMemoryFileSystem>;

/**
 * Enumeration distinguishes empty layers from failed physical observations.
 *
 * Scenarios:
 * 1. Hidden entries and non-Markdown files do not enter the authored inventory.
 * 2. Missing layers succeed empty while permission, file absence and replaced paths fail.
 * 3. Linked entries, malformed names, deep traversal and oversized files refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs actual reader listing and provider reads over supplied observations, asserting that only visible Markdown enters inventory, an initially missing layer is empty and a missing exact file refuses. Five native error codes, linked/special entries, oversized metadata, invalid enumerated name and depth 33 have literal refusal classifications.
 * @evidence contracts/testing.md#independent-expectations Authored .gitkeep/note.txt/nested/a.md population independently defines the sole expected Markdown path, while trace absence confirms hidden inspection is skipped. Explicit native codes, 8 MiB+1 metadata, bad:name.md and thirty-three nested descents define boundary expectations independently of reader output; real OS path behavior is not certified.
 * @evidence contracts/testing.md#distinguishing-cases Preserves admitted nested empty directory/non-Markdown file, initially absent research layer, absent exact file, EACCES/EPERM/ELOOP/ENOTDIR/unknown failures, link/other entries, oversized source, invalid component and traversal overflow. Mid-walk/root loss and exact 10000 population admission have inventory-policy tests; read identity races and Windows differences have separate units.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous test_reference_physical_listing owns three portable scenario groups through the existing memory observation port and maintained reader/provider. Hook mutations affect supplied observations only; no OS filesystem path, process, server, browser or renderer is started.
 */
export async function test_reference_physical_listing(): Promise<void> {
  const memory: MemoryObservations = createReferenceMemoryFileSystem();
  const layer: string = path.join(memory.root, "docs/settings");
  memory.state.listings.set(layer, [".gitkeep", "note.txt", "nested", "a.md"]);
  memory.state.entries.set(path.join(layer, "note.txt"), memory.regular);
  memory.state.entries.set(path.join(layer, "nested"), memory.directory);
  memory.state.listings.set(path.join(layer, "nested"), []);
  const reader: Awaited<ReturnType<typeof createAutoMovieReferenceReader>> = await createAutoMovieReferenceReader(memory.root, memory.io);
  TestValidator.equals("visible Markdown only", await reader.list("settings"), [
    memory.file,
  ]);
  TestValidator.equals("missing population", await reader.list("research"), []);
  TestValidator.predicate(
    "hidden bytes untouched",
    !memory.state.trace.some((item: MemoryObservations["state"]["trace"][number]): boolean => item.location.includes(".gitkeep")),
  );
  const provider: ReturnType<typeof createAutoMovieReferenceProvider> = createAutoMovieReferenceProvider(reader);
  const missing: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_file",
    file: "docs/settings/missing.md",
  });
  TestValidator.equals(
    "missing exact file",
    missing.ok ? "success" : missing.error.code,
    "MISSING_FILE",
  );
  for (const code of ["EACCES", "EPERM", "ELOOP", "ENOTDIR", "UNKNOWN"]) {
    memory.state.hook = (operation: string): void => {
      if (operation === "lstat")
        throw Object.assign(new Error("private"), { code });
    };
    const result: AutoMovieReferenceResult = await provider({
      operation: "get_index_of_layer",
      layer: "settings",
    });
    TestValidator.equals(
      `classified ${code}`,
      result.ok ? "success" : result.error.code,
      code === "EACCES" || code === "EPERM"
        ? "PERMISSION_DENIED"
        : code === "ELOOP" || code === "ENOTDIR"
          ? "PATH_IDENTITY_CHANGED"
          : "IO_ERROR",
    );
  }
  memory.state.hook = (): void => undefined;
  for (const kind of ["link", "other"] as const) {
    memory.state.entries.set(memory.absolute, { ...memory.regular, kind });
    const result: AutoMovieReferenceResult = await provider({
      operation: "get_index_of_layer",
      layer: "settings",
    });
    TestValidator.equals(
      "linked listing",
      result.ok ? "success" : result.error.code,
      "PATH_IDENTITY_CHANGED",
    );
  }
  memory.state.entries.set(memory.absolute, {
    ...memory.regular,
    size: 8_388_609n,
  });
  const large: AutoMovieReferenceResult = await provider({
    operation: "read_file_without_annotations",
    file: memory.file,
  });
  TestValidator.equals(
    "size metadata bound",
    large.ok ? "success" : large.error.code,
    "RESOURCE_LIMIT",
  );
  memory.state.listings.set(layer, ["bad:name.md"]);
  const invalid: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_layer",
    layer: "settings",
  });
  TestValidator.equals(
    "invalid enumerated path",
    invalid.ok ? "success" : invalid.error.code,
    "INVALID_PATH",
  );
  memory.state.listings.set(layer, ["level"]);
  let nested: string = layer;
  for (let depth: number = 1; depth <= 33; ++depth) {
    nested = path.join(nested, "level");
    memory.state.entries.set(nested, memory.directory);
    memory.state.listings.set(nested, ["level"]);
  }
  const deep: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_layer",
    layer: "settings",
  });
  TestValidator.equals(
    "depth bound",
    deep.ok ? "success" : deep.error.code,
    "RESOURCE_LIMIT",
  );
}
