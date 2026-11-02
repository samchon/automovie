import { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanPeople } from "./HumanPeople";

/**
 * Measure one region on every person and fail with every measurement that
 * misses its expectation, by person and site.
 *
 * @param region A key of {@link HumanAnatomyAudit.REGIONS}.
 * @throws {Error} Listing every failing measurement.
 */
export function assertHumanAnatomy(region: string): void {
  const audit: (name: string) => HumanAnatomyAudit.IRow[] = HumanAnatomyAudit.REGIONS[region]!;
  const failed: HumanAnatomyAudit.IRow[] = [];
  for (const name of HumanPeople.names()) {
    try {
      failed.push(...audit(name).filter((r: HumanAnatomyAudit.IRow): boolean => !HumanAnatomyAudit.passes(r)));
    } catch (error) {
      failed.push({ person: name, site: `could not be measured: ${(error as Error).message}`, value: NaN, low: 0, high: 0, unit: "", authority: "clinical-identity", status: "unavailable", reason: "The complete region audit failed before its required identity readings could be established." });
    }
  }
  if (failed.length === 0) return;
  const lines: string[] = failed
    .sort(
      (a: HumanAnatomyAudit.IRow, b: HumanAnatomyAudit.IRow): number =>
        a.person.localeCompare(b.person) || a.site.localeCompare(b.site),
    )
    .map(
      (r: HumanAnatomyAudit.IRow): string =>
        `${r.person.padEnd(10)} [${r.authority}/${r.status}] ${r.site}: ${r.value.toFixed(2)} ${r.unit} outside ${r.low.toFixed(2)} to ${r.high.toFixed(2)}${r.reason === undefined ? "" : "; " + r.reason}`,
    );
  throw new Error(`${failed.length} ${region} measurements miss their expectation:\n${lines.join("\n")}`);
}
