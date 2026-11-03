import { HumanAnatomyAudit } from "../HumanAnatomyAudit";

/**
 * Every row that misses its expectation, one line each, sorted by person and
 * site, so a test fails with the whole list at once.
 *
 * @param rows Rows of every person read.
 * @returns The failing rows' lines; empty when every row passes.
 */
export function failingHumanRows(rows: readonly HumanAnatomyAudit.IRow[]): string[] {
  return rows
    .filter((r: HumanAnatomyAudit.IRow): boolean => !HumanAnatomyAudit.passes(r))
    .sort((a: HumanAnatomyAudit.IRow, b: HumanAnatomyAudit.IRow): number => a.person.localeCompare(b.person) || a.site.localeCompare(b.site))
    .map((r: HumanAnatomyAudit.IRow): string => `${r.person.padEnd(10)} ${r.site}: ${r.value.toFixed(3)} ${r.unit} outside ${r.low} to ${r.high}`);
}
