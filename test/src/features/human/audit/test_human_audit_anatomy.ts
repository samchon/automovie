import { HumanAnatomyTable } from "../../internal/audit/HumanAnatomyTable";
import { HumanCurveMirror } from "../../internal/curves/HumanCurveMirror";
import { HumanCurveRings } from "../../internal/curves/HumanCurveRings";
import { HumanAnatomyAudit } from "../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../internal/HumanPeople";
import { assertHumanProvenRows } from "../../internal/region/assertHumanProvenRows";

type IRow = HumanAnatomyAudit.IRow;
type Knots = [number, number][];

/**
 * Every limb of every person keeps the anatomical relations the construction
 * does not guarantee by itself: girth order along the limb within population
 * bands, the narrowest ankle and wrist at their landmarks, one belly per
 * muscle group, a monotone taper from the belly to the least girth, and the
 * joint centres inside their sections, and each limb's girth profile its mirror twin's.
 *
 * Scenarios:
 * 1. A made leg (thigh 560 mm at the hip falling to a 370 mm knee, a 360 mm calf belly at 0.35 of the shank, a 215 mm least ankle at 0.88) and a made arm (a 265 mm forearm belly, a 160 mm least wrist at the wrist joint) pass every row for a woman.
 * 2. Each row fails on its own made defect: a 420 mm thigh (knee over thigh), a 450 mm calf (calf over knee), a 290 mm least ankle (ankle over calf), a least ankle at 0.6 of the shank and a least wrist 50 mm above the wrist joint (narrowest at the landmark), a second calf belly and a second forearm belly (one belly), a 12 mm rise in the calf's and in the forearm's taper (monotone taper), a 220 mm wrist (wrist over elbow), and the knee, ankle, elbow and wrist centres each outside its section (bone inside). A right leg identical to the left passes the mirror row; one whose calf belly is 40 mm fuller fails it.
 * 3. Every person of `HumanPeople`: both legs and both arms of the generated body, every row of `HumanAnatomyTable.TABLE` and each pair's mirror row (`HumanAnatomyTable.mirror`, against the person's own left-right input difference), every failing row listed by person, limb and relation.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person through the public body law and reads each limb chain's taut-tape girth every 2 mm by its own evaluator (`HumanCurveRings.of`), its joints' stations as the sections whose centres lie nearest the bind skeleton's joint centres, and the sections at the knee or elbow and the ankle or wrist (`HumanAnatomyTable.limbs`). It catches a limb whose girths stand out of the population's order, a narrowest ankle or wrist away from its landmark, a second belly, a wobbling taper and a bone out of its skin; any limb shaped as anatomy describes passes, whatever its size.
 * @evidence contracts/testing.md#independent-expectations Each row names its source: the ANSUR 1988 ratio bands by sex (`HumanPopulationAudit.RELATIONS`: knee over thigh, calf over knee, wrist over elbow); ANSUR II's least ankle over calf, 0.439 to 0.719; the landmark windows of consistency.md 3.1 (L6, 0.75 to 0.97 of the shank) and 3.2 (A5, 30 mm proximal to 10 mm distal of stylion, Gray 1918); one belly per muscle group and a monotone taper within ISO 20685-1's 4 mm small-girth error (consistency.md 1.2); the bone inside its skin; the mirror bound of SYM-1 (`HumanCurveMirror`, 0.5 mm round the ring plus pi times the person's largest left-right input difference). No construction constant enters. Oracle limits: joints are placed on the profile by nearest section centre, so a joint off its limb's axis lands at the nearest section; the population bands bind the figure's ratios, not each input.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the made leg and arm. Negative: one defect per row, each required to fail that row. The person pass reads both sexes and the population ends. Inputs read back on the skin belong to `test_human_audit_inputs`; section shape to `test_human_audit_sections`; the input set's own population relations to `test_human_people`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_audit_anatomy`, building its made limbs and generating its people in process on the CPU (body law only) with no renderer, browser or GPU; nothing is cached across tests.
 */
export function test_human_audit_anatomy(): void {
  assertHumanProvenRows("anatomy relation", proofs, (name: string): IRow[] => {
    const p: HumanPeople.IPerson = HumanPeople.person(name);
    const limbs: HumanAnatomyTable.ILimb[] = HumanAnatomyTable.limbs(p.body, HumanCurveRings.scale(p));
    return [...HumanAnatomyTable.rows(name, limbs, HumanPeople.sex(name)), ...HumanAnatomyTable.mirror(name, limbs, HumanCurveMirror.difference(p.params))];
  });
}

