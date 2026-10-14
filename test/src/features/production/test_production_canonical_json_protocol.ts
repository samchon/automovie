import {
  AUTOMOVIE_CANONICAL_JSON_DOMAIN,
  AUTOMOVIE_CANONICAL_JSON_PROTOCOL,
  AUTOMOVIE_LEGACY_CANONICAL_JSON_PROTOCOL,
  AutoMovieCanonicalJsonError,
  canonicalizeAutoMovieJson,
  canonicalizeAutoMovieJsonForProtocol,
  digestAutoMovieBytes,
  identifyAutoMovieCanonicalJson,
  verifyAutoMovieCanonicalJsonIdentity,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

const throws: (task: () => unknown) => boolean = (task: () => unknown): boolean => {
  try {
    task();
    return false;
  } catch {
    return true;
  }
};

const category: (task: () => unknown) => string = (task: () => unknown): string => {
  try {
    task();
    return "accepted";
  } catch (error) {
    return error instanceof AutoMovieCanonicalJsonError
      ? error.category
      : error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);
  }
};

/**
 * Canonical JSON is valid, versioned and migrates only from recoverable input.
 *
 * Scenarios:
 *
 * 1. Array length and every slot survive, identities expose their protocol,
 *    and the explicit protocol entry agrees with the implicit one.
 * 2. Every value outside the acyclic plain scalar domain is refused under its
 *    typed category: accessor slots in arrays as well as objects, lone
 *    surrogates at the end of or inside a string, non-finite numbers, and
 *    bigint.
 * 3. Current, stale, migrated and unverifiable verification states are
 *    disjoint for both protocols; the legacy encoder used only to verify a
 *    declared v1 digest keeps its exact lossy treatment of omitted members and
 *    nulled items, and a value the current protocol refuses never reaches it.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public canonical encoder, protocol selector, identity producer and verifier, asserting exact canonical text/bytes, array slot preservation, typed refusal categories and disjoint current/stale/migrated/unverifiable outcomes. The legacy verifier must authenticate predecessor bytes before returning current identity.
 * @evidence contracts/testing.md#independent-expectations Authored JSON strings, null slots, refusal categories and declared v1/v2 rules supply expectations independently of the encoder. Digest comparisons deliberately share the digest helper and certify protocol composition, not an independent SHA implementation; the content-identity unit supplies its known SHA-256 vector.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all three numbered scenarios, sparse arrays, invalid object/array accessors, Unicode and scalar refusals, false runtime protocol, null prototypes, repeated noncyclic references, all seven verification outcomes and every existing legacy omission/nulling/stale/refusal case.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns all values and original synchronous assertions. It invokes public production exports and authors accessors only on its own records; it opens no file, worker or dynamic test and does not claim native or renderer integration.
 */
