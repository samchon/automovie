import type { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanCurveBoneInside } from "../../../internal/curves/HumanCurveBoneInside";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;

/**
 * Pins that every person's spine, neck, head, hand and foot joints lie inside
 * their skin: each joint centre is enclosed by the section of skin cut
 * through it.
 *
 * Scenarios:
 * 1. A copy of f1's bind skin whose left hand joint is moved 300 mm away from the hand, past its fingertips, reads that joint outside its section and fails.
 * 2. Every person of `HumanPeople`: every listed joint is read, and every joint outside its skin is listed by person and joint with its distance.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's bind skin and cuts it through each joint centre: the neck and head joints, each hand's wrist, third knuckle and thumb MCP, and each foot's midfoot and hallux MTP normal to their bone toward the child joint, through the skin within a joint's reach; the hips', lumbar and thoracic joints horizontally through the trunk with the arms left out. It reads how far the joint lies outside the section's component that should enclose it. It catches a bone that has left its skin: a spine in front of the belly or behind the back, a neck joint outside the neck, a hand or foot joint outside its part.
 * @evidence contracts/testing.md#independent-expectations A joint centre lies inside its segment (anatomy: the bones are wrapped by their soft tissue), so the distance outside must be zero; the arm's and leg's joints are the arm and leg audits' (`HumanAnatomyArmSites`, `HumanAnatomyLegSites`). Proven red here on a copy of f1's skin whose left hand joint is moved 300 mm along the forearm's line beyond the hand. Oracle limits: a joint just inside its skin passes, so a too-thin clearance is the clearance rule's (catalog LMK-5's clearance, owed its source); the reach of each cut bounds which skin counts as the segment's.
 * @evidence contracts/testing.md#distinguishing-cases The core set's ten people, thin and heavy bodies of both sexes. The arm's and leg's bone axes belong to `test_human_anatomy_arm` and `_leg`, the joints' heights and order to `test_human_curves_region_segments`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_region_bones`, generating each person's bind skin in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_region_bones(): void {
  const failures: string[] = [...made()];
  for (const name of HumanPeople.names()) {
    try {
      for (const r of HumanCurveBoneInside.rows(name, HumanAnatomyAudit.subject(name).bind()))
        if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(2)} mm`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} bone-inside-skin findings:\n${failures.join("\n")}`);
}

/** f1's bind skin with the left hand joint carried 300 mm beyond the hand, required to fail its row. */
function made(): string[] {
  const skin: HumanAnatomy.ISkin = HumanAnatomyAudit.subject("f1").bind();
  const wrist: V3 = skin.joints.get("leftHand")!;
  const elbow: V3 = skin.joints.get("leftLowerArm")!;
  const d: number = Math.hypot(wrist[0] - elbow[0], wrist[1] - elbow[1], wrist[2] - elbow[2]);
  const joints: Map<string, V3> = new Map(skin.joints);
  joints.set("leftHand", [wrist[0] + (300 * (wrist[0] - elbow[0])) / d, wrist[1] + (300 * (wrist[1] - elbow[1])) / d, wrist[2] + (300 * (wrist[2] - elbow[2])) / d]);
  const rows: IRow[] = HumanCurveBoneInside.rows("f1 moved hand joint", { ...skin, joints });
  const own: IRow | undefined = rows.find((r: IRow): boolean => r.site.startsWith("leftHand joint"));
  return own !== undefined && !HumanAnatomyAudit.passes(own) ? [] : [`made moved hand joint: read ${own?.value ?? NaN} mm outside, expected more than zero`];
}
