import { HumanCurveAudit } from "./HumanCurveAudit";
import { HumanPeople } from "./HumanPeople";

/**
 * Audit one part on every person, or where every part stands on every person,
 * and fail with the whole list.
 *
 * @param chains Chains of the part; omitted, the placement of the whole body.
 * @throws {Error} Listing every unsound region.
 */
export function assertHumanCurves(chains?: RegExp): void {
  const audit = (
    name: string,
  ): HumanCurveAudit.IHumanCurveFinding[] => {
    const p: HumanPeople.IPerson = HumanPeople.person(name);
    // The jaw is read at shares of its own width, the input in the body's
    // millimetres.
    const mandible: number =
      (p.params.head.mandibularWidth * p.body.stature) /
      p.params.body.controls.height.value! /
      2;
    return chains !== undefined
      ? [
          ...HumanCurveAudit.auditHumanCurves(p.name, p.body, chains, mandible),
          ...(chains.test("leg.left")
            ? HumanCurveAudit.auditHumanThigh(
                p.name,
                p.body,
                p.params.body.controls.height.value!,
                p.params.body.controls.thigh.value!,
              )
            : []),
        ]
      : HumanCurveAudit.auditHumanPlacement(
          p.name,
          p.body,
          p.params.body.controls.height.value!,
        );
  };
  const findings: HumanCurveAudit.IHumanCurveFinding[] = [];
  const unavailable: object[] = [];
  for (const person of HumanPeople.names()) {
    try { findings.push(...audit(person)); }
    catch (error) {
      unavailable.push({ person, phase: "actual person and curve consumer", chains: chains?.source ?? "whole-body placement", observed: "unavailable", expected: "A generated person whose requested curves can all be measured", coordinates: "unavailable", units: "unavailable", category: error instanceof Error ? error.name : typeof error, reason: error instanceof Error ? error.message : String(error), cause: error instanceof Error ? error.cause : undefined, stack: error instanceof Error ? error.stack : undefined });
    }
  }
  if (findings.length === 0 && unavailable.length === 0) return;
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
        `${f.rule.padEnd(10)} ${f.region.padEnd(28)} ${f.where.padEnd(26)} ${f.person.padEnd(10)} ${f.value.toFixed(2)} over ${f.limit} ${f.metric.units} at ${f.count} observations${f.point.length === 0 ? "" : `; ${f.metric.pointRole} [${f.point.join(", ")}] ${f.metric.coordinateUnits}`}; ${f.metric.definition}`,
    );
  throw new Error(
    `${findings.length} unsound regions and ${unavailable.length} unavailable people in the generated curves:\n${lines.join("\n")}\n${JSON.stringify(unavailable, (_key: string, value: unknown): unknown => typeof value === "number" && !Number.isFinite(value) ? String(value) : value)}`,
  );
}
