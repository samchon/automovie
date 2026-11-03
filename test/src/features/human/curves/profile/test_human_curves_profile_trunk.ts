import type { IAutoMovieHumanBodyCalibration } from "../../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanCurveRings } from "../../../internal/curves/HumanCurveRings";
import { HumanCurveTrunkOutline } from "../../../internal/curves/HumanCurveTrunkOutline";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";

type IRow = HumanAnatomyAudit.IRow;

/**
 * Pins that every person's composed trunk, from the crotch ring to the neck's
 * base, has the outlines of a human trunk: the back turns at the buttocks,
 * the lumbar lordosis and the thoracic kyphosis; the side at the hips, the
 * waist and the shoulders; the front at most at the abdomen, the epigastric
 * hollow and the chest, a feminine front ending at the bust's maximum.
 *
 * Scenarios:
 * 1. A copy of f1 whose two trunk layers at mid-height are carried 8 mm backward reads an extra turn on the back outline and fails its row.
 * 2. A copy whose `upper` layer three quarters of the way up is widened 15 percent across reads a shelf on the shoulder line and fails its row.
 * 3. A copy whose trunk layers below 0.72 S are widened 30 percent reads its least girth above 0.70 S and fails the waist's row.
 * 4. Every person of `HumanPeople`: the three outlines are read every 2 mm, the shoulder line's fall and the natural waist's height too, and every row out of its expectation is listed by person with what it read.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person through the public body law and evaluates its delivered `trunk` and `upper` chains every 2 mm of height at 192 phases, reading per height the most anterior skin, the most posterior and the widest half breadth, and the interior turns of each outline bottom to top beyond a 2 mm floor (`HumanCurveProfile.turns`). For a feminine person it reads the front's highest maximum, the bust, against ANSUR II chest height over stature (0.6867 to 0.7596). It also reads the side outline's excess variation from the shoulders' widest up to the neck's base (the trapezius' falling line) and the height of the trunk chain's least girth between 0.47 S and 0.76 S over stature (the natural waist, which lies between the iliac crest and the tenth rib: ANSUR II iliocristale 0.611 and 0.605 S, tenth rib 0.649 and 0.638 S, inside the trunk audit's 0.56 to 0.70 S). It catches a flat or reversed back, a second lumbar hollow, a waist above the chest or below the hips, a hip with no width, a shoulder that does not stand out, a shelf on the shoulder line, and a front with a bust under its abdomen or a double bust.
 * @evidence contracts/testing.md#independent-expectations The sequences are anatomy's: the vertebral column's lumbar curve is convex forward and its thoracic curve concave forward (Gray 1918), the buttocks standing behind both, so the posterior reach turns max, min, max; the trunk is widest at the hips, narrowest at the natural waist (its definition) and widest again at the shoulders, so the half breadth turns max, min, max; the front may rise over the abdomen and dip at the epigastrium before the chest or bust, which a feminine person's breasts make a maximum (ISO 8559-1 bust point). The 2 mm floor is the back profile's station step (`HumanAnatomySpine.FLOOR`). Proven red here by an 8 mm backward shift of two mid-trunk layers. Oracle limits: the outlines are extremes over each ring, so a turn narrower than the station step is not read; the shoulders' half breadth includes the arm roots the `upper` chain carries; a masculine front with a flat chest passes with no turn.
 * @evidence contracts/testing.md#distinguishing-cases The core set's ten people, slender and heavy trunks of both sexes. The trunk's girths at their sites belong to `test_human_anatomy_trunk`, the two spinal sagittae to its back rows; this test owns the full sequence of each outline.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_profile_trunk`, generating the cached people in process on the CPU (body law only) with no renderer, browser or GPU.
 */
