import type { IAutoMovieHumanBodyCalibration } from "../../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanCurveProfile } from "../../../internal/curves/HumanCurveProfile";
import { HumanCurveProfileLeg } from "../../../internal/curves/HumanCurveProfileLeg";
import { HumanCurveRings } from "../../../internal/curves/HumanCurveRings";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";

type IRow = HumanAnatomyAudit.IRow;

/**
 * Pins that every person's composed leg chain, cut every 2 mm from the ankle
 * ring to the crotch ring, has the girth profile of a human leg built from
 * that person's own tapes: the thigh wider than the knee, one calf belly, a
 * monotone fall from the calf to the least ankle with at most one
 * inflection, and the least ankle in its human ratio to the calf, just above
 * the malleoli.
 *
 * Scenarios:
 * 1. The profile readings on analytic sequences: a monotone run reads no excess and no turn; one reversal of 1 reads an excess of 2 and two turns above a 0.5 floor, none above 1.5; a cubic reads one inflection, a line none, two periods of a sine three.
 * 2. A copy of f1's left leg with one layer in the calf's fall swollen 7 percent and the next shrunk 7 percent reads exactly those factors at the two layers, and fails the calf-to-ankle excess.
 * 3. A copy with every layer below the calf's window swollen 40 percent fails least ankle over calf.
 * 4. A copy with every layer more than 20 mm above the knee centre halved fails thigh over knee.
 * 5. Every person of `HumanPeople`: every row is read on both legs and every row out of its expectation is listed by person, chain and rule.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person through the public body law and evaluates its delivered `leg.left` and `leg.right` chains by `AutoMovieHumanLoftChain.ring` at every station 2 mm apart, layers and mid-sections alike, reading each section's taut-tape girth (the perimeter of its hull in its own Newell plane, 192 phases) and centre; the crotch is the chain's top ring, the knee and ankle levels the bind skeleton's joint centres, and the thigh (widest from 10 mm to 0.1 S under the crotch), mid-patella (widest within 20 mm below the knee centre), calf belly (widest within 0.15 to 0.6 of the shank below the knee), infrapatellar waist and least ankle the profile's own extremes in those windows. It reads thigh over knee, least ankle over calf, the least ankle's depth as a share of the shank, the excess variation and inflections of the calf's fall to the least ankle, the excess of the rise from the infrapatellar waist to the calf, the interior turns from the knee to the thigh, and the excess from the thigh's widest to the crotch ring, and the thigh's girth over the hip's (the `trunk` chain's widest girth from the crotch ring to 0.62 S; ANSUR 1988 thigh over hip 0.600 and 0.606, SD 0.020, 3 SD band 0.540 to 0.666). It catches a thigh with no mass above the knee, a swollen ankle, an ankle narrowest at mid-shank, a wobble or ridge from calf to ankle, a second calf belly, a bulge on the thigh's taper, and a dip under the crotch, each named by side and rule.
 * @evidence contracts/testing.md#independent-expectations Expectations are the person's intrinsic leg profile (`packages/human/docs/testing/consistency.md` section 3.1) and cited anatomy, never a reference shape or a construction constant: ANSUR 1988 knee over thigh 0.631 (SD 0.029), so the thigh always outgirths the knee; ANSUR II least ankle over calf 0.578 and 0.585, 2.326 SD band 0.439 to 0.719; the calf one gastrocnemius belly whose tendon begins about mid-calf (Gray 1918), so the fall is one monotone run with at most one inflection; the least ankle above the malleoli, 0.75 to 0.97 of the shank. The noise floor is ISO 20685-1:2018 Table 4's small-circumference error, 4 mm (9 mm at the thigh's top, a large circumference); excess variation reads 2a for a reversal of a, and an inflection counts where the second difference over a tenth of the shank exceeds `8 e / w^2`, a parabola rising e over that chord. Proven here: the analytic readings of scenario 1 are exact; the made copies move the girth at the edited layers by exactly the edit's factor (1.07 and 0.93 within 1e-6) and turn their own rows red. Oracle limits: the knee and ankle levels come from the construction's bind skeleton, so a misplaced joint moves its windows with it; the profile reads horizontal-standing sections only as far as the chain's own planes are horizontal; mid-patella is the widest section near the knee centre, not a palpated patella.
 * @evidence contracts/testing.md#distinguishing-cases Both legs of the core set (four references and six population ends: small and large, tall-light and short-heavy, both sexes), so a thin and a heavy thigh, a short and a long shank, a calf larger or smaller than its knee (calf over knee 0.966, SD 0.041, either order human) are each read. Knee against calf order follows the inputs and is not read here; the skin girths at the tapes' sites belong to `test_human_anatomy_leg`, surface soundness to `test_human_curve_leg`, and the leg's pieces, once the leg is announced divided, to the part tester.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_profile_leg`, generating the cached people in process on the CPU (body law only, no skin, rig, browser or GPU); profiles are sampled once per person and chain through `HumanCurveRings.profile`.
 */
