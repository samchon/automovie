import { createAutoMovieReferenceProvider } from "@automovie/mcp";
import { TestValidator } from "@nestia/e2e";
import type { AutoMovieReferenceResult } from "../../../../packages/mcp/src/structures/AutoMovieReferenceResult";
import type { IAutoMovieReferenceContent } from "../../../../packages/mcp/src/structures/IAutoMovieReferenceContent";

/**
 * A source revision and annotation projection always describe the same bytes.
 *
 * Scenarios:
 * 1. Unclosed annotation content is omitted and only its location is diagnosed.
 * 2. Invalid UTF-8 refuses rather than silently replacing bytes.
 * 3. A same-source digest succeeds, but an edited file rejects the old digest.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes actual provider parsing/projection and stale admission, asserting omission of an unterminated comment through EOF, its diagnostic code and no arranged secret, same-revision section success, edited-source stale refusal, fatal UTF-8 refusal and sanitized unexpected read failure.
 * @evidence contracts/testing.md#independent-expectations Authored visible prefix and UNTERMINATED_ANNOTATION/STALE_REFERENCE/INVALID_UTF8/IO_ERROR literals supply independent expectations. Bytes C3 28 cannot encode UTF-8; retaining the provider's first revision tests same-versus-changed binding rather than independently validating SHA-256, and secret substring checks cover only the arranged text.
 * @evidence contracts/testing.md#distinguishing-cases Keeps incomplete annotation with a hidden heading lookalike, same-digest positive section read, changed bytes with old digest, invalid encoding and an ordinary external read Error. Closed/contextual comments, exact source coordinates and physical identity races are owned by neighboring units.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous test_reference_source_refusals owns three portable scenario groups plus the existing unexpected-I/O case through injected resident/failing read ports. No physical file, process, MCP server, browser or renderer starts; output sanitization is product behavior and no prose grading occurs.
 */
export async function test_reference_source_refusals(): Promise<void> {
  const file: string = "docs/settings/place.md";
  let bytes: Uint8Array = Buffer.from(
    "## Place {#place}\nvisible\n\n<!-- secret\n## fake {#fake}",
  );
  const provider: ReturnType<typeof createAutoMovieReferenceProvider> = createAutoMovieReferenceProvider({
    read: async (): Promise<Uint8Array> => bytes,
    list: async (): Promise<readonly string[]> => [file],
  });
  const result: AutoMovieReferenceResult = await provider({
    operation: "read_file_without_annotations",
    file,
    detail: true,
  });
  if (!result.ok || !("content" in result.data))
    throw new Error("Expected content.");
  TestValidator.equals(
    "omit through EOF",
    result.data.content,
    "## Place {#place}\nvisible\n\n",
  );
  TestValidator.equals(
    "diagnostic code",
    result.data.diagnostics.map((item: IAutoMovieReferenceContent["diagnostics"][number]): string => item.code),
    ["UNTERMINATED_ANNOTATION"],
  );
  TestValidator.predicate(
    "annotation not echoed",
    !JSON.stringify(result).includes("secret"),
  );
  const revision: string = result.data.revision;
  const current: AutoMovieReferenceResult = await provider({
    operation: "read_section_without_annotations",
    location: `${file}#place`,
    expectedDigest: revision,
  });
  TestValidator.predicate("same digest", current.ok);
  bytes = Buffer.from("## Place {#place}\nchanged");
  const stale: AutoMovieReferenceResult = await provider({
    operation: "read_file_without_annotations",
    file,
    expectedDigest: revision,
  });
  TestValidator.equals(
    "stale digest",
    stale.ok ? "success" : stale.error.code,
    "STALE_REFERENCE",
  );
  bytes = new Uint8Array([0xc3, 0x28]);
  const invalid: AutoMovieReferenceResult = await provider({ operation: "get_index_of_file", file });
  TestValidator.equals(
    "fatal UTF-8",
    invalid.ok ? "success" : invalid.error.code,
    "INVALID_UTF8",
  );
  const failed: ReturnType<typeof createAutoMovieReferenceProvider> = createAutoMovieReferenceProvider({
    read: async (): Promise<Uint8Array> => {
      throw new Error("sensitive external diagnostic");
    },
    list: async (): Promise<readonly string[]> => [],
  });
  const unexpected: AutoMovieReferenceResult = await failed({ operation: "get_index_of_file", file });
  TestValidator.equals(
    "unexpected IO classified",
    unexpected.ok ? "success" : unexpected.error.code,
    "IO_ERROR",
  );
  TestValidator.predicate(
    "unexpected error sanitized",
    !JSON.stringify(unexpected).includes("sensitive"),
  );
}
