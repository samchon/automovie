import { createHash } from "node:crypto";

import { FamilyConicCaseIdentity as Identity } from "../../../reference-conics/FamilyConicCaseIdentity";
import { FamilyConicCaseSelection as Selection } from "../../../reference-conics/FamilyConicCaseSelection";

/**
 * The selected case and its per-case report must identify the same finite JSON fields and source scope.
 *
 * Scenarios:
 * 1. An independently spelled canonical byte sequence fixes ordinal keys, and reordered fields match.
 * 2. Wrong case ids, declared hashes, actual fields and source scopes are all refused.
 * 3. Round aggregates and failure-only reports cannot stand in for per-case provenance.
 * 4. Nonfinite values fail rather than silently becoming JSON null; array order remains significant.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual shared digest and preflight admission using made metadata only, accumulating every refusal with its valid counterpart.
 * @evidence contracts/development/testing.md#independent-expectations The expected digest starts from literal UTF-8 bytes with ordinal keys; literal case/source mismatches and missing per-case fields independently distinguish invalid reports.
 * @evidence contracts/development/common.md#meaningful-documentation Canonical field order and stable digests admit reordered fields. Case, source and digest mismatches, aggregate records, non-finite values and array order have separate cases.
 */
export function test_human_capture_case_identity(): void {
  const fields: { b: number; a: number } = { b: 2, a: 1 };
  const expected: string = createHash("sha256")
    .update('{"a":1,"b":2}')
    .digest("hex");
  const hashes: Record<string, string> = {
    "packages/human/src/made.ts": "a".repeat(64),
  };
  const selected: { id: string; fields: typeof fields } = {
    id: "made-second",
    fields,
  };
  const report: Parameters<typeof Selection.preflight>[0] = {
    id: selected.id,
    fields: { a: 1, b: 2 },
    fieldsHash: expected,
    sourceHashes: hashes,
  };
  const failures: string[] = [];
  if (
    Identity.dataHash(fields) !== expected ||
    Identity.byteHash('{"a":1,"b":2}') !== expected
  )
    failures.push("ordinal canonical bytes differ");
  if (Identity.dataHash([1, 2]) === Identity.dataHash([2, 1]))
    failures.push("array order was lost");
  try {
    Selection.preflight(report, selected, hashes);
  } catch (error: unknown) {
    failures.push("matching reordered report was refused: " + String(error));
  }
  const aggregate: Parameters<typeof Selection.preflight>[0] = JSON.parse(
    '{"schema":"f1-native-round/v1","cases":[]}',
  );
  const failed: Parameters<typeof Selection.preflight>[0] = JSON.parse(
    '{"id":"made-second","error":"unavailable"}',
  );
  const cases: { name: string; read: () => unknown }[] = [
    {
      name: "wrong id",
      read: (): void =>
        Selection.preflight({ ...report, id: "made-first" }, selected, hashes),
    },
    {
      name: "wrong declared hash",
      read: (): void =>
        Selection.preflight(
          { ...report, fieldsHash: "b".repeat(64) },
          selected,
          hashes,
        ),
    },
    {
      name: "changed actual fields",
      read: (): void =>
        Selection.preflight(
          { ...report, fields: { a: 1, b: 3 } },
          selected,
          hashes,
        ),
    },
    {
      name: "changed source",
      read: (): void =>
        Selection.preflight(
          {
            ...report,
            sourceHashes: { "packages/human/src/made.ts": "b".repeat(64) },
          },
          selected,
          hashes,
        ),
    },
    {
      name: "partial source",
      read: (): void =>
        Selection.preflight({ ...report, sourceHashes: {} }, selected, hashes),
    },
    {
      name: "aggregate report",
      read: (): void => Selection.preflight(aggregate, selected, hashes),
    },
    {
      name: "failure-only report",
      read: (): void => Selection.preflight(failed, selected, hashes),
    },
    {
      name: "nonfinite fields",
      read: (): string => Identity.dataHash({ a: Infinity }),
    },
  ];
  for (const scenario of cases) {
    let refused: boolean = false;
    try {
      scenario.read();
    } catch {
      refused = true;
    }
    if (!refused) failures.push(scenario.name + " was accepted");
  }
  if (failures.length > 0) throw new Error(failures.join("\n"));
}
