import { assertHumanAnatomy } from "../internal/assertHumanAnatomy";

/**
 * Every person's skin bends at the axillae, elbows, groin and knees without
 * passing through itself, tearing or folding, and a flexed limb keeps its
 * volume.
 *
 * @evidence contracts/testing.md#behavioral-verification Poses each person's skin through the public pose evaluator and the rig's own binding, blended as dual quaternions as the rig declares, at the anatomical neutral, the stickman's demo and limit poses, both arms raised to 179 degrees of abduction and every elbow, hip and knee at its range's end. Within 0.07 S of each shoulder and hip centre and 0.045 S and 0.05 S of each elbow and knee it finds skin vertices inside the closed skin (rays along the three axes, an opening spoiling at most two) and how deep, each triangle's largest principal stretch from the bind and triangles folded over their neighbours; it compares the body's volume with elbows and knees fully flexed against neutral, over the flexed limbs' volume integrated from their sections. It catches an armpit that tears or folds when the arm is raised, an elbow or knee whose skin passes into itself, arms sunk into the trunk at rest, and a joint that collapses or balloons.
 * @evidence contracts/testing.md#independent-expectations Skin does not pass through skin: at rest nothing presses, so 1 mm; at a joint's flexion limit soft tissue meets and compresses, bounded at 10 mm. Skin fails in tension at a strain of 0.54 plus or minus 0.17 (Ní Annaidh et al. 2012), so a principal stretch past 2 is a tear, and a triangle whose normal turns past 120 degrees from its neighbours' is a fold. Soft tissue is nearly incompressible, so flexion changes a limb's volume by at most 5 percent. No construction constant or earlier output enters. Oracle limits: the inside test reads the closed skin, so a mouth or eye opening on a ray's path spoils that ray; depth is along axes, not the shortest way out.
 * @evidence contracts/testing.md#distinguishing-cases All nine people at neutral and at the poses that load each joint, so a slender and a broad armpit, groin and knee are each bent. The engine pose test owns the joints' angles and the mouth test the jaw.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_anatomy_pose`, posing the cached people in process with no renderer, browser or GPU.
 */
export const test_human_anatomy_pose = (): void => assertHumanAnatomy("pose");
