import type { HumanAnatomyAudit } from "../internal/HumanAnatomyAudit";
import { HumanPeople } from "../internal/HumanPeople";
import { HumanUniversality } from "../internal/universality/HumanUniversality";

/**
 * Pins that one construction serves every person: each person of the core
 * set generates through the body law, the skin and the oral cavity's rim
 * without a throw, its chains' rings stay inside the person's standing box,
 * and its mouth rim is one closed loop.
 *
 * Scenarios:
 * 1. Every person of `HumanPeople` (or the people `AUTOMOVIE_HUMAN_PEOPLE` lists) is built stage by stage and printed as one table row: the first failing stage and its message, the chains with flung rings, the rim's components.
 * 2. For each failing person, every numeric head input that lies outside the passing people's range is printed, the input range the failing piece's law does not serve.
 * 3. The test fails listing every failing person, stage and message.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds each person along the public path `AutoMovieHuman.generate` takes: `AutoMovieHumanBodyLaw.calibrate`, `AutoMovieHumanBodySurface.generate` with the 3 mm box round the lips' boundary that the public path refines, and `AutoMovieHumanOralCavity.rim` on the skin and the `mouth` aperture, keeping each stage's outcome; the chains' rings are read against the standing box (`HumanCurveCollapse.boxed`). It catches a person the construction cannot build (the mouth rim with edges off its loop on m1 and m2), a flung loft, and a rim split into components, naming the stage, the message and the inputs that set the person apart.
 * @evidence contracts/testing.md#independent-expectations Every supported person comes from the one construction (the Human skill's Done When): a throw at any stage, a ring outside the person's own standing box (0.6 S from the axis, 0.02 S of the floor and crown) or a rim that is not one closed loop is a defect of the construction's law for that input range, never of the person. The rim's components are printed in the rim's own terms so the hypotheses separate: lips closing apart at the corners, an island cut inside the outline, a second loop from crowded stations. Oracle limits: the inputs outside the passing range are a lead, not a cause; with few passing people the range is narrow.
 * @evidence contracts/testing.md#distinguishing-cases The core set's ten people. Each stage's own geometry belongs to its tests (`test_human_skin_collapse`, `test_human_mouth`, the head tests); this test gates the queue on whether every person builds.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_universality`, building each person in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_universality(): void {
  const all: HumanUniversality.IPerson[] = HumanPeople.names().map((name: string): HumanUniversality.IPerson => HumanUniversality.person(name));
  const lines: string[] = ["person         stage failed  flung chains  message"];
  for (const p of all) {
    lines.push(`${p.person.padEnd(14)} ${(p.failed ?? "none").padEnd(13)} ${String(p.flung.length).padEnd(13)} ${p.message}`);
    for (const r of p.flung) lines.push(`    ${r.site}`);
    for (const r of p.rim) lines.push(`    rim ${r}`);
  }

  // The head inputs of each failing person outside the passing people's range.
  const passing: HumanUniversality.IPerson[] = all.filter((p: HumanUniversality.IPerson): boolean => p.failed === null && p.flung.length === 0);
  const ranges: Map<string, [number, number]> = new Map();
  for (const p of passing)
    for (const [k, v] of HumanUniversality.leaves(HumanPeople.params(p.person).head)) {
      const r: [number, number] | undefined = ranges.get(k);
      ranges.set(k, r === undefined ? [v, v] : [Math.min(r[0], v), Math.max(r[1], v)]);
    }
  const failing: HumanUniversality.IPerson[] = all.filter((p: HumanUniversality.IPerson): boolean => p.failed !== null || p.flung.length !== 0);
  for (const p of failing) {
    const outside: string[] = [];
    for (const [k, v] of HumanUniversality.leaves(HumanPeople.params(p.person).head)) {
      const r: [number, number] | undefined = ranges.get(k);
      if (r !== undefined && (v < r[0] || v > r[1])) outside.push(`head.${k} ${v} (passing ${r[0]}..${r[1]})`);
    }
    lines.push(`${p.person} head inputs outside the passing people's range: ${outside.join("; ") || "none"}`);
  }
  console.log(lines.join("\n"));
  if (failing.length !== 0)
    throw new Error(
      `${failing.length} of ${all.length} people fail the universality gate:\n${failing.map((p: HumanUniversality.IPerson): string => `${p.person}: ${p.failed ?? "flung rings"} ${p.message} ${p.flung.map((r: HumanAnatomyAudit.IRow): string => r.site).join("; ")}`).join("\n")}\n${lines.join("\n")}`,
    );
}
