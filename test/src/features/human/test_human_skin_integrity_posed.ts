import { HumanAnatomyPose } from "../internal/HumanAnatomyPose";
import { HumanPeople } from "../internal/HumanPeople";
import { HumanSkinIntegrity } from "../internal/HumanSkinIntegrity";

/**
 * No person's skin passes through itself in any pose the pose audit loads.
 *
 * @evidence contracts/testing.md#behavioral-verification Poses each person's bind skin through the public pose evaluator and the rig's own binding, blended as dual quaternions as the rig declares, in every pose of `HumanAnatomyPose.POSES`: the anatomical neutral, the stickman's demo and limit poses, both arms raised and every elbow, hip and knee fully flexed. On each posed skin it tests every pair of triangles whose boxes meet for a crossing with the bind test's observer, and fails once with every crossing patch by person and pose, chain region, triangle count, crossing pairs, area and a point on it. It catches a thumb set through the palm, an arm through the trunk at the axilla, a flexed thigh through the belly, a calf through the thigh and any part of the skin pushed through another by the binding. A pose whose skin meets itself without crossing passes.
 * @evidence contracts/testing.md#independent-expectations Skin is one sheet that touches itself but never passes through itself, in any pose: compressed tissue deforms where two surfaces meet, so a drawn skin that crosses itself shows the two surfaces inside each other. Zero crossings is the expectation in every pose, and no limit comes from the figure. How deep a crossing goes at a joint's flexion end is the pose test's reading against its compression allowance; this test lists every crossing so none is hidden. The crossing observer and its predicates are proved on analytic and made defects by `test_human_skin_integrity`, whose controls this test shares; posing only moves positions, so the same observer holds. Made red on f1: neutral 19 crossing patches and 2,305 pairs, among them each thumb through its hand (about 340 triangles a side) and each axilla (383 triangles a side); demo 24 patches and 2,238 pairs; limit 24 and 4,105; raised 22 and 1,978, adding the shoulders through the neck; flexed 27 and 5,324, adding each thigh through the trunk and each calf through its thigh. Oracle limits: a crossing within rounding of touching is missed, and a skin that compresses correctly but is drawn as two surfaces touching is green.
 * @evidence contracts/testing.md#distinguishing-cases All nine people, f1, f2, m1, m2 and the tall, short, wide, narrow and masculine people, each in all five poses, so a slender and a broad axilla, groin and knee are each loaded at rest and at their range's end. The bind test owns the bind skin's topology, orientation and triangle shape and the observer's controls; the pose test owns depth inside the skin, stretch, folds and volume; the engine pose test owns the joints' angles.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_skin_integrity_posed`, posing the cached people in process on the CPU with no renderer, browser or GPU.
 */
export const test_human_skin_integrity_posed = (): void => {
  const poses: number = Object.keys(HumanAnatomyPose.POSES).length;
  const failures: string[] = [];
  const findings: HumanSkinIntegrity.IFinding[] = [];
  for (const name of HumanPeople.names()) {
    try {
      const found: HumanSkinIntegrity.IFinding[] = HumanSkinIntegrity.posed(name);
      findings.push(...found);
    } catch (error) {
      failures.push(`${name} could not be posed and audited: ${(error as Error).message}`);
    }
  }
  if (poses === 0) failures.push("HumanAnatomyPose.POSES names no pose to read");
  const lines: string[] = [...failures, ...HumanSkinIntegrity.sort(findings).map(HumanSkinIntegrity.format)];
  if (lines.length)
    throw new Error(
      `${findings.length} posed skin crossings over ${poses} poses and ${failures.length} failures:\n${lines.join("\n")}`,
    );
};
