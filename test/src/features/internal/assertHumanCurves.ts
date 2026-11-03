import { HumanInputs } from "./HumanInputs";
import type { AutoMovieHumanSkeletonLaw } from "../../../../packages/human/src/generation/AutoMovieHumanSkeletonLaw";
import type { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyMirror } from "./HumanAnatomyMirror";
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
  const read: (p: HumanPeople.IPerson) => HumanCurveAudit.IHumanCurveFinding[] = (
    p: HumanPeople.IPerson,
  ): HumanCurveAudit.IHumanCurveFinding[] => {
    // The jaw is read at shares of its own width, the input in the body's
    // millimetres.
    const mandible: number =
      (p.params.head.mandibularWidth * p.body.stature) /
      HumanInputs.stature(p.params) /
      2;

    // Each side's rings are compared with the other side's reflection rebuilt
    // to this side's own inputs, located on the body's own skeleton.
    const skeleton: AutoMovieHumanSkeletonLaw.IBone[] | undefined = p.body.skeleton;
    const joint: (bone: string) => HumanAnatomy.V3 = (bone: string): HumanAnatomy.V3 => {
      const found: AutoMovieHumanSkeletonLaw.IBone | undefined = skeleton?.find(
        (b: AutoMovieHumanSkeletonLaw.IBone): boolean => b.bone === bone,
      );
      if (found === undefined) throw new Error(`${p.name} has no ${bone} bone`);
      return [...found.position];
    };
    const rebuild: ((chain: string, q: HumanAnatomy.V3) => HumanAnatomy.V3) | undefined =
      skeleton === undefined
        ? undefined
        : HumanAnatomyMirror.limbs(p.params, joint, p.body.stature / HumanInputs.stature(p.params));

    return chains !== undefined
      ? [
          ...HumanCurveAudit.auditHumanCurves(p.name, p.body, chains, mandible, rebuild),
          ...(chains.test("leg.left")
            ? HumanCurveAudit.auditHumanThigh(
                p.name,
                p.body,
                HumanInputs.stature(p.params),
                HumanInputs.of(p.params).thighCircumference,
              )
            : []),
        ]
      : HumanCurveAudit.auditHumanPlacement(
          p.name,
          p.body,
          HumanInputs.stature(p.params),
        );
  };
  const audit: (name: string) => HumanCurveAudit.IHumanCurveFinding[] = (name: string): HumanCurveAudit.IHumanCurveFinding[] => read(HumanPeople.person(name));

  // Red proof on f1: every chain of the part with its middle layer swollen
  // 30 % (a ring step that shades as a band), or for the placement every
  // chain dropped 5 % of stature through the floor, must list more findings
  // than f1 itself.
  const proof: string[] = [];
  const base: HumanPeople.IPerson = HumanPeople.person("f1");
  const body: HumanPeople.IPerson["body"] = structuredClone(base.body);
  for (const c of body.chains) {
    if (chains === undefined) {
      for (const l of c.layers) l.y -= 0.05 * body.stature;
    } else if (chains.test(c.name) && c.layers.length > 2) {
      const l: (typeof c.layers)[number] = c.layers[Math.floor(c.layers.length / 2)]!;
      l.coefficients = l.coefficients.map((v: number): number => 1.3 * v);
    }
  }
  try {
    const before: number = read(base).length;
    const after: number = read({ ...base, name: "f1 made", body }).length;
    if (!(after > before)) proof.push(`proof: f1 made (${chains === undefined ? "dropped 0.05 S" : "middle layers swollen 30 %"}) lists ${after} findings, f1 itself ${before}; expected more`);
  } catch (error) {
    proof.push(`proof: the made f1 could not be audited: ${(error as Error).message}`);
  }

  const findings: HumanCurveAudit.IHumanCurveFinding[] =
    HumanPeople.names().flatMap(audit);
  if (findings.length === 0 && proof.length === 0) return;
  if (findings.length === 0) throw new Error(proof.join("\n"));

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
    `${findings.length} unsound regions in the generated curves:\n${[...proof, ...lines].join("\n")}`,
  );
}
