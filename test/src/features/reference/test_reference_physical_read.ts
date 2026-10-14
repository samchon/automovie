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
 * Source bytes are returned only while pathname, ancestry and handle observations agree.
 *
 * Scenarios:
 * 1. A regular single-link file reads and closes its handle.
 * 2. Links, special entries, aliases, substitutions and concurrent writes refuse.
 * 3. Every failure after acquisition attempts close and returns a classified refusal.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual bound reader/provider against supplied pathname/descriptor observations, asserting normal bytes and one close, then nineteen distinct alias/link/identity/version/length/I/O refusals. Trace assertions require close after every acquired handle, while failed open must not close; close rejection itself remains an IO_ERROR.
 * @evidence contracts/testing.md#independent-expectations Explicit identity mutations and authored error positions independently define PATH_IDENTITY_CHANGED versus IO_ERROR. Literal normal bytes and close count one establish success; observed open/close traces locate cleanup obligations, but these modeled ports and secret substring checks cannot prove physical descriptor release or hostile namespace exclusion.
 * @evidence contracts/testing.md#distinguishing-cases Preserves symlink/hardlink/special/directory, pre-read alias, opened inode/device/size/kind, ancestor/root replacement, write-time metadata, resident replacement, short byte population, post-read alias/ancestor and open/read/close errors. Windows-specific path-versus-handle comparison and inventory/resource boundaries belong to separate reference units.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous test_reference_physical_read owns three portable groups through the existing in-memory observation capability, actual reader admission and provider. Each refusal gets a fresh arrangement; no OS path, process, MCP server, browser or renderer is opened, and cleanup assertions count attempted calls rather than release after a rejected close.
 */
export async function test_reference_physical_read(): Promise<void> {
  const original: MemoryObservations = createReferenceMemoryFileSystem();
  const reader: Awaited<ReturnType<typeof createAutoMovieReferenceReader>> = await createAutoMovieReferenceReader(
    original.root,
    original.io,
  );
  TestValidator.equals(
    "normal bytes",
    await reader.read(original.file),
    original.state.bytes,
  );
  TestValidator.equals(
    "normal close",
    original.state.trace.filter((item: MemoryObservations["state"]["trace"][number]): boolean => item.operation === "close").length,
    1,
  );
  for (const mutation of [
    "symlink",
    "hardlink",
    "special",
    "directory",
    "alias",
    "opened-inode",
    "opened-device",
    "opened-size-small",
    "opened-kind",
    "ancestor",
    "root",
    "during-write",
    "resident",
    "length",
    "post-alias",
    "post-ancestor",
    "open-error",
    "read-error",
    "close-error",
  ] as const) {
    const memory: MemoryObservations = createReferenceMemoryFileSystem();
    const bound: Awaited<ReturnType<typeof createAutoMovieReferenceReader>> = await createAutoMovieReferenceReader(memory.root, memory.io);
    const { state, absolute, root }: Pick<MemoryObservations, "state" | "absolute" | "root"> = memory;
    if (mutation === "symlink")
      state.entries.set(absolute, { ...memory.regular, kind: "link" });
    if (mutation === "hardlink")
      state.entries.set(absolute, { ...memory.regular, links: 2n });
    if (mutation === "special")
      state.entries.set(absolute, { ...memory.regular, kind: "other" });
    if (mutation === "directory") state.entries.set(absolute, memory.directory);
    if (mutation === "alias")
      state.aliases.set(absolute, path.join(root, "outside.md"));
    if (mutation === "opened-inode") state.handle.inode = 10n;
    if (mutation === "opened-device") state.handle.device = 10n;
    if (mutation === "opened-size-small") ++state.handle.size;
    if (mutation === "opened-kind") state.handle.kind = "link";
    if (mutation === "ancestor")
      state.entries.set(path.join(root, "docs"), {
        ...memory.directory,
        kind: "link",
      });
    if (mutation === "root")
      state.entries.set(root, { ...memory.directory, inode: 10n });
    state.hook = (operation: string): void => {
      if (operation === "open" && mutation === "open-error")
        throw new Error("private open diagnostic");
      if (operation === "read") {
        if (mutation === "during-write") state.handle.modified = 1n;
        if (mutation === "resident")
          state.entries.set(absolute, { ...memory.regular, inode: 10n });
        if (mutation === "length") state.bytes = new Uint8Array();
        if (mutation === "post-alias")
          state.aliases.set(absolute, path.join(root, "elsewhere.md"));
        if (mutation === "post-ancestor")
          state.entries.set(path.join(root, "docs"), {
            ...memory.directory,
            inode: 10n,
          });
        if (mutation === "read-error")
          throw new Error("private read diagnostic");
      }
      if (operation === "close" && mutation === "close-error")
        throw new Error("private close diagnostic");
    };
    const result: AutoMovieReferenceResult = await createAutoMovieReferenceProvider(bound)({
      operation: "read_file_without_annotations",
      file: memory.file,
    });
    TestValidator.equals(
      `refuse ${mutation}`,
      result.ok ? "success" : result.error.code,
      mutation.endsWith("error") ? "IO_ERROR" : "PATH_IDENTITY_CHANGED",
    );
    TestValidator.predicate(
      "no private diagnostics",
      !JSON.stringify(result).includes("private"),
    );
    const opened: boolean = state.trace.some((item: MemoryObservations["state"]["trace"][number]): boolean => item.operation === "open");
    const closed: boolean = state.trace.some((item: MemoryObservations["state"]["trace"][number]): boolean => item.operation === "close");
    TestValidator.equals(
      `close ${mutation}`,
      closed,
      opened && mutation !== "open-error",
    );
  }
}
