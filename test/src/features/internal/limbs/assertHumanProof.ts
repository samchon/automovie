import { HumanAnatomyAudit } from "../HumanAnatomyAudit";

/**
 * Prove an observer on a made defect and on a correct shape before its rows
 * bind: the defect's rows must fail at the sites that name the defect, and the
 * correct shape's rows must all pass. A proof that does not hold is the
 * observer's failure, reported with the rows that betray it, so a rule that
 * cannot see its defect never passes a real body.
 *
 * @param label The rule, named in the failure.
 * @param defect Rows read on the made defect.
 * @param names The site text a failing row of the defect must contain.
 * @param correct Rows read on the correct shape.
 * @returns Every proof failure, one line each; empty when the observer is proven.
 */
export function assertHumanProof(label: string, defect: readonly HumanAnatomyAudit.IRow[], names: string, correct: readonly HumanAnatomyAudit.IRow[]): string[] {
  const out: string[] = [];
  const caught: HumanAnatomyAudit.IRow[] = defect.filter((r: HumanAnatomyAudit.IRow): boolean => r.site.includes(names) && !HumanAnatomyAudit.passes(r));
  if (caught.length === 0) out.push(`proof of ${label}: the made defect at "${names}" was not caught`);

  // A correct shape passes every row, the defect's own site included.
  for (const r of correct)
    if (!HumanAnatomyAudit.passes(r)) out.push(`proof of ${label}: the correct shape fails ${r.site}: ${r.value.toFixed(3)} outside ${r.low} to ${r.high}`);
  return out;
}
