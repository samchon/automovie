import { AUTOMOVIE_DIAGNOSTIC_CODES } from "../../../../packages/production/src/production/AUTOMOVIE_DIAGNOSTIC_CODES";
import { findAutoMovieDiagnosticCatalogEntry } from "../../../../packages/production/src/production/diagnosticCatalog/findAutoMovieDiagnosticCatalogEntry";
import { listAutoMovieDiagnosticCatalog } from "../../../../packages/production/src/production/diagnosticCatalog/listAutoMovieDiagnosticCatalog";
import type { IAutoMovieDiagnosticCatalogEntry } from "../../../../packages/production/src/production/diagnosticCatalog/IAutoMovieDiagnosticCatalogEntry";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";

/**
 * The descriptive catalog lists the complete runtime code vocabulary and preserves immutable entries through lookup.
 *
 * Scenarios:
 * 1. Every declared runtime code appears once in canonical order with a unique complete reference and one positive catalog revision.
 * 2. The list, entries and reference records are frozen, and lookup returns those exact entry objects.
 * 3. An unknown code returns null rather than an unrelated catalog entry.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real catalog list/lookup and compares observable ordered codes, reference data, frozen state and object identity; catches omitted/reordered entries, incomplete references or copied/incorrect lookups.
 * @evidence contracts/testing.md#independent-expectations The closed production code registry supplies the supported vocabulary and order independently of catalog construction; set cardinality, positive revision, nonblank descriptive fields, Object.isFrozen and exact reference identity define the remaining oracle. The test does not certify whether each code has a current producer or whether a correction succeeds.
 * @evidence contracts/testing.md#distinguishing-cases Covers all declared codes and one outside the closed catalog, unique references, one revision, nonempty descriptive fields, nested frozen records and repeated lookup identity without dropping any existing assertion.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_production_diagnostic_catalog imports its portable catalog owners and runtime registry directly, starts no real host and observes descriptive results without applying recovery actions.
 */
export function test_production_diagnostic_catalog(): void {
  const catalog: readonly Readonly<IAutoMovieDiagnosticCatalogEntry>[] = listAutoMovieDiagnosticCatalog();
  const references: Set<string> = new Set(catalog.map((entry: Readonly<IAutoMovieDiagnosticCatalogEntry>): string => entry.reference.id));
  const revisions: Set<number> = new Set(
    catalog.map((entry: Readonly<IAutoMovieDiagnosticCatalogEntry>): number => entry.reference.catalogRevision),
  );

  TestValidator.equals(
    "the immutable catalog closes the public diagnostic union exactly once",
    namedFacts([
      [
        "codes",
        (): boolean =>
          catalog.map((entry: Readonly<IAutoMovieDiagnosticCatalogEntry>): string => entry.code).join("\n") ===
          AUTOMOVIE_DIAGNOSTIC_CODES.join("\n"),
      ],
      ["uniqueReferences", (): boolean => references.size === catalog.length],
      [
        "onePositiveRevision",
        (): boolean =>
          revisions.size === 1 &&
          [...revisions].every((revision: number): boolean => revision > 0),
      ],
      [
        "completeReferences",
        (): boolean =>
          catalog.every(
            (entry: Readonly<IAutoMovieDiagnosticCatalogEntry>): boolean =>
              entry.reference.path.includes(".md#") &&
              entry.invariant.length > 0 &&
              entry.correction.length > 0 &&
              entry.recheck.length > 0,
          ),
      ],
      ["catalogFrozen", (): boolean => Object.isFrozen(catalog)],
      [
        "entriesFrozen",
        (): boolean =>
          catalog.every(
            (entry: Readonly<IAutoMovieDiagnosticCatalogEntry>): boolean =>
              Object.isFrozen(entry) && Object.isFrozen(entry.reference),
          ),
      ],
      [
        "lookups",
        (): boolean =>
          catalog.every(
            (entry: Readonly<IAutoMovieDiagnosticCatalogEntry>): boolean =>
              findAutoMovieDiagnosticCatalogEntry(entry.code) === entry,
          ),
      ],
    ]),
    {
      codes: true,
      uniqueReferences: true,
      onePositiveRevision: true,
      completeReferences: true,
      catalogFrozen: true,
      entriesFrozen: true,
      lookups: true,
    },
  );
  TestValidator.equals(
    "an unknown diagnostic never aliases a catalog entry",
    findAutoMovieDiagnosticCatalogEntry("outside-the-closed-catalog"),
    null,
  );
}
