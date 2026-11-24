import type { IAutoMovieMotionTake } from "@automovie/interface";

/**
 * Admit a parsed motion-take artifact before the host binds any saved
 * references.
 *
 * Accepts authored version 1 only. Checks exact record fields, unpadded paths,
 * lowercase SHA-256 digests, unique ledger keys, and finite nonnegative clocks.
 * The source module must appear in the file ledger and at least one versioned
 * provider must be named. Throws a path-specific diagnostic for a malformed
 * record or an unsupported version or replay mode. The result borrows the
 * parsed data; hosts independently rederive its facts before replay.
 */
export function admitMotionTake(input: unknown): IAutoMovieMotionTake {
  const take: Record<string, unknown> = object(input, "$take");
  if (take.version !== 1)
    throw new Error("take-version: expected version 1 at $take.version");
  if (take.replay !== "authored")
    throw new Error("take-replay: version 1 supports authored replay");

  properties(take, "$take", [
    "version",
    "production",
    "take",
    "source",
    "replay",
    "anchor",
    "provenance",
    ...(Object.hasOwn(take, "parent") ? ["parent"] : []),
  ]);
  identifier(take.production, "$take.production");
  identifier(take.take, "$take.take");
  const source: Record<string, unknown> = object(take.source, "$take.source");
  properties(source, "$take.source", ["module", "export"]);
  const modulePath: string = identifier(source.module, "$take.source.module");
  identifier(source.export, "$take.source.export");

  const anchor: Record<string, unknown> = object(take.anchor, "$take.anchor");
  properties(anchor, "$take.anchor", [
    "sequence",
    "entry",
    "shot",
    "outputSeconds",
    "sourceSeconds",
    "side",
  ]);
  identifier(anchor.sequence, "$take.anchor.sequence");
  identifier(anchor.shot, "$take.anchor.shot");
  if (!Number.isSafeInteger(anchor.entry) || (anchor.entry as number) < 0)
    invalid("$take.anchor.entry", "expected a nonnegative safe integer");
  seconds(anchor.outputSeconds, "$take.anchor.outputSeconds");
  seconds(anchor.sourceSeconds, "$take.anchor.sourceSeconds");
  if (anchor.side !== "before" && anchor.side !== "after")
    invalid("$take.anchor.side", 'expected "before" or "after"');

  const ledger: Record<string, unknown> = object(
    take.provenance,
    "$take.provenance",
  );
  properties(ledger, "$take.provenance", ["files", "providers", "seeds"]);
  const paths: Set<string> = uniqueRows(
    ledger.files,
    "$take.provenance.files",
    file,
  );
  if (!paths.has(modulePath))
    invalid("$take.source.module", "missing from provenance files");
  const providers: Set<string> = uniqueRows(
    ledger.providers,
    "$take.provenance.providers",
    provider,
  );
  if (providers.size === 0)
    invalid("$take.provenance.providers", "expected at least one provider");
  uniqueRows(ledger.seeds, "$take.provenance.seeds", seed);
  if (Object.hasOwn(take, "parent")) file(take.parent, "$take.parent");
  return input as IAutoMovieMotionTake;
}

/** Refuse one malformed field at its persisted address. */
function invalid(path: string, expectation: string): never {
  throw new Error(`take-schema: ${path} ${expectation}`);
}

/** Require a JSON record before reading its fields. */
function object(value: unknown, path: string): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  )
    invalid(path, "expected an object");
  return value as Record<string, unknown>;
}

/** Check an exact set of fields before evaluating their relationships. */
function properties(
  record: Record<string, unknown>,
  path: string,
  fields: readonly string[],
): void {
  for (const key of Object.keys(record))
    if (!fields.includes(key)) invalid(`${path}.${key}`, "unexpected property");
  for (const key of fields)
    if (!Object.hasOwn(record, key))
      invalid(`${path}.${key}`, "required property");
}

/** Check a stable textual address without coercing or trimming it. */
function identifier(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() !== value)
    invalid(path, "expected a string without surrounding whitespace");
  return value;
}

/** Check both persisted time coordinates in their own clocks. */
function seconds(value: unknown, path: string): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    invalid(path, "expected finite nonnegative seconds");
}

/** Check one file identity and return its ledger key. */
function file(value: unknown, path: string): string {
  const row: Record<string, unknown> = object(value, path);
  properties(row, path, ["path", "sha256"]);
  const address: string = identifier(row.path, `${path}.path`);
  if (typeof row.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(row.sha256))
    invalid(
      `${path}.sha256`,
      "expected a lowercase hexadecimal SHA-256 digest",
    );
  return address;
}

/** Check one named provider and return its binding key. */
function provider(value: unknown, path: string): string {
  const row: Record<string, unknown> = object(value, path);
  properties(row, path, ["id", "version"]);
  identifier(row.version, `${path}.version`);
  return identifier(row.id, `${path}.id`);
}

/** Check one exact seed string and return its owner key. */
function seed(value: unknown, path: string): string {
  const row: Record<string, unknown> = object(value, path);
  properties(row, path, ["id", "value"]);
  if (typeof row.value !== "string")
    invalid(`${path}.value`, "expected a string");
  return identifier(row.id, `${path}.id`);
}

/** Check every ledger row, retaining each key once for duplicate checks. */
function uniqueRows(
  value: unknown,
  path: string,
  read: (row: unknown, path: string) => string,
): Set<string> {
  if (!Array.isArray(value)) invalid(path, "expected an array");
  const keys: Set<string> = new Set();
  for (let index: number = 0; index < value.length; index++) {
    const address: string = `${path}[${index}]`;
    const key: string = read(value[index], address);
    if (keys.has(key)) invalid(address, `duplicates "${key}"`);
    keys.add(key);
  }
  return keys;
}
