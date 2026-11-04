import type { IAutoMovieHumanBodyCalibration } from "../../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanCurveDigitGirth } from "../../../internal/curves/HumanCurveDigitGirth";
import { HumanCurveDigitOrder } from "../../../internal/curves/HumanCurveDigitOrder";
import { HumanCurveRings } from "../../../internal/curves/HumanCurveRings";
import { HumanCurveJoints } from "../../../internal/curves/HumanCurveJoints";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;

/**
 * Pins that every person's fingers and toes stand in their anatomical order
 * at the neutral: each finger's joints follow one another out from the
 * palm, the knuckles arc with the third most distal, the foot's joints run
 * forward from the ankle, the first or second toe is the longest and the
 * other three step back.
 *
 * Scenarios:
 * 1. f1's neutral joints with the left fifth knuckle moved 20 mm distally fail the knuckle arc; with the left fifth toe's distal joint moved 40 mm forward they fail the toes' order.
 * 2. A copy of f1 whose left little finger chain is scaled to twice its girth fails the little finger's thickness order.
 * 3. Every person of `HumanPeople`: both hands and feet are read, joints and digit thickness (each digit chain's widest section over its first half), and every row out of order is listed by person, side and digit.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates each person's anatomical neutral through the public pose evaluator (`HumanCurveJoints`, once per person) and reads each joint's place along its part's axis: the hand's from the wrist centre to the third knuckle, the foot's from the ankle centre to the second toe's MTP in the ground plane. It reads every finger's PIP over its MCP and DIP over its PIP, the knuckles' arc, the midfoot over the ankle, each toe's MTP and distal joint forward of the one before, and the toes' tip order. It also reads each digit chain's widest section over its first half (`HumanCurveDigitGirth`): the thumb thicker than the middle finger and the little finger thinner than the other three (Greiner 1991; Bridgman 1920), the hallux thicker than the second toe and the second than the fifth. It catches a finger folded back into the palm, a little finger or toe thicker than its neighbours, a knuckle line straight or reversed, a foot hung from its toes, a fifth toe reaching past the third, and a third toe longer than both the first and the second.
 * @evidence contracts/testing.md#independent-expectations Anatomy gives every order: at the neutral the fingers are extended (DGUV Neutral-0), so their joints follow one another along the hand; the heads of metacarpals II to V form an arc whose crest is the third (Bridgman 1920); the hallux or the second toe is the longest (Egyptian and Greek foot types, both normal) and the lesser toes shorten laterally. Gaps must exceed ISO 20685-1:2018 Table 4's 1 mm for the hand's dimensions and 2 mm for the foot's along a digit; the knuckles' and tips' orders need only be strict. Proven red here on f1's own joints edited in memory. Oracle limits: joint centres stand for the skin tips, which lie a pad's depth beyond; the axis comes from the rig.
 * @evidence contracts/testing.md#distinguishing-cases Both hands and feet of the core set's ten people, of every hand and foot length. The fingers' lengths along their own skin belong to `test_human_anatomy_hand`, the foot's length and breadth to `test_human_anatomy_foot`, the digits' skin to the part testers once the hand and foot are announced divided.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_region_digits`, preparing the cached people's rigs in process on the CPU with no skin, renderer, browser or GPU.
 */
export function test_human_curves_region_digits(): void {
  const failures: string[] = [...made()];
  for (const name of HumanPeople.names()) {
    try {
      const p: HumanPeople.IPerson = HumanPeople.person(name);
      const body: IAutoMovieHumanBodyCalibration = p.body;
      const read: (chain: string) => HumanCurveRings.IProfile = (chain: string): HumanCurveRings.IProfile => HumanCurveRings.profile(p, chain);
      for (const r of [...HumanCurveDigitOrder.rows(name, HumanCurveJoints.of(name, {})), ...HumanCurveDigitGirth.rows(name, body, read)])
        if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(2)} ${r.unit}, at least ${r.low.toFixed(2)}`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} digit order findings:\n${failures.join("\n")}`);
}

/** f1's neutral joints edited in memory, each required to fail its own row. */
function made(): string[] {
  const out: string[] = [];
  const neutral: HumanCurveJoints.Joints = HumanCurveJoints.of("f1", {});
  const hand: V3 = neutral.get("leftHand")!;
  const mcp3: V3 = neutral.get("leftMiddleProximal")!;
  const length: number = Math.hypot(mcp3[0] - hand[0], mcp3[1] - hand[1], mcp3[2] - hand[2]);
  const axis: V3 = [(mcp3[0] - hand[0]) / length, (mcp3[1] - hand[1]) / length, (mcp3[2] - hand[2]) / length];
  const move: (j: HumanCurveJoints.Joints, bone: string, d: V3) => HumanCurveJoints.Joints = (j: HumanCurveJoints.Joints, bone: string, d: V3): HumanCurveJoints.Joints => {
    const copy: HumanCurveJoints.Joints = new Map(j);
    const p: V3 = copy.get(bone)!;
    copy.set(bone, [p[0] + d[0], p[1] + d[1], p[2] + d[2]]);
    return copy;
  };
  const fails: (j: HumanCurveJoints.Joints, rule: string) => boolean = (j: HumanCurveJoints.Joints, rule: string): boolean =>
    HumanCurveDigitOrder.rows("f1 made", j).some((r: IRow): boolean => r.site.startsWith("left") && r.site.endsWith(`(${rule})`) && !HumanAnatomyAudit.passes(r));

  if (!fails(move(neutral, "leftLittleProximal", [20 * axis[0], 20 * axis[1], 20 * axis[2]]), "ORD-HN-4")) out.push("made fifth knuckle distal: no failing ORD-HN-4 row");
  if (!fails(move(neutral, "leftToe5Distal", [40, 0, 0]), "ORD-FT-2")) out.push("made fifth toe forward: no failing ORD-FT-2 row");

  // The left little finger swollen to twice its girth outgirths its neighbours.
  const p: HumanPeople.IPerson = HumanPeople.person("f1");
  const k: number = HumanCurveRings.scale(p);
  const swollen: IAutoMovieHumanBodyCalibration = structuredClone(p.body);
  for (const l of swollen.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "finger.left.little")!.layers) {
    l.coefficients = l.coefficients.map((v: number): number => 2 * v);
    l.slopes = l.slopes.map((v: number): number => 2 * v);
  }
  const girths: IRow[] = HumanCurveDigitGirth.rows("f1 swollen little", swollen, (chain: string): HumanCurveRings.IProfile => HumanCurveRings.of(swollen, chain, k));
  if (!girths.some((r: IRow): boolean => r.site.startsWith("left") && r.site.endsWith("(ORD-HN-1)") && !HumanAnatomyAudit.passes(r))) out.push("made swollen little finger: no failing ORD-HN-1 row");
  return out;
}