export function test_human_curves_profile_leg(): void {
  const failures: string[] = [...controls(), ...made()];

  // Every person is read even when another fails, so one run lists everything.
  for (const name of HumanPeople.names()) {
    try {
      const p: HumanPeople.IPerson = HumanPeople.person(name);
      const rows: IRow[] = HumanCurveProfileLeg.rows(name, p.body, p.params.body.controls.height.value!, HumanCurveRings.scale(p), (chain: string): HumanCurveRings.IProfile =>
        HumanCurveRings.profile(name, chain),
      );
      for (const r of rows) if (!HumanAnatomyAudit.passes(r)) failures.push(format(r));
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} leg profile findings:\n${failures.join("\n")}`);
}

/** The profile readings on analytic sequences whose answers are known exactly. */
function controls(): string[] {
  const out: string[] = [];
  const P: typeof HumanCurveProfile = HumanCurveProfile;
  const expect: (label: string, value: number, wanted: number) => void = (label: string, value: number, wanted: number): void => {
    if (Math.abs(value - wanted) > 1e-9) out.push(`control ${label}: read ${value}, expected ${wanted}`);
  };
  expect("monotone run, excess", P.excess([0, 1, 2, 3, 4]), 0);
  expect("monotone run, turns", P.turns([0, 1, 2, 3, 4], 0.5).length, 0);
  expect("one reversal of 1, excess", P.excess([0, 1, 2, 3, 2, 3, 4]), 2);
  expect("one reversal of 1, turns above 0.5", P.turns([0, 1, 2, 3, 2, 3, 4], 0.5).length, 2);
  expect("one reversal of 1, turns above 1.5", P.turns([0, 1, 2, 3, 2, 3, 4], 1.5).length, 0);

  // Samples every 2 mm over 200 mm; a tenth-of-the-span window and a 4 mm floor.
  const x: number[] = Array.from({ length: 101 }, (_: unknown, i: number): number => -100 + 2 * i);
  expect("cubic, inflections", P.inflections(x.map((t: number): number => (t / 10) ** 3), 2, 20, 4), 1);
  expect("line, inflections", P.inflections(x.map((t: number): number => 3 * t), 2, 20, 4), 0);
  expect("two sine periods of 40 mm amplitude, inflections", P.inflections(x.map((t: number): number => 40 * Math.sin((2 * Math.PI * t) / 100)), 2, 20, 4), 3);
  return out;
}

/** Made defects on copies of f1's composed left leg, each required to fail its own row and to move its reading by its known factor. */
function made(): string[] {
  const out: string[] = [];
  const p: HumanPeople.IPerson = HumanPeople.person("f1");
  const k: number = HumanCurveRings.scale(p);
  const S: number = p.params.body.controls.height.value!;
  const leg: IAutoMovieHumanLoftChain = p.body.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "leg.left")!;
  const joint: (bone: string) => number = (bone: string): number => p.body.skeleton!.find((b: { bone: string }): boolean => b.bone === bone)!.position[1];
  const knee: number = joint("leftLowerLeg");
  const ankle: number = joint("leftFoot");
  const index: number[] = leg.layers.map((_: IAutoMovieHumanLoftChain.ILayer, i: number): number => i);

  // Two neighbouring layers in the middle of the calf's fall, swollen and
  // shrunk 7 percent: a reversal of about 7 percent of the girth there.
  const fall: number[] = index.filter((i: number): boolean => leg.layers[i]!.y < knee - 0.15 * (knee - ankle));
  const middle: number = fall[Math.floor(fall.length / 2)]!;
  const ripple: Map<number, number> = new Map([
    [middle, 1.07],
    [middle + 1, 0.93],
  ]);

  // Every layer below the calf's window swollen 40 percent: the least ankle
  // then stands at the calf window's foot, far above its ratio to the calf.
  const below: Map<number, number> = new Map(index.filter((i: number): boolean => leg.layers[i]!.y < knee - 0.6 * (knee - ankle)).map((i: number): [number, number] => [i, 1.4]));

  // Every layer more than 20 mm above the knee centre halved: a thigh narrower than its knee.
  const halved: Map<number, number> = new Map(index.filter((i: number): boolean => leg.layers[i]!.y > knee + 20).map((i: number): [number, number] => [i, 0.5]));

  const cases: [string, Map<number, number>, string][] = [
    ["shank ripple", ripple, "(PRO-LG-5)"],
    ["swollen lower shank", below, "(ORD-LG-2)"],
    ["thigh halved", halved, "(ORD-LG-1)"],
  ];

  for (const [label, factors, rule] of cases) {
    const copy: IAutoMovieHumanBodyCalibration = scaled(p.body, "leg.left", factors);

    // The edit's own size: each edited layer's girth moves by exactly its factor.
    if (label === "shank ripple")
      for (const [i, f] of factors) {
        const y: number = leg.layers[i]!.y;
        const ratio: number = HumanCurveRings.girthAt(copy, "leg.left", y, k) / HumanCurveRings.girthAt(p.body, "leg.left", y, k);
        if (Math.abs(ratio - f) > 1e-6) out.push(`made ${label}: layer ${i} girth moved by ${ratio}, expected ${f}`);
      }

    const rows: IRow[] = HumanCurveProfileLeg.rows(`f1 ${label}`, copy, S, k, (chain: string): HumanCurveRings.IProfile => HumanCurveRings.of(copy, chain, k));
    if (!rows.some((r: IRow): boolean => r.site.startsWith("leg.left") && r.site.endsWith(rule) && !HumanAnatomyAudit.passes(r)))
      out.push(`made ${label}: no failing ${rule} row on the left leg`);
  }
  return out;
}

/** A copy of a body with one chain's layers scaled about their planes' origins, values, slopes and curvatures alike. */
function scaled(body: IAutoMovieHumanBodyCalibration, chain: string, factors: Map<number, number>): IAutoMovieHumanBodyCalibration {
  const copy: IAutoMovieHumanBodyCalibration = structuredClone(body);
  const c: IAutoMovieHumanLoftChain = copy.chains.find((x: IAutoMovieHumanLoftChain): boolean => x.name === chain)!;
  for (const [i, f] of factors) {
    const layer: IAutoMovieHumanLoftChain.ILayer = c.layers[i]!;
    layer.coefficients = layer.coefficients.map((v: number): number => v * f);
    layer.slopes = layer.slopes.map((v: number): number => v * f);
    if (layer.curvatures !== undefined) layer.curvatures = layer.curvatures.map((v: number): number => v * f);
  }
  return copy;
}

/** One finding line. */
function format(r: IRow): string {
  return `${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(3)} ${r.unit} outside ${r.low.toFixed(3)} to ${r.high.toFixed(3)}`;
}
