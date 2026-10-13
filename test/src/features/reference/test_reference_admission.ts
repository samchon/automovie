import { createAutoMovieReferenceProvider } from "../../../../packages/mcp/src/createAutoMovieReferenceProvider";
import { parseAutoMovieReferenceRequest } from "../../../../packages/mcp/src/parseAutoMovieReferenceRequest";
import type { AutoMovieReferenceResult } from "../../../../packages/mcp/src/structures/AutoMovieReferenceResult";
import { TestValidator } from "@nestia/e2e";

/**
 * Only canonical authored Markdown requests reach the read capability.
 *
 * Scenarios:
 * 1. The thirteen independently named authored layers are admitted.
 * 2. Traversal, aliases, reserved names, forbidden populations and extensions refuse.
 * 3. Schema, location and budget boundaries fail before any read operation.
 * 4. Windows superscript device aliases refuse while ordinary Unicode names admit.
 *
 * @evidence contracts/testing.md#behavioral-verification The real provider and request parser receive allowed and refused identities; an injected read capability counts whether path and schema refusals reach source access.
 * @evidence contracts/testing.md#independent-expectations Expected layer names, refusal categories and numeric schema endpoints are independently stated; superscript reserved names are literal identities rather than generated from the implementation regex.
 * @evidence contracts/testing.md#distinguishing-cases Cases span all authored layers, forbidden path components, Windows aliases, malformed locations, unknown operations and inclusive numeric endpoints; physical-path races belong to reader tests.
 * @evidence contracts/testing.md#execution-ownership This portable asynchronous unit entry exercises the provider's injected read/list port without launching processes, opening native files or starting an MCP server.
 */
export async function test_reference_admission(): Promise<void> {
  let reads: number = 0;
  const provider: ReturnType<typeof createAutoMovieReferenceProvider> = createAutoMovieReferenceProvider({
    read: async (): Promise<Uint8Array> => {
      ++reads;
      return new Uint8Array();
    },
    list: async (): Promise<readonly string[]> => [],
  });
  for (const layer of ["briefs", "instances", "maps", "materials", "models", "motions", "research", "screenplays", "scripts", "settings", "spaces", "systems", "treatments"]) {
    const result: AutoMovieReferenceResult = await provider({ operation: "get_index_of_layer", layer });
    TestValidator.predicate(`layer ${layer}`, result.ok);
  }
  for (const file of [
    "/docs/settings/a.md",
    "../docs/settings/a.md",
    "docs/settings/../a.md",
    "docs/settings/./a.md",
    "docs/settings//a.md",
    "docs\\settings\\a.md",
    "C:/docs/settings/a.md",
    "//server/docs/settings/a.md",
    "docs/settings/a.md:stream",
    "docs/settings/a.ts",
    "docs/accounts/a.md",
    "docs/contracts/a.md",
    "docs/language/a.md",
    ".env",
    ".wiki/a.md",
    "docs/settings/.secret.md",
    "docs/settings/CON.md",
    "docs/settings/NUL.txt/a.md",
    "docs/settings/name. /a.md",
    "docs/settings/a\u0000.md",
    "docs/settings/a?.md",
    "docs/settings/a#x.md",
    'docs/settings/a"x.md',
    "docs/settings/com¹.md",
    "docs/settings/COM².md",
    "docs/settings/COM³.md",
    "docs/settings/LPT¹.md",
    "docs/settings/LPT².md",
    "docs/settings/LPT³.md",
  ]) {
    const result: AutoMovieReferenceResult = await provider({ operation: "get_index_of_file", file });
    TestValidator.equals(
      `path ${JSON.stringify(file)}`,
      result.ok ? "success" : result.error.code,
      "INVALID_PATH",
    );
  }
  for (const location of [
    "docs/settings/a.md",
    "#anchor",
    "docs/settings/a.md#",
    "docs/settings/a.md#a#b",
  ]) {
    const result: AutoMovieReferenceResult = await provider({
      operation: "read_section_without_annotations",
      location,
    });
    TestValidator.equals(
      `location ${location}`,
      result.ok ? "success" : result.error.code,
      "INVALID_LOCATION",
    );
  }
  TestValidator.equals("refusals do not read", reads, 0);
  for (const input of [
    {},
    { operation: "get_index_of_layer", layer: "accounts" },
    { operation: "get_index_of_layer", layer: "settings", limit: 0 },
  ]) {
    const result: AutoMovieReferenceResult = await provider(input);
    TestValidator.equals(
      "request failure classification",
      result.ok ? "success" : result.error.code,
      "layer" in input && input.layer === "accounts"
        ? "INVALID_LAYER"
        : "INVALID_REQUEST",
    );
  }
  for (const input of [
    null,
    {},
    { operation: "compile" },
    { operation: "get_index_of_layer", layer: "accounts" },
    { operation: "get_index_of_file", file: "a", root: "other" },
    { operation: "get_index_of_layer", layer: "settings", limit: 0 },
    { operation: "get_index_of_layer", layer: "settings", limit: 101 },
    { operation: "get_index_of_file", file: "a", budgetBytes: 255 },
    { operation: "get_index_of_file", file: "a", budgetBytes: 1_048_577 },
    { operation: "get_index_of_file", file: "a", budgetBytes: 256.5 },
    {
      operation: "read_file_without_annotations",
      file: "a",
      expectedDigest: "old",
    },
    {
      operation: "get_index_of_layer",
      layer: "settings",
      continuation: { revision: "0".repeat(64), offset: 0 },
    },
  ]) {
    TestValidator.equals(
      "invalid schema",
      parseAutoMovieReferenceRequest(input),
      null,
    );
  }
  for (const budgetBytes of [256, 1_048_576])
    TestValidator.equals(
      "budget endpoint admitted",
      parseAutoMovieReferenceRequest({
        operation: "get_index_of_file",
        file: "a",
        budgetBytes,
      })?.budgetBytes,
      budgetBytes,
    );
  TestValidator.equals(
    "default budget",
    parseAutoMovieReferenceRequest({
      operation: "get_index_of_file",
      file: "a",
    })?.budgetBytes,
    65_536,
  );
  for (const limit of [1, 100])
    TestValidator.predicate(
      "page endpoint admitted",
      parseAutoMovieReferenceRequest({
        operation: "get_index_of_layer",
        layer: "settings",
        limit,
      }) !== null,
    );
  const allowed: AutoMovieReferenceResult = await provider({
    operation: "get_index_of_file",
    file: "docs/settings/한글 space.md",
  });
  TestValidator.predicate("Unicode and spaces allowed", allowed.ok);
  TestValidator.equals("allowed read happens once", reads, 1);
}
