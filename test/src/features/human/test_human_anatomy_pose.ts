import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import { HumanAnatomy } from "../internal/HumanAnatomy";
import { HumanAnatomyAudit } from "../internal/HumanAnatomyAudit";
import { HumanAnatomyPose } from "../internal/HumanAnatomyPose";
import { assertHumanAnatomy } from "../internal/assertHumanAnatomy";

/**
 * Every person's skin bends at the axillae, elbows, groin and knees without
 * passing through itself, tearing or folding, and a flexed limb keeps its
 * volume.
 *
 * @evidence contracts/testing.md#behavioral-verification Poses each person's skin through the public pose evaluator and the rig's own binding, blended as dual quaternions as the rig declares, at the anatomical neutral, the stickman's demo and limit poses, both arms raised to 179 degrees of abduction and every elbow, hip and knee at its range's end. Within 0.07 S of each shoulder and hip centre and 0.045 S and 0.05 S of each elbow and knee it finds skin vertices inside the closed skin (rays along the three axes, an opening spoiling at most two) and how deep, each triangle's largest principal stretch from the bind and triangles folded over their neighbours; it compares the body's volume with elbows and knees fully flexed against neutral, over the flexed limbs' volume integrated from their sections. It catches an armpit that tears or folds when the arm is raised, an elbow or knee whose skin passes into itself, arms sunk into the trunk at rest, and a joint that collapses or balloons.
 * @evidence contracts/testing.md#independent-expectations Skin does not pass through skin: at rest nothing presses, so 1 mm; at a joint's flexion limit soft tissue meets and compresses, bounded at 10 mm. Skin fails in tension at a strain of 0.54 plus or minus 0.17 (Ní Annaidh et al. 2012), so a principal stretch past 2 is a tear, and a triangle whose normal turns past 120 degrees from its neighbours' is a fold. Soft tissue is nearly incompressible, so flexion changes a limb's volume by at most 5 percent. No construction constant or earlier output enters. Made red on every person by raising the arms: the axillae stretch 15 to 27 times with 4 to 238 folded triangles, the reported tearing armpit; the demo pose folds 16 to 335 axilla triangles; the full flexions stretch the groin about 5 times and the knee about 3.2. At neutral the tall and narrow people sink their arms 14 to 19 mm into the trunk and the masculine person's flexed groin passes 48 mm into itself; f1's axillae at neutral read 1.08 and 0.94 mm, the left just past. Driving f1's arm 40 degrees across the trunk reads 25.7 mm of skin inside skin. Flexion changes volume by 2 to 4 percent at the elbows and under 1 percent at the knees, green on every person. Oracle limits: the inside test reads the closed skin, so a mouth or eye opening on a ray's path spoils that ray; depth is along axes, not the shortest way out. Proven red on f1 posed with the skin round its left elbow pushed 40 mm through itself, which must list more failing rows.
 * @evidence contracts/testing.md#distinguishing-cases All nine people at neutral and at the poses that load each joint, so a slender and a broad armpit, groin and knee are each bent. The engine pose test owns the joints' angles and the mouth test the jaw.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_anatomy_pose`, posing the people it generates in process with no renderer, browser or GPU.
 */
export const test_human_anatomy_pose = (): void => {
  // Red proof: f1 posed with the skin within 40 mm of the left elbow joint
  // pushed 40 mm forward, the back of the elbow driven through its front,
  // must list more failing rows than f1 posed as built.
  const red: (rows: HumanAnatomyAudit.IRow[]) => number = (rows: HumanAnatomyAudit.IRow[]): number => rows.filter((r: HumanAnatomyAudit.IRow): boolean => !HumanAnatomyAudit.passes(r)).length;
  const f1: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject("f1");
  const pushed: (request: IAutoMovieHumanPose) => HumanAnatomy.ISkin = (request: IAutoMovieHumanPose): HumanAnatomy.ISkin => {
    const skin: HumanAnatomy.ISkin = f1.posed!(request);
    const elbow: HumanAnatomy.V3 = HumanAnatomy.joint(skin, "leftLowerArm");
    const P: Float64Array = Float64Array.from(skin.P);
    for (let v: number = 0; v < P.length / 3; v++) {
      const d: number = HumanAnatomy.dist(HumanAnatomy.point(skin, v), elbow);
      if (d < 40) P[3 * v] += 40 * 0.5 * (1 + Math.cos((Math.PI * d) / 40));
    }
    return { ...skin, P };
  };
  const base: number = red(HumanAnatomyPose.pose(f1));
  const made: number = red(HumanAnatomyPose.pose(f1, pushed));
  const proof: string = made > base ? "" : `proof: f1 with its left elbow pushed through itself lists ${made} failing pose rows, as built ${base}; expected more`;
  try {
    assertHumanAnatomy("pose");
  } catch (error) {
    throw new Error([proof, (error as Error).message].filter((s: string): boolean => s !== "").join("\n"));
  }
  if (proof !== "") throw new Error(proof);
};