export function test_human_curves_profile_trunk(): void {
  const failures: string[] = [...made()];
  for (const name of HumanPeople.names()) {
    try {
      const p: HumanPeople.IPerson = HumanPeople.person(name);
      const feminine: boolean = (p.params.body.controls.masculineFeminine.value ?? 0) > 0;
      const S: number = p.params.body.controls.height.value!;
      const stations: HumanCurveTrunkOutline.IStation[] = HumanCurveTrunkOutline.outline(name, p.body, HumanCurveRings.scale(p));
      const rows: IRow[] = [...HumanCurveTrunkOutline.rows(name, stations, feminine), HumanCurveTrunkOutline.waist(name, HumanCurveRings.profile(name, "trunk"), S)];
      if (feminine) rows.push(HumanCurveTrunkOutline.bust(name, stations, S));
      for (const r of rows) if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(3)} ${r.unit} outside ${r.low} to ${r.high}`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} trunk outline findings:\n${failures.join("\n")}`);
}

/** f1 with two mid-trunk layers carried backward, required to fail the back outline's row. */
function made(): string[] {
  const p: HumanPeople.IPerson = HumanPeople.person("f1");
  const copy: IAutoMovieHumanBodyCalibration = structuredClone(p.body);
  const trunk: IAutoMovieHumanLoftChain = copy.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "trunk")!;
  if (trunk.basis !== "spline") return ["made backward shift: the trunk is not a spline chain, so its rings cannot be carried by their control points"];

  // A uniform B-spline's points move with all its control points (partition of unity), so adding to the x block carries the ring.
  const mid: number = Math.floor(trunk.layers.length / 2);
  for (const i of [mid, mid + 1]) {
    const l: IAutoMovieHumanLoftChain.ILayer = trunk.layers[i]!;
    for (let j: number = 0; j < trunk.order; j++) l.coefficients[j] = l.coefficients[j]! - 8;
  }
  const rows: IRow[] = HumanCurveTrunkOutline.rows("f1 shifted", HumanCurveTrunkOutline.sample(copy, HumanCurveRings.scale(p)), true);
  const out: string[] = rows.some((r: IRow): boolean => r.site.includes("(PRO-TR-7)") && !HumanAnatomyAudit.passes(r)) ? [] : ["made backward shift: the back outline's row did not fail"];

  // A shelf on the shoulder line: one `upper` layer halfway from its middle to the neck widened 15 percent across (its z block).
  const shelf: IAutoMovieHumanBodyCalibration = structuredClone(p.body);
  const upper: IAutoMovieHumanLoftChain = shelf.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "upper")!;
  const at: IAutoMovieHumanLoftChain.ILayer = upper.layers[Math.floor((3 * upper.layers.length) / 4)]!;
  for (let j: number = upper.order; j < 2 * upper.order; j++) at.coefficients[j] = 1.15 * at.coefficients[j]!;
  const widened: IRow[] = HumanCurveTrunkOutline.rows("f1 shelf", HumanCurveTrunkOutline.sample(shelf, HumanCurveRings.scale(p)), true);
  if (!widened.some((r: IRow): boolean => r.site.includes("(PRO-SH-1)") && !HumanAnatomyAudit.passes(r))) out.push("made shoulder shelf: the shoulder line's row did not fail");

  // The waist carried to the chest: every trunk layer below 0.72 S widened 30 percent, so the least girth rises above 0.70 S.
  const S: number = p.params.body.controls.height.value!;
  const k: number = HumanCurveRings.scale(p);
  const high: IAutoMovieHumanBodyCalibration = structuredClone(p.body);
  const t: IAutoMovieHumanLoftChain = high.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "trunk")!;
  for (const l of t.layers)
    if (l.y * k < 0.72 * S) {
      l.coefficients = l.coefficients.map((v: number): number => 1.3 * v);
      l.slopes = l.slopes.map((v: number): number => 1.3 * v);
    }
  const waist: IRow = HumanCurveTrunkOutline.waist("f1 waist up", HumanCurveRings.of(high, "trunk", k), S);
  if (HumanAnatomyAudit.passes(waist)) out.push(`made raised waist: the least girth read at ${waist.value.toFixed(3)} S, inside the band`);
  return out;
}
