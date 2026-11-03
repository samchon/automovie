import { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanPeople } from "./HumanPeople";

/**
 * Read one family of rows on every person and fail with every row that misses
 * its expectation, by person and site.
 *
 * @param label The family, named in the failure.
 * @param rowsOf The rows of one person, by name.
 * @throws {Error} Listing every failing row.
 */
export function assertHumanRows(label: string, rowsOf: (person: string) => HumanAnatomyAudit.IRow[]): void {
  const failed: HumanAnatomyAudit.IRow[] = [];
  for (const name of HumanPeople.names()) {
    try {
      failed.push(...rowsOf(name).filter((r: HumanAnatomyAudit.IRow): boolean => !HumanAnatomyAudit.passes(r)));
    } catch (error) {
      failed.push({ person: name, site: `could not be measured: ${(error as Error).message}`, value: NaN, low: 0, high: 0, unit: "" });
    }
  }
  if (failed.length === 0) return;

  const lines: string[] = failed
    .sort((a: HumanAnatomyAudit.IRow, b: HumanAnatomyAudit.IRow): number => a.person.localeCompare(b.person) || a.site.localeCompare(b.site))
    .map(
      (r: HumanAnatomyAudit.IRow): string =>
        `${r.person.padEnd(10)} ${r.site}: ${r.value.toFixed(2)} ${r.unit} outside ${r.low.toFixed(2)} to ${r.high.toFixed(2)}`,
    );
  throw new Error(`${failed.length} ${label} rows miss their expectation:\n${lines.join("\n")}`);
}
