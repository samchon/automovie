import { AutoMovieUtf8Error } from "../../../../packages/production/src/production/AutoMovieUtf8Error";
import { decodeAutoMovieUtf8 } from "../../../../packages/production/src/production/decodeAutoMovieUtf8";
import { TestValidator } from "@nestia/e2e";

/** Observe the actual typed decoder refusal without replacing its category or offset. */
function failure(bytes: readonly number[]): unknown {
  try {
    return decodeAutoMovieUtf8({
      record: "src/shot.ts",
      bytes: new Uint8Array(bytes),
      leadingBom: "strip",
    });
  } catch (error) {
    return error instanceof AutoMovieUtf8Error
      ? [error.code, error.record, error.offset, error.category]
      : error;
  }
}

/**
 * Strict UTF-8 retains scalar text, BOM policy and first-proving-byte refusals after source-owner splitting.
 *
 * Scenarios:
 *
 * 1. Preserve authored scalar text and distinguish initial stripping from an interior BOM.
 * 2. Refuse isolated continuations, truncated/invalid tails, overlong forms, surrogate scalars and out-of-range encodings at their existing offsets.
 * 3. Keep the initial-BOM reject failure in the same public Error identity.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes the actual strict decoder on authored byte sequences and asserts returned text or its Error code/record/offset/category; a permissive or offset-shifting decoder fails these existing cases.
 * @evidence contracts/testing.md#independent-expectations Explicit malformed bytes and their first proving offsets come from UTF-8 leader/continuation and scalar-range rules. Authored text/BOM positions determine exact output; categories retain this API's declared refusal mapping rather than using decoder output as an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Covers valid text, initial/interior BOMs, adjacent malformed leaders/tails and scalar bounds, with truncated variants distinguishing proving offsets. Structured JSON owns downstream syntax/encoding translation and this test certifies no rendering or Unicode normalization.
 * @evidence contracts/testing.md#execution-ownership The named test_production_strict_utf8 entry reaches portable scalar decoding directly from maintained source with no process, browser, installation, GPU or dynamic case driver.
 */
export function test_production_strict_utf8(): void {
  TestValidator.equals(
    "valid scalar text, one leading BOM and an interior BOM are distinct",
    [
      decodeAutoMovieUtf8({
        record: "source",
        bytes: Buffer.from("¢€😀", "utf8"),
        leadingBom: "preserve",
      }),
      decodeAutoMovieUtf8({
        record: "source",
        bytes: Buffer.from("\ufeffx", "utf8"),
        leadingBom: "strip",
      }),
      decodeAutoMovieUtf8({
        record: "source",
        bytes: Buffer.from("x\ufeffy", "utf8"),
        leadingBom: "strip",
      }),
    ],
    ["¢€😀", "x", "x\ufeffy"],
  );
  TestValidator.equals(
    "malformed categories report the deterministic first proving byte",
    [
      failure([0x80]),
      failure([0x81]),
      failure([0xc2]),
      failure([0xc2, 0x41]),
      failure([0xe2, 0x41]),
      failure([0xe2, 0x82]),
      failure([0xc0, 0x80]),
      failure([0xe0, 0x80]),
      failure([0xed, 0xa0, 0x80]),
      failure([0xed, 0xa0]),
      failure([0xf4, 0x90, 0x80, 0x80]),
      failure([0xf4, 0x90]),
      failure([0xf5, 0x80, 0x80, 0x80]),
      failure([0xf0, 0x80, 0x80, 0x80]),
    ],
    [
      ["automovie-invalid-utf8", "src/shot.ts", 0, "isolated-continuation"],
      ["automovie-invalid-utf8", "src/shot.ts", 0, "isolated-continuation"],
      ["automovie-invalid-utf8", "src/shot.ts", 0, "truncated-sequence"],
      ["automovie-invalid-utf8", "src/shot.ts", 1, "invalid-continuation"],
      ["automovie-invalid-utf8", "src/shot.ts", 1, "invalid-continuation"],
      ["automovie-invalid-utf8", "src/shot.ts", 0, "truncated-sequence"],
      ["automovie-invalid-utf8", "src/shot.ts", 0, "overlong-sequence"],
      ["automovie-invalid-utf8", "src/shot.ts", 0, "overlong-sequence"],
      ["automovie-invalid-utf8", "src/shot.ts", 0, "surrogate-scalar"],
      ["automovie-invalid-utf8", "src/shot.ts", 0, "surrogate-scalar"],
      ["automovie-invalid-utf8", "src/shot.ts", 0, "out-of-range-scalar"],
      ["automovie-invalid-utf8", "src/shot.ts", 0, "out-of-range-scalar"],
      ["automovie-invalid-utf8", "src/shot.ts", 0, "invalid-leader"],
      ["automovie-invalid-utf8", "src/shot.ts", 0, "overlong-sequence"],
    ],
  );
  TestValidator.predicate(
    "a JSON-domain BOM refusal remains typed",
    failureWithBom() instanceof AutoMovieUtf8Error,
  );
}

/** Observe the existing initial-BOM reject policy through the product decoder. */
function failureWithBom(): unknown {
  try {
    decodeAutoMovieUtf8({
      record: "record.json",
      bytes: Buffer.from("\ufeff{}", "utf8"),
      leadingBom: "reject",
    });
  } catch (error) {
    return error;
  }
}
