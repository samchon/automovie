import type { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanCurveJoints } from "../../../internal/curves/HumanCurveJoints";
import { HumanCurveSegments } from "../../../internal/curves/HumanCurveSegments";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;

/**
 * Pins that every person's arm bones are as long as that person's own arm
 * inputs make them: the shoulder-to-elbow and elbow-to-wrist centre lengths
 * of the pose evaluator's neutral equal acromion-radiale and radiale-stylion
 * moved to the joint centres by de Leva's offsets.
 *
 * Scenarios:
 * 1. f1's neutral joints with the left elbow centre moved 20 mm down the arm read the upper arm exactly 20 mm longer, and a row that was green turns red.
 * 2. f1's neutral joints with the left wrist lifted 30 mm above its elbow fail the elbow-over-wrist order.
 * 3. Every person of `HumanPeople`: both arms' segments and the joints' vertical order are read, and every row out of its expectation is listed by person, side and joint.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates each person's anatomical neutral through the public pose evaluator (`HumanCurveJoints`) and reads the distance from the shoulder centre to the elbow centre and from the elbow centre to the wrist centre on each side. It also reads the joints' vertical order at the neutral: head, neck, chest, lumbar and hip joints downward, and per side the neck over the shoulder, shoulder over elbow, elbow over wrist, wrist over knee, hip and thigh over knee and knee over ankle, each by more than 1 mm (ANSUR II joint heights: shoulder 0.799 S, elbow 0.637, wrist 0.487, hip 0.521, knee 0.287, ankle 0.039, women; men alike). It catches a skeleton built off its arm inputs: an input the joints ignore, an arm length routed to the wrong segment, and a joint placed by another rule than the published offsets, which the skin's acromion-radiale reading inherits.
 * @evidence contracts/testing.md#independent-expectations The expectation is the person's `upperArmLength` and `lowerArmLength` inputs (ANSUR II acromion-radiale and radiale-stylion) with de Leva 1996 Table 2's offsets: the shoulder centre 33.7 (women) and 34.5 (men) mm below the acromion, the elbow centre 13.9 and 14.3 mm above radiale on the upper arm and 16.6 and 16.8 mm on the forearm, the wrist centre 1.5 mm distal of stylion, so the upper arm is acromion-radiale less 47.6 or 48.8 mm (his Table 4's 275.1 mm from Table 1's 322.7) and the forearm radiale-stylion plus 18.1 or 18.3 mm. The allowance is ANSUR II's allowable error of each length (4 and 6 mm) plus the 1 mm between de Leva's two offsets for one landmark. Proven red here on f1's own joints edited in memory: a 20 mm move of the elbow lengthens the upper arm and shortens the forearm by 20 mm each. Oracle limits: de Leva's offsets were measured on young athletic adults; the person's sex selects the offset.
 * @evidence contracts/testing.md#distinguishing-cases Both arms of the core set's ten people, short and long arms of both sexes. The lengths read on the skin's acromion and radiale belong to `test_human_anatomy_course`, each input's response to a change to `test_human_input_response_limbs`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_region_segments`, preparing the cached people's rigs in process on the CPU with no skin, renderer, browser or GPU.
 */
export function test_human_curves_region_segments(): void {
  const failures: string[] = [...made()];
  for (const name of HumanPeople.names()) {
    try {
      const neutral: HumanCurveJoints.Joints = HumanCurveJoints.of(name, {});
      for (const r of [...HumanCurveSegments.rows(name, HumanPeople.params(name), HumanPeople.sex(name), neutral), ...HumanCurveSegments.order(name, neutral)])
        if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(1)} outside ${r.low.toFixed(1)} to ${r.high.toFixed(1)}`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} arm segment findings:\n${failures.join("\n")}`);
}

/** The left wrist centre of a joint set. */
function wristOf(j: HumanCurveJoints.Joints): V3 {
  return j.get("leftHand")!;
}

/** f1's neutral joints edited in memory, each edit required to move or fail its own row. */
function made(): string[] {
  const neutral: HumanCurveJoints.Joints = HumanCurveJoints.of("f1", {});
  const shoulder: V3 = neutral.get("leftUpperArm")!;
  const elbow: V3 = neutral.get("leftLowerArm")!;
  const d: number = Math.hypot(elbow[0] - shoulder[0], elbow[1] - shoulder[1], elbow[2] - shoulder[2]);
  const moved: HumanCurveJoints.Joints = new Map(neutral);
  moved.set("leftLowerArm", [elbow[0] + (20 * (elbow[0] - shoulder[0])) / d, elbow[1] + (20 * (elbow[1] - shoulder[1])) / d, elbow[2] + (20 * (elbow[2] - shoulder[2])) / d]);
  const before: IRow[] = HumanCurveSegments.rows("f1", HumanPeople.params("f1"), "female", neutral);
  const after: IRow[] = HumanCurveSegments.rows("f1 moved elbow", HumanPeople.params("f1"), "female", moved);
  const out: string[] = [];

  // The reading moves by the known change, and a row green before turns red.
  const upper: (rows: IRow[]) => IRow = (rows: IRow[]): IRow => rows.find((r: IRow): boolean => r.site.startsWith("left shoulder-to-elbow"))!;
  if (Math.abs(upper(after).value - upper(before).value - 20) > 1e-6) out.push(`made moved elbow: the upper arm reading moved ${(upper(after).value - upper(before).value).toFixed(3)} mm, expected 20`);
  if (HumanAnatomyAudit.passes(upper(before)) && HumanAnatomyAudit.passes(upper(after))) out.push("made moved elbow: the upper arm row stayed green");

  // The wrist lifted above its elbow breaks the vertical order.
  const lifted: HumanCurveJoints.Joints = new Map(neutral);
  lifted.set("leftHand", [wristOf(neutral)[0], elbow[1] + 30, wristOf(neutral)[2]]);
  if (!HumanCurveSegments.order("f1 lifted wrist", lifted).some((r: IRow): boolean => r.site.startsWith("leftLowerArm above leftHand") && !HumanAnatomyAudit.passes(r))) out.push("made lifted wrist: the elbow-over-wrist row stayed green");
  return out;
}