export function test_production_canonical_json_protocol(): void {
  const sparse: unknown[] = new Array<unknown>(2);
  sparse[1] = undefined;
  TestValidator.equals(
    "array length and every slot survive canonicalization",
    [
      canonicalizeAutoMovieJson([]),
      canonicalizeAutoMovieJson(new Array(1)),
      canonicalizeAutoMovieJson(sparse),
      JSON.parse(canonicalizeAutoMovieJson(sparse)),
    ],
    ["[]", "[null]", "[null,null]", [null, null]],
  );
  const identity: ReturnType<typeof identifyAutoMovieCanonicalJson> = identifyAutoMovieCanonicalJson({ b: 2, a: "😀" });
  TestValidator.equals(
    "identity exposes its protocol, valid bytes and digest",
    [
      identity.protocol,
      AUTOMOVIE_CANONICAL_JSON_DOMAIN.unicode,
      Buffer.from(identity.bytes).toString("utf8"),
      identity.digest === digestAutoMovieBytes(identity.bytes),
      canonicalizeAutoMovieJson(
        JSON.parse(Buffer.from(identity.bytes).toString("utf8")),
      ),
    ],
    [
      AUTOMOVIE_CANONICAL_JSON_PROTOCOL,
      "exact-scalar-sequence",
      '{"a":"😀","b":2}',
      true,
      '{"a":"😀","b":2}',
    ],
  );
  const cycle: { self?: unknown } = {};
  cycle.self = cycle;
  const accessor: object = Object.defineProperty({}, "value", {
    enumerable: true,
    get: (): number => 1,
  });
  TestValidator.equals(
    "values outside the explicit acyclic plain scalar domain are refused",
    [
      throws((): string => canonicalizeAutoMovieJson(new Date(0))),
      throws((): string => canonicalizeAutoMovieJson(new Map())),
      throws((): string => canonicalizeAutoMovieJson(cycle)),
      throws((): string => canonicalizeAutoMovieJson("\ud800")),
      throws((): string => canonicalizeAutoMovieJson({ "\udc00": true })),
      throws((): string => canonicalizeAutoMovieJson(accessor)),
    ],
    [true, true, true, true, true, true],
  );
  const accessorSlot: unknown[] = Object.defineProperty([0], 0, {
    enumerable: true,
    get: (): number => 1,
  }) as unknown[];
  TestValidator.equals(
    "every refusal carries the category that names its domain violation",
    {
      accessorSlot: category((): string => canonicalizeAutoMovieJson(accessorSlot)),
      trailingHighSurrogate: category((): string =>
        canonicalizeAutoMovieJson("a\ud800"),
      ),
      unpairedHighSurrogate: category((): string =>
        canonicalizeAutoMovieJson("a\ud800b"),
      ),
      loneLowSurrogate: category((): string => canonicalizeAutoMovieJson("\udc00")),
      nonFinite: category((): string => canonicalizeAutoMovieJson([Infinity])),
      bigint: category((): string => canonicalizeAutoMovieJson({ value: 1n })),
      undefinedRoot: category((): string => canonicalizeAutoMovieJson(undefined)),
    },
    {
      accessorSlot: "accessor-property",
      trailingHighSurrogate: "invalid-unicode",
      unpairedHighSurrogate: "invalid-unicode",
      loneLowSurrogate: "invalid-unicode",
      nonFinite: "unsupported-value",
      bigint: "unsupported-value",
      undefinedRoot: "unsupported-value",
    },
  );
  TestValidator.predicate(
    "the explicit protocol entry returns the same versioned identity",
    canonicalizeAutoMovieJsonForProtocol({
      protocol: AUTOMOVIE_CANONICAL_JSON_PROTOCOL,
      value: { b: 2, a: "😀" },
    }).digest === identity.digest,
  );
  // The category, not merely a throw: a guard that threw a ReferenceError
  // would satisfy a bare throw check while refusing nothing by contract.
  TestValidator.equals(
    "the runtime guard refuses a falsely typed historical protocol by category",
    category((): ReturnType<typeof canonicalizeAutoMovieJsonForProtocol> =>
      canonicalizeAutoMovieJsonForProtocol({
        protocol:
          "automovie.canonical-json.v1" as typeof AUTOMOVIE_CANONICAL_JSON_PROTOCOL,
        value: {},
      }),
    ),
    "unsupported-value",
  );
  try {
    canonicalizeAutoMovieJson("\ud800");
  } catch (error) {
    TestValidator.equals(
      "invalid Unicode exposes a typed stable category",
      error instanceof AutoMovieCanonicalJsonError
        ? [error.code, error.category]
        : error,
      ["automovie-canonical-json-invalid", "invalid-unicode"],
    );
  }
  const shared: { value: number } = { value: 1 };
  const nullPrototype: Record<string, unknown> = Object.assign(
    Object.create(null) as Record<string, unknown>,
    { b: shared, a: shared },
  );
  TestValidator.equals(
    "plain null-prototype values and repeated non-cyclic references are admitted",
    canonicalizeAutoMovieJson(nullPrototype),
    '{"a":{"value":1},"b":{"value":1}}',
  );
  const legacyValue: { b: number; a: number } = { b: 2, a: 1 };
  const legacyDigest: string = digestAutoMovieBytes(Buffer.from('{"a":1,"b":2}'));
  const migratedSparse: ReturnType<typeof verifyAutoMovieCanonicalJsonIdentity> = verifyAutoMovieCanonicalJsonIdentity({
    value: new Array(1),
    protocol: AUTOMOVIE_LEGACY_CANONICAL_JSON_PROTOCOL,
    digest: digestAutoMovieBytes(Buffer.from("[]")),
  });
  TestValidator.equals(
    "a recoverable sparse v1 identity preserves old identity and derives v2",
    migratedSparse.status === "migrated"
      ? [
          migratedSparse.legacyDigest,
          Buffer.from(migratedSparse.current.bytes).toString("utf8"),
          migratedSparse.current.protocol,
        ]
      : migratedSparse,
    [
      digestAutoMovieBytes(Buffer.from("[]")),
      "[null]",
      AUTOMOVIE_CANONICAL_JSON_PROTOCOL,
    ],
  );
  TestValidator.equals(
    "current, stale, migrated and unverifiable states are disjoint",
    [
      verifyAutoMovieCanonicalJsonIdentity({
        value: legacyValue,
        protocol: AUTOMOVIE_CANONICAL_JSON_PROTOCOL,
        digest: identifyAutoMovieCanonicalJson(legacyValue).digest,
      }).status,
      verifyAutoMovieCanonicalJsonIdentity({
        value: legacyValue,
        protocol: AUTOMOVIE_CANONICAL_JSON_PROTOCOL,
        digest: digestAutoMovieBytes(Buffer.from("stale")),
      }).status,
      verifyAutoMovieCanonicalJsonIdentity({
        value: legacyValue,
        protocol: AUTOMOVIE_LEGACY_CANONICAL_JSON_PROTOCOL,
        digest: legacyDigest,
      }).status,
      verifyAutoMovieCanonicalJsonIdentity({
        protocol: AUTOMOVIE_LEGACY_CANONICAL_JSON_PROTOCOL,
        digest: legacyDigest,
      }).status,
      verifyAutoMovieCanonicalJsonIdentity({
        value: legacyValue,
        protocol: "unknown",
        digest: legacyDigest,
      }).status,
      verifyAutoMovieCanonicalJsonIdentity({
        value: new Date(0),
        protocol: AUTOMOVIE_CANONICAL_JSON_PROTOCOL,
        digest: legacyDigest,
      }).status,
      verifyAutoMovieCanonicalJsonIdentity({
        value: new Date(0),
        protocol: AUTOMOVIE_LEGACY_CANONICAL_JSON_PROTOCOL,
        digest: digestAutoMovieBytes(Buffer.from("{}")),
      }).status,
    ],
    [
      "current",
      "stale",
      "migrated",
      "unverifiable",
      "unverifiable",
      "unverifiable",
      "unverifiable",
    ],
  );
  const legacy: (value: unknown, digest?: string) => string = (value: unknown, digest: string = legacyDigest): string => {
    const verification: ReturnType<typeof verifyAutoMovieCanonicalJsonIdentity> = verifyAutoMovieCanonicalJsonIdentity({
      value,
      protocol: AUTOMOVIE_LEGACY_CANONICAL_JSON_PROTOCOL,
      digest,
    });
    return verification.status === "unverifiable"
      ? `unverifiable: ${verification.reason}`
      : verification.status;
  };
  TestValidator.equals(
    "the legacy verifier reports stale digests and keeps its own exact refusals",
    {
      stale: legacy({ a: 1, b: 3 }),
      omittedMembers: legacy(
        { b: 2, a: 1, skipped: undefined, method: (): number => 1 },
        legacyDigest,
      ),
      nulledItems: legacy(
        [undefined, "text", true],
        digestAutoMovieBytes(Buffer.from('[null,"text",true]')),
      ),
      symbolMember: legacy({ b: 2, a: 1, tag: Symbol("tag") }),
      nestedScalars: legacy(
        { list: [null, false, 1.5, "s"] },
        digestAutoMovieBytes(Buffer.from('{"list":[null,false,1.5,"s"]}')),
      ),
      refusedBeforeLegacy: legacy({ value: 1n }).startsWith(
        "unverifiable: AutoMovieCanonicalJsonError",
      ),
    },
    {
      stale: "stale",
      omittedMembers: "migrated",
      nulledItems: "migrated",
      symbolMember: "migrated",
      nestedScalars: "migrated",
      refusedBeforeLegacy: true,
    },
  );
}
