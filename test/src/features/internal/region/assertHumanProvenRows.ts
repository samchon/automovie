import { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanPeople } from "../HumanPeople";

/**
 * Prove a family of rows on its made shapes, then read it on every person,
 * and fail with every proof that went wrong and every row that misses its
 * expectation, by person and site, so one run lists everything.
 *
 * @param label The family, named in the failure.
 * @param proofs The made-shape proofs; each returns its failures, empty when the family was green on the correct shape and red on every defect.
 * @param rowsOf The rows of one person, by name.
 * @throws {Error} Listing every proof failure and failing row.
 */
export function assertHumanProvenRows(label: string, proofs: () => string[], rowsOf: (person: string) => HumanAnatomyAudit.IRow[]): void {
  const lines: string[] = [];
  try {
    lines.push(...proofs().map((p: string): string => `proof      ${p}`));
  } catch (error) {
    lines.push(`proof      could not run: ${(error as Error).message}`);
  }

  // Every person is read even when another fails.
  const failed: HumanAnatomyAudit.IRow[] = [];
  for (const name of HumanPeople.names()) {
    try {
      failed.push(...rowsOf(name).filter((r: HumanAnatomyAudit.IRow): boolean => !HumanAnatomyAudit.passes(r)));
    } catch (error) {
      failed.push({ person: name, site: `could not be measured: ${(error as Error).message}`, value: NaN, low: 0, high: 0, unit: "" });
    }
  }
  lines.push(
    ...failed
      .sort((a: HumanAnatomyAudit.IRow, b: HumanAnatomyAudit.IRow): number => a.person.localeCompare(b.person) || a.site.localeCompare(b.site))
      .map((r: HumanAnatomyAudit.IRow): string => `${r.person.padEnd(10)} ${r.site}: ${r.value.toFixed(2)} ${r.unit} outside ${r.low.toFixed(2)} to ${r.high.toFixed(2)}`),
  );
  if (lines.length !== 0) throw new Error(`${lines.length} ${label} findings:\n${lines.join("\n")}`);
}
