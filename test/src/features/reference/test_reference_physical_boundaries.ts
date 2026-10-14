import {
  createAutoMovieReferenceProvider,
  createAutoMovieReferenceReader,
} from "@automovie/mcp";
import { TestValidator } from "@nestia/e2e";
import * as path from "node:path";
import { parseReference } from "../../../../packages/mcp/src/internal/parseReference";
import { ReferenceError } from "../../../../packages/mcp/src/internal/ReferenceError";
import type { AutoMovieReferenceResult } from "../../../../packages/mcp/src/structures/AutoMovieReferenceResult";

import { createReferenceMemoryFileSystem } from "../internal/createReferenceMemoryFileSystem";
type MemoryObservations = ReturnType<typeof createReferenceMemoryFileSystem>;

/**
 * Startup and resource boundary refusals preserve source isolation.
 *
 * Scenarios:
 * 1. Relative roots, linked root ancestry and startup identity changes refuse.
 * 2. Metadata, handle and post-read size/link changes never return bytes.
 * 3. Injected parser failure is classified without echoing parser diagnostics.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs actual reader binding/read admission and parser refusal boundaries over existing supplied observations. Six startup mutations and seven read mutations return exact categories, while rejected Markdown syntax and throwing HTML constructor produce PARSER_ERROR without the arranged private diagnostics.
 * @evidence contracts/testing.md#independent-expectations Explicit relative/linked/aliased/replaced roots and metadata/byte mutations define INVALID_ROOT, PATH_IDENTITY_CHANGED and RESOURCE_LIMIT independently of output. Literal 8 MiB+1 crosses the resource ceiling; original parser failure text defines what must not escape, with constructor assertion representing only the existing throwing syntax seam rather than a working HTML parser.
 * @evidence contracts/testing.md#distinguishing-cases Keeps relative root, root/parent link and alias, startup inode replacement, oversized returned/opened/later bytes, later link/ctime change, ancestor/root aliases and both syntax stages failing. Normal reads, cleanup attempts, Windows differences and complete inventory decisions belong to adjacent reference units; real hostile namespace control is not simulated or certified.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous test_reference_physical_boundaries owns three portable groups through memory observation capabilities and direct actual parser imports. Hooks arrange deterministic boundaries without opening an OS path; injected syntax failures launch no process, server, browser or renderer, and no execution result is inferred from filenames.
 */
export async function test_reference_physical_boundaries(): Promise<void> {
  for (const mutation of [
    "relative",
    "root-link",
    "root-alias",
    "parent-link",
    "parent-alias",
    "startup-change",
  ] as const) {
    const memory: MemoryObservations = createReferenceMemoryFileSystem();
    if (mutation === "root-link")
      memory.state.entries.set(memory.root, {
        ...memory.directory,
        kind: "link",
      });
    if (mutation === "root-alias")
      memory.state.aliases.set(
        memory.root,
        path.join(memory.root, "elsewhere"),
      );
    if (mutation === "parent-link")
      memory.state.entries.set(path.dirname(memory.root), {
        ...memory.directory,
        kind: "link",
      });
    if (mutation === "parent-alias")
      memory.state.aliases.set(
        path.dirname(memory.root),
        path.join(memory.root, "elsewhere"),
      );
    let roots: number = 0;
    if (mutation === "startup-change")
      memory.state.hook = (operation: string, location: string): void => {
        if (operation === "lstat" && location === memory.root && ++roots === 2)
          memory.state.entries.set(memory.root, {
            ...memory.directory,
            inode: 3n,
          });
      };
    let code: string = "success";
    try {
      await createAutoMovieReferenceReader(
        mutation === "relative" ? "relative" : memory.root,
        memory.io,
      );
    } catch (error) {
      if (!(error instanceof ReferenceError)) throw error;
      code = error.code;
    }
    TestValidator.equals(
      `startup ${mutation}`,
      code,
      mutation === "relative" ? "INVALID_ROOT" : "PATH_IDENTITY_CHANGED",
    );
  }
  for (const mutation of [
    "oversized-bytes",
    "opened-size",
    "after-size",
    "after-links",
    "changed-time",
    "ancestor-alias",
    "root-alias-after-bind",
  ] as const) {
    const memory: MemoryObservations = createReferenceMemoryFileSystem();
    const reader: Awaited<ReturnType<typeof createAutoMovieReferenceReader>> = await createAutoMovieReferenceReader(memory.root, memory.io);
    if (mutation === "opened-size") memory.state.handle.size = 8_388_609n;
    if (mutation === "root-alias-after-bind")
      memory.state.aliases.set(
        memory.root,
        path.join(memory.root, "elsewhere"),
      );
    memory.state.hook = (operation: string): void => {
      if (operation !== "read") return;
      if (mutation === "oversized-bytes")
        memory.state.bytes = new Uint8Array(8_388_609);
      if (mutation === "after-size") memory.state.handle.size = 8_388_609n;
      if (mutation === "after-links") memory.state.handle.links = 2n;
      if (mutation === "changed-time") memory.state.handle.changed = 1n;
      if (mutation === "ancestor-alias")
        memory.state.aliases.set(
          path.join(memory.root, "docs"),
          path.join(memory.root, "other"),
        );
    };
    const result: AutoMovieReferenceResult = await createAutoMovieReferenceProvider(reader)({
      operation: "get_index_of_file",
      file: memory.file,
    });
    TestValidator.equals(
      `read boundary ${mutation}`,
      result.ok ? "success" : result.error.code,
      ["oversized-bytes", "opened-size", "after-size"].includes(mutation)
        ? "RESOURCE_LIMIT"
        : "PATH_IDENTITY_CHANGED",
    );
  }
  let parserCode: string = "success";
  try {
    await parseReference(
      "docs/settings/a.md",
      Buffer.from("plain"),
      async (): ReturnType<NonNullable<Parameters<typeof parseReference>[2]>> => {
        throw new Error("private parser data");
      },
    );
  } catch (error) {
    if (!(error instanceof ReferenceError)) throw error;
    parserCode = error.code;
    TestValidator.predicate(
      "parser message sanitized",
      !error.message.includes("private"),
    );
  }
  TestValidator.equals("parser failure", parserCode, "PARSER_ERROR");
  const failedHtmlParser: Awaited<ReturnType<NonNullable<Parameters<typeof parseReference>[2]>>>["Parser"] = class {
    constructor() {
      throw new Error("private HTML diagnostic");
    }
  } as unknown as Awaited<
    ReturnType<NonNullable<Parameters<typeof parseReference>[2]>>
  >["Parser"];
  let htmlCode: string = "success";
  try {
    await parseReference(
      "docs/settings/a.md",
      Buffer.from("plain"),
      async (): ReturnType<NonNullable<Parameters<typeof parseReference>[2]>> => ({
        tree: { type: "root", children: [] },
        Parser: failedHtmlParser,
      }),
    );
  } catch (error) {
    if (!(error instanceof ReferenceError)) throw error;
    htmlCode = error.code;
    TestValidator.predicate(
      "HTML failure sanitized",
      !error.message.includes("private"),
    );
  }
  TestValidator.equals("HTML parser failure", htmlCode, "PARSER_ERROR");
}
