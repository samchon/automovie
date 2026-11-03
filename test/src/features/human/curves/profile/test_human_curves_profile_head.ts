import type { IAutoMovieHumanBodyCalibration } from "../../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanCurveHeadVault } from "../../../internal/curves/HumanCurveHeadVault";
import { HumanCurveRings } from "../../../internal/curves/HumanCurveRings";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";

type IRow = HumanAnatomyAudit.IRow;

/**
 * Pins that every person's composed vault, the `head.upper` chain, falls from
 * its widest round to the vertex as one dome: no ridge, plateau or second
 * rise on the way, and a cap whose girth still falls into the vertex.
 *
 * Scenarios:
 * 1. A copy of f1 whose `head.upper` layer two thirds of the way up is swollen 6 percent reads a second rise on the vault and fails its row.
 * 2. Every person of `HumanPeople`: the vault is read every 2 mm, and every row out of its expectation is listed by person.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person through the public body law and evaluates the delivered `head.upper` chain every 2 mm of height at 192 phases (`HumanCurveRings`), reading the taut girth of each section: from the widest section, at the head circumference's level, up to the vertex it reads the girth's excess variation, and over the last two stations whether the girth still falls. It catches a ridge round the skull, a flat plateau on the vault, a bump on the crown, and a cap that widens or holds before it closes.
 * @evidence contracts/testing.md#independent-expectations The cranial vault is one convex dome over the frontal, parietal and occipital bones (Gray 1918), so its horizontal girth falls monotonically from its greatest round, the head circumference through glabella and opisthocranion, to the vertex. The floor is ISO 20685-1:2018 Table 4's 1 mm for head dimensions on a section's diameter, `pi` mm of girth. No construction constant or reference shape enters. Proven red here by a 6 percent swelling of one layer two thirds up the chain, which makes the girth rise again by several millimetres. Oracle limits: the chain's sections are horizontal, so a vault tilted far from upright reads its tilt as girth; the hair is not read.
 * @evidence contracts/testing.md#distinguishing-cases The core set's ten people, long and short, broad and narrow heads of both sexes. The head's dimensions at their landmarks belong to `test_human_anatomy_head`, the forehead's kinks on the skin to `test_human_curves_dent_forehead`, the head's pieces to the part tester once the head is announced divided.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_profile_head`, generating the cached people in process on the CPU (body law only) with no renderer, browser or GPU.
 */
export function test_human_curves_profile_head(): void {
  const failures: string[] = [...made()];
  for (const name of HumanPeople.names()) {
    try {
      for (const r of HumanCurveHeadVault.rows(name, HumanCurveRings.profile(name, "head.upper")))
        if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(3)} outside ${r.low.toFixed(3)} to ${r.high.toFixed(3)}`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} vault findings:\n${failures.join("\n")}`);
}

/** f1 with a ridge on its vault, required to fail the vault's fall. */
function made(): string[] {
  const p: HumanPeople.IPerson = HumanPeople.person("f1");
  const copy: IAutoMovieHumanBodyCalibration = structuredClone(p.body);
  const vault: IAutoMovieHumanLoftChain = copy.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "head.upper")!;
  const layer: IAutoMovieHumanLoftChain.ILayer = vault.layers[Math.floor((2 * vault.layers.length) / 3)]!;

  // The head's horizontal sections are centred near the head's own axis, so scaling about the world vertical scales the ring about a point a few millimetres off its centre.
  layer.coefficients = layer.coefficients.map((v: number): number => 1.06 * v);
  layer.slopes = layer.slopes.map((v: number): number => 1.06 * v);
  const rows: IRow[] = HumanCurveHeadVault.rows("f1 ridged", HumanCurveRings.of(copy, "head.upper", HumanCurveRings.scale(p)));
  return rows.some((r: IRow): boolean => r.site.endsWith("(PRO-HD-3)") && !HumanAnatomyAudit.passes(r)) ? [] : ["made vault ridge: the vault's row did not fail"];
}
