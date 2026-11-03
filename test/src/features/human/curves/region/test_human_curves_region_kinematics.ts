import type { IAutoMovieHumanPose } from "../../../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import type { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanCurveJoints } from "../../../internal/curves/HumanCurveJoints";
import { HumanCurveKinematics } from "../../../internal/curves/HumanCurveKinematics";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type Joints = HumanCurveKinematics.Joints;

/**
 * Pins that every person's joints move the way their clinical motions are
 * defined: knee flexion carries the ankle backward in the thigh's sagittal
 * plane, hip flexion carries the knee forward, ankle dorsiflexion raises the
 * toes, elbow flexion carries the wrist forward, shoulder abduction raises
 * the elbow outward, and at neutral the knee stands on the hip-ankle line.
 *
 * Scenarios:
 * 1. f1's knee-flexed joints with each ankle reflected forward through its knee fail the knee's direction row; f1's neutral joints with each knee moved 50 mm toward the midline fail the alignment row.
 * 2. Every person of `HumanPeople`: both sides of every motion are read through the public pose evaluator, and every row out of its expectation is listed by person, side and rule.
 *
 * @evidence contracts/testing.md#behavioral-verification Prepares each person's rig and pose evaluator (`HumanPeople.rigged`) and evaluates the anatomical neutral `{}` and five poses, each moving one joint on both sides (knee flexion 90, hip flexion 90, ankle dorsiflexion 10, elbow flexion 90, shoulder abduction 90 degrees), reading the evaluator's posed joint centres in millimetres (the rig's metres, which the stature input scales). It reads where the distal joint moves against the body frame and, at neutral, the frontal-plane angle between the femur and the tibia and the elbow and wrist centres' heights against the person's stature (ANSUR II fits by sex, 2.326 residual SD: elbow -48.9 + 0.6673 S, SD 14.7, women, -91.6 + 0.6898 S, SD 16.5, men; wrist -35.0 + 0.5083 S, SD 19.9, and -67.9 + 0.5204 S, SD 21.5). With both arms abducted 90 degrees it reads the fingertip span over stature, each middle fingertip placed on its hand's axis at the hand length input less 1.5 mm from the wrist centre (ANSUR II span over stature 1.019, SD 0.029, women; 1.033, SD 0.027, men; 2.326 SD). It catches arms too long or short for the body, a knee that bends forward or sideways, a hip that flexes backward, an ankle whose dorsiflexion lowers the toes, an elbow that bends backward, an abduction that lowers or adducts the arm, and knock-knees or bow legs at rest.
 * @evidence contracts/testing.md#independent-expectations Directions are the AAOS clinical definitions of each motion from the anatomical neutral (`packages/human/docs/anatomy/joint-range.md` conventions): flexion of the knee is the shank's rotation backward about the transepicondylar axis, whose obliquity to the frontal plane is a few degrees, so the ankle's sideways swing stays within `sin 5 deg` of the shank; the hip-knee-ankle angle of healthy young adults is 2.2 degrees of varus, SD 2.5 to 2.7 (Tang 2000), so it stays within 8.5 degrees; the axis obliquity awaits its source note (catalog section 6). No construction constant enters. Proven red here on f1's own joints, edited in memory: the reflected ankle reads ahead of its knee; the moved knee reads about 14 degrees off the hip-ankle line. Oracle limits: the evaluator's joint centres are the rig's, so a skin that does not follow its bones is the skin binding test's; the sign rows read direction, not range.
 * @evidence contracts/testing.md#distinguishing-cases Both sides of the core set's ten people, short and tall limbs of both sexes. Each joint's angle against its clinical definition belongs to `test_human_engine_pose`, the skin under these poses to `test_human_anatomy_pose` and `test_human_skin_integrity_posed`, the left-right agreement to `test_human_pose_mirror`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_region_kinematics`, preparing the cached people's rigs in process on the CPU with no skin, renderer, browser or GPU.
 */
export function test_human_curves_region_kinematics(): void {
  const failures: string[] = [...made()];
  for (const name of HumanPeople.names()) {
    try {
      const { neutral, posed }: { neutral: Joints; posed: Record<string, Joints> } = joints(name);
      const S: number = HumanPeople.params(name).body.controls.height.value!;
      const rows: IRow[] = [
        ...HumanCurveKinematics.rows(name, neutral, posed),
        ...HumanCurveKinematics.heights(name, neutral, HumanPeople.sex(name), S),
        HumanCurveKinematics.span(name, posed.shoulder!, HumanPeople.params(name), HumanPeople.sex(name), S),
      ];
      for (const r of rows)
        if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(3)} outside ${r.low.toFixed(3)} to ${r.high.toFixed(3)}`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be posed: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} kinematics findings:\n${failures.join("\n")}`);
}

/** A person's joint centres at neutral and in each rule's pose, mm, from the shared cache. */
function joints(name: string): { neutral: Joints; posed: Record<string, Joints> } {
  return {
    neutral: HumanCurveJoints.of(name, {}),
    posed: Object.fromEntries(Object.entries(HumanCurveKinematics.POSES).map(([key, pose]: [string, IAutoMovieHumanPose]): [string, Joints] => [key, HumanCurveJoints.of(name, pose)])),
  };
}

/** f1's own joints edited in memory, each edit required to fail its own row. */
function made(): string[] {
  const out: string[] = [];
  const { neutral, posed }: { neutral: Joints; posed: Record<string, Joints> } = joints("f1");

  // Each ankle reflected forward through its knee in the knee-flexed pose.
  const bent: Joints = new Map(posed.knee!);
  for (const side of ["left", "right"]) {
    const knee: V3 = bent.get(`${side}LowerLeg`)!;
    const ankle: V3 = bent.get(`${side}Foot`)!;
    bent.set(`${side}Foot`, [2 * knee[0] - ankle[0], ankle[1], ankle[2]]);
  }
  const forward: IRow[] = HumanCurveKinematics.rows("f1 knee forward", neutral, { ...posed, knee: bent });
  if (!forward.some((r: IRow): boolean => r.site.endsWith("(KIN-LG-1)") && !HumanAnatomyAudit.passes(r))) out.push("made knee forward: no failing KIN-LG-1 row");

  // Each knee moved 50 mm toward the midline at neutral: about 14 degrees off the hip-ankle line.
  const knocked: Joints = new Map(neutral);
  for (const side of ["left", "right"]) {
    const knee: V3 = knocked.get(`${side}LowerLeg`)!;
    knocked.set(`${side}LowerLeg`, [knee[0], knee[1], knee[2] - (side === "left" ? 50 : -50)]);
  }
  const valgus: IRow[] = HumanCurveKinematics.rows("f1 knock-kneed", knocked, posed);
  if (!valgus.some((r: IRow): boolean => r.site.endsWith("(KIN-LG-4)") && !HumanAnatomyAudit.passes(r))) out.push("made knock-knees: no failing KIN-LG-4 row");
  return out;
}