/** The made limbs' proofs: every row green on the sound limbs and red on its own defect. */
function proofs(): string[] {
  const out: string[] = [];
  const thigh: Knots = [
    [0, 560],
    [1, 370],
  ];
  const shank: Knots = [
    [0, 370],
    [0.1, 350],
    [0.35, 360],
    [0.88, 215],
    [1, 240],
    [1.03, 245],
  ];
  const upper: Knots = [
    [0, 300],
    [1, 250],
  ];
  const fore: Knots = [
    [0, 250],
    [0.3, 265],
    [1, 160],
    [1.04, 170],
  ];
  const sound: HumanAnatomyTable.ILimb[] = [made("leg", thigh, shank, [5, 0]), made("arm", upper, fore, [5, 0])];
  for (const r of HumanAnatomyTable.rows("made", sound, "female").filter((x: IRow): boolean => !HumanAnatomyAudit.passes(x))) out.push(`sound limbs: ${r.site} reads ${r.value}`);

  // One defect per relation, each required to fail its own row.
  const defects: [string, HumanAnatomyTable.ILimb][] = [
    ["ORD-LG-knee/thigh", made("leg", [[0, 420], [1, 370]], shank, [5, 0])],
    ["ORD-LG-calf/knee", made("leg", thigh, [[0, 370], [0.1, 350], [0.35, 450], [0.88, 215], [1, 240], [1.03, 245]], [5, 0])],
    ["PRO-LG-ankle/calf", made("leg", thigh, [[0, 370], [0.1, 350], [0.35, 360], [0.88, 290], [1, 300], [1.03, 305]], [5, 0])],
    ["PRO-narrowest", made("leg", thigh, [[0, 370], [0.1, 350], [0.35, 360], [0.6, 215], [1, 240], [1.03, 245]], [5, 0])],
    ["PRO-narrowest", made("arm", upper, [[0, 250], [0.3, 265], [0.8, 160], [1, 175], [1.04, 180]], [5, 0])],
    ["PRO-one-belly", made("leg", thigh, [[0, 370], [0.1, 350], [0.35, 360], [0.5, 320], [0.65, 355], [0.88, 215], [1, 240], [1.03, 245]], [5, 0])],
    ["PRO-taper", made("leg", thigh, [[0, 370], [0.1, 350], [0.35, 360], [0.6, 280], [0.68, 292], [0.88, 215], [1, 240], [1.03, 245]], [5, 0])],
    ["ORD-AR-wrist/elbow", made("arm", upper, [[0, 250], [0.3, 265], [1, 220], [1.04, 230]], [5, 0])],
    ["PRO-one-belly", made("arm", upper, [[0, 250], [0.3, 265], [0.45, 235], [0.6, 262], [1, 160], [1.04, 170]], [5, 0])],
    ["PRO-taper", made("arm", upper, [[0, 250], [0.3, 265], [0.6, 200], [0.68, 212], [1, 160], [1.04, 170]], [5, 0])],
    ["BONE-inside", made("leg", thigh, shank, [70, 0])],
    ["BONE-inside", made("leg", thigh, shank, [5, 0], [45, 0])],
    ["BONE-inside", made("arm", upper, fore, [50, 0])],
    ["BONE-inside", made("arm", upper, fore, [5, 0], [30, 0])],
  ];
  for (const [id, limb] of defects)
    if (!HumanAnatomyTable.rows("made", [limb], "female").some((r: IRow): boolean => r.site.endsWith(`(${id})`) && !HumanAnatomyAudit.passes(r))) out.push(`made defect: no failing ${id} row on the ${limb.kind}`);

  // Mirror: a right leg identical to the left passes; one whose calf belly is 40 mm fuller fails at no input difference.
  const twin: HumanAnatomyTable.ILimb = { ...made("leg", thigh, shank, [5, 0]), side: "right" };
  const fuller: HumanAnatomyTable.ILimb = { ...made("leg", thigh, [[0, 370], [0.1, 350], [0.35, 400], [0.88, 215], [1, 240], [1.03, 245]], [5, 0]), side: "right" };
  const left: HumanAnatomyTable.ILimb = made("leg", thigh, shank, [5, 0]);
  if (HumanAnatomyTable.mirror("made", [left, twin], 0).some((r: IRow): boolean => !HumanAnatomyAudit.passes(r))) out.push("mirror: identical sides fail");
  if (!HumanAnatomyTable.mirror("made", [left, fuller], 0).some((r: IRow): boolean => !HumanAnatomyAudit.passes(r))) out.push("mirror: a right calf 40 mm fuller passes");
  return out;
}

/**
 * A made limb profile every 2 mm: the proximal segment 400 mm (a leg) or
 * 300 mm (an arm), the distal one 400 or 260 mm, each girth the cosine-eased
 * run between its knots (shares of its segment, monotone between knots), the
 * distal knots carried past the distal joint where they reach beyond 1; the
 * sections at the middle and distal joints circles of radius girth over
 * `2 pi`, the middle joint at `offset` and the distal joint at `end` from
 * their circles' centres.
 */
function made(kind: "leg" | "arm", proximal: Knots, distal: Knots, offset: [number, number], end: [number, number] = [0, 0]): HumanAnatomyTable.ILimb {
  const step: number = 2;
  const [a, b]: [number, number] = kind === "leg" ? [200, 200] : [150, 130];
  const beyond: number = Math.round((distal[distal.length - 1]![0] - 1) * b);
  const girth: number[] = [];
  for (let i: number = 0; i <= a + b + beyond; i++) girth.push(i <= a ? eased(proximal, i / a) : eased(distal, (i - a) / b));
  const circle: (g: number) => [number, number][] = (g: number): [number, number][] => Array.from({ length: 96 }, (_: unknown, m: number): [number, number] => [(g / (2 * Math.PI)) * Math.cos((2 * Math.PI * m) / 96), (g / (2 * Math.PI)) * Math.sin((2 * Math.PI * m) / 96)]);
  return {
    kind,
    side: "left",
    girth,
    joints: [0, a, a + b],
    step,
    sections: [
      { ring: circle(girth[a]!), joint: offset, label: kind === "leg" ? "knee" : "elbow" },
      { ring: circle(girth[a + b]!), joint: end, label: kind === "leg" ? "ankle" : "wrist" },
    ],
  };
}

/** The cosine-eased run through knots `[share, girth]` at a share; flat past the last knot. */
function eased(knots: Knots, x: number): number {
  for (let i: number = 0; i + 1 < knots.length; i++) {
    const [x0, g0]: [number, number] = knots[i]!;
    const [x1, g1]: [number, number] = knots[i + 1]!;
    if (x <= x1) return g0 + ((g1 - g0) * (1 - Math.cos((Math.PI * Math.max(0, x - x0)) / (x1 - x0)))) / 2;
  }
  return knots[knots.length - 1]![1];
}
