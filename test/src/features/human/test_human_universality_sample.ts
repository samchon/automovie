import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPopulation } from "../internal/HumanPopulation";
import { HumanUniversality } from "../internal/universality/HumanUniversality";
import { HumanUniversalitySample } from "../internal/universality/HumanUniversalitySample";

/**
 * Pins that one construction serves every valid person, sampled: a fixed-seed
 * Latin hypercube of 200 people over the population ends' input domain, 20 a
 * run, each built through the universality gate's stages (body law, skin,
 * oral rim) and its chains read against its standing box.
 *
 * Scenarios:
 * 1. A made person with no head inputs is built and must come out failed at the body law, so a throwing stage is listed (red proof).
 * 2. The batch `AUTOMOVIE_HUMAN_SAMPLE` names (0 to 9, default 0) is built person by person; each person's inputs are audited against the population first and an invalid person is listed apart, never counted as a construction failure.
 * 3. One line per person: name, sex, its ten driver deviates, the first failing stage and its message, flung chains.
 * 4. For each failing piece, every driver's deviates on the people it fails against the passing people's, the input range that piece's law does not serve.
 * 5. The test fails listing every valid person that fails, with the table.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds each sampled person through `HumanUniversality.build`, the stages `AutoMovieHuman` takes (`AutoMovieHumanBodyLaw.calibrate`, `AutoMovieHumanBodySurface.generate` with the lips' box, `AutoMovieHumanOralCavity.rim`, then `AutoMovieHuman.diagnose`, the figure's whole list of broken piece contracts), and reads the chains against the standing box (`HumanCurveCollapse.boxed`). It catches a person the construction cannot build, or builds flung or with any diagnostic, anywhere in the domain the ten people of the core set leave between them, and names the piece and the input range.
 * @evidence contracts/testing.md#independent-expectations The Human skill's Done When: every supported person comes from the one construction, so any throw, any ring outside the person's own standing box, any broken rim is a defect of the construction for that input range. The people come from the survey's conditional model (`HumanPopulation.params`, ANSUR 1988, the boundary-manikin regression of Young et al. 2008) with each driver's conditional deviate between the 1st and 99th percentile, the range the population ends already declare supported; a person whose inputs fail `HumanPopulation.audit` is outside the supported domain and listed, not failed. Proven red by the made person without head inputs. Oracle limits: 200 people cover each driver's range in 200 strata but not every combination; the separating ranges are a lead, not a proof of the cause.
 * @evidence contracts/testing.md#distinguishing-cases Ten batches of 20, both sexes alternating, every driver of `HumanPopulation.IDrivers` varied together. The core set's named people belong to `test_human_universality`; each stage's own geometry to its tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_universality_sample`, building each person in process on the CPU with no renderer, browser or GPU, uncached because no other test reads the sampled people.
 */
export function test_human_universality_sample(): void {
  const lines: string[] = [];

  // Red proof: a person the body law cannot read must be listed as failed.
  const broken: IAutoMovieHumanParameters = { ...HumanPopulation.params(HumanPopulation.ENDS[0]!), head: undefined as unknown as IAutoMovieHumanParameters["head"] };
  if (!HumanUniversality.fails(HumanUniversality.build("made-headless", broken))) lines.push("proof      a made person with no head inputs must fail the body law, but built");

  const index: number = HumanUniversalitySample.batch();
  const sample: HumanUniversalitySample.IPerson[] = HumanUniversalitySample.people(index);
  const table: string[] = [`sample batch ${index} of ${HumanUniversalitySample.COUNT / HumanUniversalitySample.BATCH}, seed ${HumanUniversalitySample.SEED}; drivers ${HumanUniversalitySample.DRIVERS.join(" ")}`];
  const valid: HumanUniversalitySample.IPerson[] = [];
  const results: HumanUniversality.IPerson[] = [];
  for (const p of sample) {
    const z: string = HumanUniversalitySample.DRIVERS.map((d: keyof HumanPopulation.IDrivers): string => p.end.drivers[d]!.toFixed(2).padStart(6)).join("");
    const invalid: HumanPopulation.IRow[] = HumanPopulation.audit(p.end.name, p.end.sex, p.params).filter((r: HumanPopulation.IRow): boolean => !HumanPopulation.passes(r));
    if (invalid.length !== 0) {
      table.push(`${p.end.name} ${p.end.sex.padEnd(6)} ${z}  invalid inputs: ${invalid.map((r: HumanPopulation.IRow): string => r.site).join("; ")}`);
      continue;
    }
    const r: HumanUniversality.IPerson = HumanUniversalitySample.build(p);
    valid.push(p);
    results.push(r);
    table.push(`${p.end.name} ${p.end.sex.padEnd(6)} ${z}  ${(r.failed ?? "none").padEnd(9)} flung ${r.flung.length} diagnostics ${r.diagnostics.length} ${r.message}`);
    for (const d of r.diagnostics) table.push(`    diagnostic ${d}`);
    for (const f of r.flung) table.push(`    ${f.site}`);
  }
  table.push(...HumanUniversalitySample.ranges(valid, results));
  console.log(table.join("\n"));

  results.forEach((r: HumanUniversality.IPerson): void => {
    if (HumanUniversality.fails(r)) lines.push(`${r.person}: ${r.failed ?? (r.flung.length !== 0 ? "flung rings" : "diagnostics")} ${r.message} ${r.diagnostics.join("; ")}`);
  });
  if (lines.length !== 0) throw new Error(`${lines.length} universality sample findings:\n${lines.join("\n")}\n${table.join("\n")}`);
}
