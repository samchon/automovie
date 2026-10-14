import {
  AUTOMOVIE_LEGACY_SOURCE_NORMALIZATION_PROTOCOL,
  AUTOMOVIE_SOURCE_NORMALIZATION_PROTOCOL,
  AutoMovieUtf8Error,
  digestAutoMovieBytes,
  normalizeAutoMovieSource,
  normalizeAutoMovieSourceIdentity,
  verifyAutoMovieSourceIdentity,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

const throwsUtf8: (bytes: Uint8Array) => boolean = (bytes: Uint8Array): boolean => {
  try {
    normalizeAutoMovieSourceIdentity({ path: "src/shot.ts", bytes });
    return false;
  } catch (error) {
    return error instanceof AutoMovieUtf8Error;
  }
};

/**
 * Source identity binds strict decoding and permitted equivalence to a version.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real normalization and versioned verification, comparing raw/semantic digest relationships, exact normalized text, typed UTF-8 refusals and the ordered current/stale/migrated/unverifiable statuses.
 * @evidence contracts/testing.md#independent-expectations Literal normalized strings, booleans and status vectors define the oracle; digests produced by the shared hash wrapper arrange identities, so this does not independently prove SHA-256 vectors.
 * @evidence contracts/testing.md#distinguishing-cases Separates LF from leading BOM/CRLF/CR equivalence, empty and BOM-only inputs, preserved interior BOM and multibyte scalars, four malformed byte sequences, stale current/legacy identities, absent bytes and an unknown protocol.
 * @evidence contracts/testing.md#execution-ownership The synchronous named test operates only on resident byte arrays and actual identity functions. It reads no source file and makes no claim about source behavior, textual quality or Unicode equivalence beyond the asserted BOM/EOL rule.
 */
export function test_production_source_identity_protocol(): void {
  const lf: ReturnType<typeof normalizeAutoMovieSourceIdentity> = normalizeAutoMovieSourceIdentity({
    path: "src/shot.ts",
    bytes: Buffer.from("a\nb\n", "utf8"),
  });
  const bomCrlf: ReturnType<typeof normalizeAutoMovieSourceIdentity> = normalizeAutoMovieSourceIdentity({
    path: "src/shot.ts",
    bytes: Buffer.from("\ufeffa\r\nb\r", "utf8"),
  });
  TestValidator.equals(
    "raw and semantic identities preserve their separate roles",
    [
      lf.protocol,
      lf.rawDigest === bomCrlf.rawDigest,
      lf.semanticDigest === bomCrlf.semanticDigest,
      Buffer.from(bomCrlf.normalized).toString("utf8"),
    ],
    [AUTOMOVIE_SOURCE_NORMALIZATION_PROTOCOL, false, true, "a\nb\n"],
  );
  TestValidator.equals(
    "empty, BOM-only, interior BOM and scalar UTF-8 remain deterministic",
    [
      Buffer.from(normalizeAutoMovieSource(new Uint8Array())).toString("hex"),
      Buffer.from(normalizeAutoMovieSource(Buffer.from("\ufeff"))).toString(
        "hex",
      ),
      Buffer.from(
        normalizeAutoMovieSource(Buffer.from("x\ufeffy¢€😀")),
      ).toString("utf8"),
    ],
    ["", "", "x\ufeffy¢€😀"],
  );
  TestValidator.equals(
    "malformed bytes never obtain semantic identity",
    [
      throwsUtf8(new Uint8Array([0x80])),
      throwsUtf8(new Uint8Array([0x81])),
      throwsUtf8(new Uint8Array([0xe2, 0x82])),
      throwsUtf8(new Uint8Array([0xed, 0xa0, 0x80])),
    ],
    [true, true, true, true],
  );
  const legacyBytes: Uint8Array = Buffer.from("\ufeffa\r\nb\r", "utf8");
  const legacyDigest: string = digestAutoMovieBytes(Buffer.from("a\nb\n", "utf8"));
  TestValidator.equals(
    "current, stale, migrated and unverifiable source states are disjoint",
    [
      verifyAutoMovieSourceIdentity({
        path: "src/shot.ts",
        bytes: legacyBytes,
        protocol: AUTOMOVIE_SOURCE_NORMALIZATION_PROTOCOL,
        digest: bomCrlf.semanticDigest,
      }).status,
      verifyAutoMovieSourceIdentity({
        path: "src/shot.ts",
        bytes: legacyBytes,
        protocol: AUTOMOVIE_SOURCE_NORMALIZATION_PROTOCOL,
        digest: digestAutoMovieBytes(Buffer.from("stale")),
      }).status,
      verifyAutoMovieSourceIdentity({
        path: "src/shot.ts",
        bytes: legacyBytes,
        protocol: AUTOMOVIE_LEGACY_SOURCE_NORMALIZATION_PROTOCOL,
        digest: legacyDigest,
      }).status,
      verifyAutoMovieSourceIdentity({
        path: "src/shot.ts",
        bytes: legacyBytes,
        protocol: AUTOMOVIE_LEGACY_SOURCE_NORMALIZATION_PROTOCOL,
        digest: digestAutoMovieBytes(Buffer.from("stale")),
      }).status,
      verifyAutoMovieSourceIdentity({
        path: "src/shot.ts",
        protocol: AUTOMOVIE_LEGACY_SOURCE_NORMALIZATION_PROTOCOL,
        digest: legacyDigest,
      }).status,
      verifyAutoMovieSourceIdentity({
        path: "src/shot.ts",
        bytes: new Uint8Array([0x80]),
        protocol: AUTOMOVIE_LEGACY_SOURCE_NORMALIZATION_PROTOCOL,
        digest: digestAutoMovieBytes(Buffer.from("\ufffd", "utf8")),
      }).status,
      verifyAutoMovieSourceIdentity({
        path: "src/shot.ts",
        bytes: legacyBytes,
        protocol: "unknown",
        digest: legacyDigest,
      }).status,
    ],
    [
      "current",
      "stale",
      "migrated",
      "stale",
      "unverifiable",
      "unverifiable",
      "unverifiable",
    ],
  );
}
