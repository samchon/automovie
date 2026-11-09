import { HumanInspectionAnatomyOrder as O } from "../../../../../packages/human/src/inspection/HumanInspectionAnatomyOrder";

/**
 * The anatomical order detectors report every broken relation on made
 * readings and nothing on readings that keep the anatomy.
 *
 * Scenarios:
 * 1. Girths and heights at the ANSUR women's means: no finding. Red: the wrist and forearm girths swapped, the neck larger than the neck base, the jugular notch above cervicale: exactly those relations.
 * 2. One belly: a single-peaked calf profile passes; a two-peaked one is reported; a dip under the tolerance is not a second belly.
 * 3. Taper: a narrowing forearm passes; a step that widens is reported.
 * 4. Extremum at its site: the least of a wrist profile at stylion passes; moved 20 mm away it is reported.
 * 5. Axis inside: a circle's centre passes; a point outside is reported.
 * 6. Mirror: points reflected across z = 0 pass; a right point moved 2 mm is reported against a 1 mm tolerance.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `order`, `belly`, `taper`, `extremum`, `inside` and `mirror` of `HumanInspectionAnatomyOrder` on made readings and reads their findings.
 * @evidence contracts/testing.md#independent-expectations The made readings are written here to keep or break each order by construction (survey means, swapped pairs, a two-peaked sine, a moved point), so each expected finding follows from the relation's statement, not from the detector.
 * @evidence contracts/testing.md#distinguishing-cases Green and red for every detector; a sub-tolerance dip and an absent measure are not findings.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_inspection_anatomy_order`, on made readings with no person, reference, mesh or browser.
 */
export function test_human_inspection_anatomy_order(): void {
  const failures: string[] = [];
  const women: Record<string, number> = {
    wristCircumference: 154.8,
    forearmCircumference: 237.6,
    ankleCircumference: 215.7,
    calfCircumference: 373.3,
    kneeCircumference: 365.2,
    thighCircumference: 580.3,
    lowerThighCircumference: 400.7,
    neckCircumference: 329.8,
    neckBaseCircumference: 346.2,
    underbustCircumference: 769.7,
    chestCircumference: 907.1,
    wristBreadth: 49.4,
    elbowBreadth: 61.9,
    bimalleolarBreadth: 64.4,
    kneeBreadth: 90.5,
    midpatellaHeight: 450,
    glutealFurrowHeight: 744.3,
    waistHeight: 1056.5,
    axillaHeight: 1239.0,
    suprasternaleHeight: 1330.3,
    acromialHeight: 1335.1,
    cervicaleHeight: 1395.7,
    stature: 1628.5,
  };
  const all: O.IRelation[] = [...O.GIRTHS, ...O.HEIGHTS];
  const green: O.IFinding[] = O.order(women, all);
  if (green.length !== 0) failures.push(`women's means: ${green.map((f: O.IFinding): string => f.rule).join("; ")}`);
  const broken: Record<string, number> = { ...women, wristCircumference: 237.6, forearmCircumference: 154.8, neckCircumference: 350, suprasternaleHeight: 1400 };
  const red: string[] = O.order(broken, all)
    .map((f: O.IFinding): string => f.rule)
    .sort((a: string, b: string): number => a.localeCompare(b));
  const want: string[] = ["neckCircumference < neckBaseCircumference", "suprasternaleHeight < cervicaleHeight", "wristCircumference < forearmCircumference"];
  if (JSON.stringify(red) !== JSON.stringify(want)) failures.push(`broken readings report ${JSON.stringify(red)}, expected ${JSON.stringify(want)}`);
  const partial: Record<string, number> = { wristCircumference: 154.8 };
  if (O.order(partial, all).length !== 0) failures.push("an absent measure was reported");

  // 2. One belly.
  const stations: number[] = Array.from({ length: 41 }, (_: unknown, i: number): number => i / 40);
  const one: number[] = stations.map((s: number): number => 330 + 40 * Math.sin(Math.PI * s));
  const two: number[] = stations.map((s: number): number => 330 + 40 * Math.abs(Math.sin(2 * Math.PI * s)));
  const shallow: number[] = stations.map((s: number): number => 330 + 40 * Math.sin(Math.PI * s) + (Math.abs(s - 0.5) < 0.05 ? -0.5 : 0));
  if (O.belly("calf", one, 1).length !== 0) failures.push("a single-peaked calf was reported");
  if (O.belly("calf", two, 1).length !== 1) failures.push("a two-peaked calf was not reported");
  if (O.belly("calf", shallow, 1).length !== 0) failures.push("a dip under the tolerance was counted as a second belly");

  // 3. Taper.
  const forearm: number[] = stations.map((s: number): number => 240 - 80 * s);
  if (O.taper("forearm", forearm, -1).length !== 0) failures.push("a narrowing forearm was reported");
  const widened: number[] = forearm.map((v: number, i: number): number => (i === 20 ? v + 10 : v));
  if (O.taper("forearm", widened, -1).length !== 1) failures.push("a widening step was not reported once");

  // 4. Extremum at its site: the wrist's least girth at stylion (station 100 mm).
  const along: number[] = Array.from({ length: 201 }, (_: unknown, i: number): number => i);
  const wrist: number[] = along.map((s: number): number => 150 + 0.002 * (s - 100) ** 2);
  if (O.extremum("wrist", along, wrist, 100, 2, "min").length !== 0) failures.push("the narrowest wrist at stylion was reported");
  const moved: number[] = along.map((s: number): number => 150 + 0.002 * (s - 120) ** 2);
  if (O.extremum("wrist", along, moved, 100, 2, "min").length !== 1) failures.push("a narrowest wrist 20 mm from stylion was not reported");

  // 5. Axis inside its section.
  const circle: [number, number][] = Array.from({ length: 64 }, (_: unknown, k: number): [number, number] => [40 * Math.cos((2 * Math.PI * k) / 64), 40 * Math.sin((2 * Math.PI * k) / 64)]);
  if (O.inside("thigh", circle, [5, -3]).length !== 0) failures.push("an axis inside its circle was reported");
  if (O.inside("thigh", circle, [45, 0]).length !== 1) failures.push("an axis outside its circle was not reported");

  // 6. Mirror.
  const pairs: { name: string; left: [number, number, number]; right: [number, number, number] }[] = [
    { name: "acromion", left: [10, 1400, -180], right: [10, 1400, 180] },
    { name: "hip", left: [0, 900, -85], right: [0, 900, 85] },
  ];
  if (O.mirror(pairs, 1).length !== 0) failures.push("mirrored points were reported");
  if (O.mirror([{ ...pairs[0]!, right: [12, 1400, 180] }], 1).length !== 1) failures.push("a right point 2 mm off was not reported");
  if (failures.length !== 0) throw new Error(`${failures.length} anatomy order failures:\n${failures.join("\n")}`);
}
