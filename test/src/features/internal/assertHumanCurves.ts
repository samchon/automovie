import { HUMAN_SLICE_BASELINE } from "./HUMAN_SLICE_BASELINE";
import { HumanCurveAudit } from "./HumanCurveAudit";
import { HumanPeople } from "./HumanPeople";

/**
 * Audit one part on every person, or where every part stands on each recorded
 * person, and fail with the whole list. The slice bound generates only the
 * people it has a record of.
 *
 * @param chains Chains of the part; omitted, the slice bound of the whole body.
 * @throws {Error} Listing every unsound region.
 */
export function assertHumanCurves(chains?: RegExp): void {
  const audit = (
    name: string,
  ): HumanCurveAudit.IHumanCurveFinding[] => {
    const p: HumanPeople.IPerson = HumanPeople.person(name);
    return chains !== undefined
      ? HumanCurveAudit.auditHumanCurves(p.name, p.body, chains)
      : HumanCurveAudit.auditHumanSlices(
          p.name,
          p.body,
          p.params.body.controls.height.value!,
          HUMAN_SLICE_BASELINE[p.name]!,
        );
  };
  const findings: HumanCurveAudit.IHumanCurveFinding[] = HumanPeople.names()
    .filter(
      (name: string): boolean =>
        chains !== undefined || name in HUMAN_SLICE_BASELINE,
    )
    .flatMap(audit);
  if (findings.length === 0) return;
  const lines: string[] = findings
    .sort(
      (
        a: HumanCurveAudit.IHumanCurveFinding,
        b: HumanCurveAudit.IHumanCurveFinding,
      ): number =>
        a.rule.localeCompare(b.rule) ||
        a.region.localeCompare(b.region) ||
        a.where.localeCompare(b.where),
    )
    .map(
      (f: HumanCurveAudit.IHumanCurveFinding): string =>
        `${f.rule.padEnd(10)} ${f.region.padEnd(28)} ${f.where.padEnd(26)} ${f.person.padEnd(10)} ${f.value.toFixed(2)} over ${f.limit} at ${f.count} points${f.point.length === 0 ? "" : ` near ${f.point.map((v: number): string => v.toFixed(0)).join(" ")}`}`,
    );
  throw new Error(
    `${findings.length} unsound regions in the generated curves:\n${lines.join("\n")}`,
  );
}
