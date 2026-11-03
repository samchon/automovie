import type { IAutoMovieHumanBodyCalibration } from "../../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanCurveMerge } from "../../../internal/curves/HumanCurveMerge";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";

type IRow = HumanAnatomyAudit.IRow;

/**
 * Pins that every relief of every person's composed chains merges into its
 * base by adding volume: within its window the merged surface never lies
 * inside the base envelope.
 *
 * Scenarios:
 * 1. A copy of f1 whose first relief with heights all at or above zero has its heights negated fails that relief's row, a dent where a protrusion was.
 * 2. Every person of `HumanPeople`: every relief of every chain is read, and every one that cuts into its base is listed by person, chain, relief and the station and phase of its deepest point.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person through the public body law and, for every chain carrying reliefs, evaluates the chain as delivered and the same chain with its reliefs removed by `AutoMovieHumanLoftChain.ring` at every station 1 mm apart across each relief's window and 192 phases, reading inside the window the merged point less the base point along the base ring's outward normal in its own plane. It catches a relief that dents its base instead of adding to it: a groove, hollow or fossa written as a negative height, which belongs to the base or to a declared subtractive piece.
 * @evidence contracts/testing.md#independent-expectations The expectation is the construction's merging rule: a protruding piece attaches by a union that only grows the volume (the owner's design principle, recorded in the catalog's MRG family). The limit is -0.01 mm, a hundredth of a millimetre, below which no modelled feature lies and above double rounding. Proven red here: negating an additive relief's heights turns its least outward displacement from non-negative to minus its height. Oracle limits: the outward normal is the base ring's in-plane normal, so a relief's slant along the station reads by its in-plane part; a relief whose window lies outside its chain's stations reads nothing; the window's locality (zero change outside it) is the relief evaluator's own contract, read at piece level (MRG-3).
 * @evidence contracts/testing.md#distinguishing-cases The core set's ten people, whose reliefs (breasts, buttocks, face features, joint reliefs) differ in size and sign. Each relief's own height function, its edge continuity and its window are the part testers' piece rows (MRG-1 to MRG-4); the skin's freedom from kinks is the defect tests'.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_merge`, generating the cached people in process on the CPU (body law only) with no renderer, browser or GPU.
 */
export function test_human_curves_merge(): void {
  const failures: string[] = [...made()];
  for (const name of HumanPeople.names()) {
    try {
      for (const r of HumanCurveMerge.rows(name, HumanPeople.person(name).body))
        if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(3)} mm under ${r.low}`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} merge findings:\n${failures.join("\n")}`);
}

/** f1 with one additive relief turned into a dent, required to fail that relief's row. */
function made(): string[] {
  const copy: IAutoMovieHumanBodyCalibration = structuredClone(HumanPeople.person("f1").body);
  for (const chain of copy.chains)
    for (const relief of chain.reliefs ?? []) {
      if (relief.heights.some((h: number): boolean => h < 0) || !relief.heights.some((h: number): boolean => h > 1)) continue;
      relief.heights = relief.heights.map((h: number): number => -h);
      const rows: IRow[] = HumanCurveMerge.rows("f1 dented", { ...copy, chains: copy.chains.filter((c: IAutoMovieHumanLoftChain): boolean => c.name === chain.name) });
      const own: IRow | undefined = rows.find((r: IRow): boolean => r.site.startsWith(`${chain.name} relief ${relief.name}:`));
      return own !== undefined && !HumanAnatomyAudit.passes(own) ? [] : [`made dent: ${chain.name} relief ${relief.name} negated read ${own?.value ?? NaN}, expected below ${HumanCurveMerge.INWARD}`];
    }
  return ["made dent: f1 carries no relief whose heights are all at or above zero and reach 1 mm"];
}
