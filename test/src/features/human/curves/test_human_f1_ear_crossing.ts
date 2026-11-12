import { type IAutoMovieViewPart, realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicSection, AutoMovieHumanF1 } from "@automovie/human";
import type { AutoMovieConstructionNode } from "@automovie/interface";

/**
 * A cut whose rail crosses onto a merged part's blend at a grazing angle is placed, on f1's ear.
 *
 * Scenario: f1's ear leaf with its helix merged as the construction merges it, and a slot cut from it along the triangular fossa, from
 * [12.5, 1573, 80] to [12.5, 1595, 80] mm, 6 mm wide and reaching 12 mm out. Its upper end runs beside the helix's front limb, and its host
 * rail leaves the leaf for the helix's blend there at a grazing angle: between the leaf's trim, a chord in the leaf's chart, and the blend's
 * own edge, the rail settles on neither face for 0.036 mm along it, though its two ends stand only 0.006 mm off the seam's chord, within
 * the 0.007 mm the seam itself stands off it. A crossing held to a hundredth of a millimetre along the rail was refused there; one admitted
 * where the rail's ends straddle the seam within the seam's own sagitta is placed, and the slot is cut with no diagnostic.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the ear's own construction subtree through `realizeAutoMovieConstruction` and reads its diagnostics and the cut's triangles.
 * @evidence contracts/development/testing.md#independent-expectations The slot's numbers are f1's fossa (`FamilyConicEar.ts --map`: its floor 74 to 80 mm out at x 11 to 16); that the rail crosses onto the blend is the refusal recorded before the change, not a property this test assumes.
 * @evidence contracts/development/testing.md#distinguishing-cases A refused crossing, a lost walk and a missing cut each leave a diagnostic or no cut triangles; only a placed crossing passes.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit that realizes one ear, about ten seconds, reached by `--include human_f1_ear_crossing`.
 * @evidence contracts/development/common.md#meaningful-documentation States the configuration, the measured gap and seam, and what changed.
 */
export function test_human_f1_ear_crossing(): void {
  const sources: Map<string, IAutoMovieViewPart> = new Map();
  const leaf = (family: AutoMovieHumanConicLoft.IFamily): AutoMovieConstructionNode => {
    const from: number = family.knots[0]!;
    const to: number = family.knots.at(-1)!;
    const count: number = Math.ceil(to - from) + 1;
    sources.set(family.name, AutoMovieHumanConicLoft.part(family, Array.from({ length: count }, (_: unknown, i: number): number => from + ((to - from) * i) / (count - 1))));
    return { type: "source", name: family.name, source: family.name };
  };
  const ear: AutoMovieHumanConicLoft.IFamily = AutoMovieHumanF1.BODY.ear;
  const helix: AutoMovieHumanConicLoft.IFamily = AutoMovieHumanF1.FAMILIES.find((member: AutoMovieHumanF1.IMember): boolean => member.family.name === "helix")!.family;
  const round: number[] = [0.45, 0.45, 0.45];
  const slot: AutoMovieHumanConicLoft.IFamily = {
    name: "slot",
    centres: [[12.5, 1573, 80], [12.5, 1595, 80]],
    halves: [],
    up: [0, 0, 1],
    layout: AutoMovieHumanConicSection.limb(0),
    knots: [3, 11, 19],
    values: [[12, 12, 12], [0, 0, 0], [4, 4, 4], [3, 3, 3], [-6, -3.5, -1.5], [0, 0, 0], [4, 4, 4], [-3, -3, -3], round, round, round, round],
    tips: [{ from: 3, tip: 0 }, { from: 19, tip: 22 }],
  };
  const rimmed: AutoMovieConstructionNode = { type: "join", kind: "merge", name: "rim.helix", host: leaf(ear), part: leaf(helix), seed: { type: "search", partFace: helix.name, hostFace: ear.name, phase: Math.PI, from: 0, to: 0.5 }, parameter: { type: "arc" }, partWidth: { type: "chord", value: 0.00025 }, hostWidth: { type: "chord", value: 0.00025 }, continuity: "G2", count: 192, rows: 4, tolerance: 1e-12, grazing: 0.04 };
  const root: AutoMovieConstructionNode = { type: "join", kind: "diff", name: "cut.slot", host: rimmed, part: leaf(slot), seed: { type: "search", partFace: slot.name, hostFace: ear.name, phase: 0, from: 0, to: 0.9 }, parameter: { type: "arc" }, partWidth: { type: "chord", value: 0.00025 }, hostWidth: { type: "chord", value: 0.00025 }, continuity: "G2", count: 192, rows: 4, tolerance: 1e-12, grazing: 0.04 };
  const real: ReturnType<typeof realizeAutoMovieConstruction> = realizeAutoMovieConstruction({ name: "f1.ear", root }, { chord: 0.0005, sources });
  if (real.diagnostics.length > 0) throw new Error("f1 ear crossing: " + JSON.stringify(real.diagnostics));
  const slotOwner: number = real.mesh.owners.indexOf("slot");
  let cut: number = 0;
  for (let t: number = 0; t < real.mesh.indices.length; t += 3) if (real.mesh.coordinates[real.mesh.indices[t]! * 3] === slotOwner) cut++;
  if (slotOwner < 0 || cut === 0) throw new Error("f1 ear crossing: the slot left no wall in the ear");
}
