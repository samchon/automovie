import type { AutoMovieHumanSkeletonLaw } from "../../../../../../packages/human/src/generation/AutoMovieHumanSkeletonLaw";
import type { IAutoMovieHumanBodyCalibration } from "../../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanCurveProfileArm } from "../../../internal/curves/HumanCurveProfileArm";
import { HumanCurveRings } from "../../../internal/curves/HumanCurveRings";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";

type IRow = HumanAnatomyAudit.IRow;

/**
 * Pins that every person's composed arm chain, cut every 2 mm from the
 * shoulder root to the wrist, has the girth profile of a human arm: the root
 * at least the mid upper arm, a taper to the supracondylar waist, the elbow
 * rising or holding into one forearm belly, a monotone fall to the wrist with
 * at most one inflection, and the wrist the arm's narrowest site.
 *
 * Scenarios:
 * 1. A copy of f1's left arm with two neighbouring layers in the forearm's lower half swollen and shrunk 7 percent fails the forearm-to-wrist excess.
 * 2. A copy with its last layers before the wrist centre swollen 80 percent fails the wrist's order under the forearm belly.
 * 3. Every person of `HumanPeople`: every row is read on both arms and every row out of its expectation is listed by person, side and rule.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person through the public body law and evaluates its delivered `arm.left` and `arm.right` chains at every station 2 mm apart (`HumanCurveRings`), placing each station by its section centre's nearest point on the bind skeleton's bone polyline (shoulder centre, elbow, wrist): the mid upper arm midway between the acromion (34.1 mm above the shoulder centre, de Leva 1996) and the elbow centre, the supracondylar waist the least girth from there to the elbow, the forearm's belly the widest within 0.1 to 0.6 of the forearm, the wrist the station 1.5 mm before the wrist centre (stylion). It reads the forearm belly and the elbow over the wrist, the root over the mid upper arm, the root under half the `trunk` chain's girth at the axilla (the scye wraps the deltoid and the axillary folds, the trunk the whole chest), and the excess variation of the root-to-mid upper arm, mid upper arm-to-waist, waist-to-belly and belly-to-wrist spans with the inflections of the last. It catches a mitten wrist, a narrowing into the shoulder, a bulge above the elbow, a waist at the elbow, a wobble or second belly on the forearm.
 * @evidence contracts/testing.md#independent-expectations Expectations are the person's intrinsic arm profile (`packages/human/docs/testing/consistency.md` section 3.2) and cited anatomy: ANSUR 1988 wrist over elbow 0.635 (SD 0.023), so the wrist is narrower than the elbow and than the forearm's belly in every adult; the deltoid inserts at mid-humerus and the biceps and triceps taper to their tendons, so the upper arm falls to its supracondylar waist; the forearm holds one belly of the flexor-extensor mass whose tendons begin below its middle (Gray 1918). Noise floors are ISO 20685-1:2018 Table 4's 4 mm (9 mm at the root, where the arm meets the trunk's large girth). Proven here: the made ripple and the made wrist each turn their own row red. Oracle limits: the joints come from the bind skeleton, so a misplaced joint moves the windows; the root's first stations read the arm's own chain, not the shoulder's.
 * @evidence contracts/testing.md#distinguishing-cases Both arms of the core set's ten people, slender and muscular arms of both sexes and of both ends of length. Each tape's value at its site belongs to `test_human_anatomy_arm`, the order of tapes against their inputs to `test_human_curves_region_order`, the arm's curve soundness to `test_human_curve_arm`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_profile_arm`, generating the cached people in process on the CPU (body law only) with no renderer, browser or GPU.
 */
export function test_human_curves_profile_arm(): void {
  const failures: string[] = [...made()];
  for (const name of HumanPeople.names()) {
    try {
      const p: HumanPeople.IPerson = HumanPeople.person(name);
      for (const r of HumanCurveProfileArm.rows(name, p.body, HumanCurveRings.scale(p), (chain: string): HumanCurveRings.IProfile => HumanCurveRings.profile(name, chain)))
        if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(3)} ${r.unit} outside ${r.low.toFixed(3)} to ${r.high.toFixed(3)}`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} arm profile findings:\n${failures.join("\n")}`);
}

/** Made defects on copies of f1's composed left arm, each required to fail its own row. */
function made(): string[] {
  const out: string[] = [];
  const p: HumanPeople.IPerson = HumanPeople.person("f1");
  const k: number = HumanCurveRings.scale(p);
  const arm: IAutoMovieHumanLoftChain = p.body.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "arm.left")!;
  const at: (bone: string) => number[] = (bone: string): number[] => p.body.skeleton!.find((b: AutoMovieHumanSkeletonLaw.IBone): boolean => b.bone === bone)!.position;
  const dist: (a: number[], b: number[]) => number = (a: number[], b: number[]): number => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
  const upper: number = dist(at("leftUpperArm"), at("leftLowerArm"));
  const fore: number = dist(at("leftLowerArm"), at("leftHand"));
  const index: number[] = arm.layers.map((_: IAutoMovieHumanLoftChain.ILayer, i: number): number => i);

  // Two neighbouring layers in the forearm's lower half, swollen and shrunk 7 percent.
  const lower: number[] = index.filter((i: number): boolean => arm.layers[i]!.y > upper + 0.6 * fore && arm.layers[i]!.y < upper + 0.9 * fore);
  const ripple: Map<number, number> = lower.length >= 2 ? new Map([[lower[0]!, 1.07], [lower[0]! + 1, 0.93]]) : new Map();

  // The layers within 5 percent of the forearm before the wrist centre, swollen 80 percent.
  const wrist: Map<number, number> = new Map(index.filter((i: number): boolean => arm.layers[i]!.y > upper + 0.95 * fore).map((i: number): [number, number] => [i, 1.8]));

  const cases: [string, Map<number, number>, string][] = [
    ["forearm ripple", ripple, "(PRO-AR-4)"],
    ["swollen wrist", wrist, "(ORD-AR-1)"],
  ];
  for (const [label, factors, rule] of cases) {
    if (factors.size === 0) {
      out.push(`made ${label}: f1's left arm has no layer in the edited window`);
      continue;
    }
    const copy: IAutoMovieHumanBodyCalibration = structuredClone(p.body);
    const c: IAutoMovieHumanLoftChain = copy.chains.find((x: IAutoMovieHumanLoftChain): boolean => x.name === "arm.left")!;
    for (const [i, f] of factors) {
      const l: IAutoMovieHumanLoftChain.ILayer = c.layers[i]!;
      l.coefficients = l.coefficients.map((v: number): number => v * f);
      l.slopes = l.slopes.map((v: number): number => v * f);
      if (l.curvatures !== undefined) l.curvatures = l.curvatures.map((v: number): number => v * f);
    }
    const rows: IRow[] = HumanCurveProfileArm.rows(`f1 ${label}`, copy, k, (chain: string): HumanCurveRings.IProfile => HumanCurveRings.of(copy, chain, k));
    if (!rows.some((r: IRow): boolean => r.site.startsWith("arm.left") && r.site.endsWith(rule) && !HumanAnatomyAudit.passes(r))) out.push(`made ${label}: no failing ${rule} row on the left arm`);
  }
  return out;
}
