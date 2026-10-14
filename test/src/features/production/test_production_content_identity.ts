import {
  canonicalAutoMovieJsonBytes,
  canonicalizeAutoMovieJson,
  compareCodeUnits,
  decodeAutoMoviePathSegment,
  digestAutoMovieBytes,
  encodeAutoMoviePathSegment,
  fingerprintAutoMovieFields,
  normalizeAutoMovieSource,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";

const throws: (closure: () => unknown) => boolean = (closure: () => unknown): boolean => {
  try {
    closure();
    return false;
  } catch {
    return true;
  }
};

/**
 * Content identity is canonical, domain-separated and source-EOL stable.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls public canonical JSON/byte, source-normalization, digest, framed-field fingerprint, comparator and path-segment APIs, asserting exact representations, the known SHA-256 of abc, separation when role or kind changes and portable filename round trips/refusal.
 * @evidence contracts/testing.md#independent-expectations Authored canonical strings, BOM/EOL output, the fixed SHA-256 vector, UTF-16 order and RFC/Windows/dot escape spellings supply independent expectations. Role/kind inequality and repeated long-id equality establish only the checked separation/determinism cases, not collision freedom or complete fingerprint framing.
 * @evidence contracts/testing.md#distinguishing-cases Retains every existing case: JSON omissions and null slots, three unsupported roots, BOM plus both CR forms, abc digest, independent role/kind changes, all three comparator outcomes, RFC hazards, CON/lpt9.json, dot aliases/trailing dot and the original long Unicode id whose hash segment is not reversible.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns all authored values and byte arrays and invokes the real production exports synchronously. It opens no filesystem target, worker, native process or dynamic test; the protocol unit owns version migration and typed-domain categories.
 */
export function test_production_content_identity(): void {
  TestValidator.equals(
    "canonical keys and JSON omission semantics",
    canonicalizeAutoMovieJson({
      z: undefined,
      b: 2,
      a: [undefined, true, null, "x"],
      omitted: (): undefined => undefined,
      symbol: Symbol("x"),
    }),
    '{"a":[null,true,null,"x"],"b":2}',
  );
  TestValidator.equals(
    "canonical bytes",
    Buffer.from(canonicalAutoMovieJsonBytes({ b: 2, a: 1 })).toString("utf8"),
    '{"a":1,"b":2}',
  );
  TestValidator.equals(
    "unsupported canonical values fail loudly",
    namedFacts([
      [
        "throwsCanonicalizeAutoMovieJsonNaN",
        (): boolean => throws((): string => canonicalizeAutoMovieJson(Number.NaN)),
      ],
      [
        "throwsCanonicalizeAutoMovieJsonN",
        (): boolean => throws((): string => canonicalizeAutoMovieJson(1n)),
      ],
      [
        "throwsCanonicalizeAutoMovieJson",
        (): boolean => throws((): string => canonicalizeAutoMovieJson(undefined)),
      ],
    ]),
    {
      throwsCanonicalizeAutoMovieJsonNaN: true,
      throwsCanonicalizeAutoMovieJsonN: true,
      throwsCanonicalizeAutoMovieJson: true,
    },
  );
  TestValidator.equals(
    "source BOM and EOL normalization",
    Buffer.from(
      normalizeAutoMovieSource(Buffer.from("\ufeffa\r\nb\rc\n", "utf8")),
    ).toString("utf8"),
    "a\nb\nc\n",
  );
  TestValidator.equals(
    "known SHA-256",
    digestAutoMovieBytes(Buffer.from("abc")),
    "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  TestValidator.equals(
    "field roles and kinds separate identical bytes",
    namedFacts([
      [
        "fingerprintAutoMovieFieldsRoleA",
        (): boolean =>
          fingerprintAutoMovieFields([
            { role: "a", kind: "x", payload: Buffer.from("z") },
          ]) !==
          fingerprintAutoMovieFields([
            { role: "b", kind: "x", payload: Buffer.from("z") },
          ]),
      ],
      [
        "fingerprintAutoMovieFieldsRoleA2",
        (): boolean =>
          fingerprintAutoMovieFields([
            { role: "a", kind: "x", payload: Buffer.from("z") },
          ]) !==
          fingerprintAutoMovieFields([
            { role: "a", kind: "y", payload: Buffer.from("z") },
          ]),
      ],
    ]),
    {
      fingerprintAutoMovieFieldsRoleA: true,
      fingerprintAutoMovieFieldsRoleA2: true,
    },
  );
  TestValidator.equals(
    "code-unit comparator",
    [
      compareCodeUnits("a", "b"),
      compareCodeUnits("b", "a"),
      compareCodeUnits("a", "a"),
    ],
    [-1, 1, 0],
  );
  TestValidator.equals(
    "portable path segments escape RFC 3986 filename hazards",
    encodeAutoMoviePathSegment("a*!'()"),
    "a%2A%21%27%28%29",
  );
  TestValidator.equals(
    "portable path segments escape Windows devices",
    namedFacts([
      [
        "encodeAutoMoviePathSegmentCONON",
        (): boolean => encodeAutoMoviePathSegment("CON") === "%43ON",
      ],
      [
        "encodeAutoMoviePathSegmentLpt9Json",
        (): boolean => encodeAutoMoviePathSegment("lpt9.json") === "%6Cpt9.json",
      ],
      [
        "decodeAutoMoviePathSegmentONCON",
        (): boolean => decodeAutoMoviePathSegment("%43ON") === "CON",
      ],
    ]),
    {
      encodeAutoMoviePathSegmentCONON: true,
      encodeAutoMoviePathSegmentLpt9Json: true,
      decodeAutoMoviePathSegmentONCON: true,
    },
  );
  TestValidator.equals(
    "portable path segments escape dot aliases",
    namedFacts([
      [
        "encodeAutoMoviePathSegmentE",
        (): boolean => encodeAutoMoviePathSegment(".") === "%2E",
      ],
      [
        "encodeAutoMoviePathSegmentE2",
        (): boolean => encodeAutoMoviePathSegment("..") === ".%2E",
      ],
      [
        "encodeAutoMoviePathSegmentSharedShared",
        (): boolean => encodeAutoMoviePathSegment("shared.") === "shared%2E",
      ],
    ]),
    {
      encodeAutoMoviePathSegmentE: true,
      encodeAutoMoviePathSegmentE2: true,
      encodeAutoMoviePathSegmentSharedShared: true,
    },
  );
  const longId: string = "장편-전투-".repeat(64);
  const longSegment: string = encodeAutoMoviePathSegment(longId);
  TestValidator.equals(
    "long ids use stable content-addressed segments",
    namedFacts([
      ["sha256AF", (): boolean => /^~sha256-[0-9a-f]{64}$/.test(longSegment)],
      [
        "longSegmentEncodeAutoMoviePathSegmentLongId",
        (): boolean => longSegment === encodeAutoMoviePathSegment(longId),
      ],
      [
        "throwsDecodeAutoMoviePathSegmentLongSegment",
        (): boolean => throws((): string => decodeAutoMoviePathSegment(longSegment)),
      ],
    ]),
    {
      sha256AF: true,
      longSegmentEncodeAutoMoviePathSegmentLongId: true,
      throwsDecodeAutoMoviePathSegmentLongSegment: true,
    },
  );
}
