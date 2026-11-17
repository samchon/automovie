import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanStepVault,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  stepVaultSupport,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanStance } from "../internal/motionHumanStance";

/**
 * A right-hand ground step vault through the public support action. The
 * ground drill isolates the contact pattern London Parkour teaches before
 * the raised obstacle. The entry feet follow the performer's normal stance,
 * the intermediate foothold is one foot length ahead, and the exit is one
 * further foot length along the same heading.
 *
 * Scenarios:
 *
 * 1. The right foot releases and lands with separate contact windows.
 * 2. The right palm and left foot bear throughout that gap. The palm stays
 *    until the left foot bears on the exit. At the lift key the displayed
 *    supporting wrist and toe stay over their floor targets while the
 *    crossing toe clears the floor.
 * 3. Both displayed toe joints arrive within 10 mm horizontally of their
 *    authored exit footprints.
 *
 * @see https://londonparkour.com/tutorials/ground-step-vaults/
 * @evidence contracts/development/common.md#meaningful-documentation States the training variant, how the fixtures are placed and what each scenario checks.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the authored sequence and observes placed contact windows and the displayed bones at the lift and exit.
 * @evidence contracts/development/testing.md#independent-expectations The cited ground drill determines which limbs support the passage. The measured body length sets the staged footprints and the motion campaign's 10 mm contact bound limits their horizontal miss.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinguishes the stepping side from the through side, and the stationary palm from the transferring feet during passage. Obstacle geometry belongs to the raised-obstacle law.
 * @evidence contracts/development/testing.md#execution-ownership This named unit plans one in-memory performance on the shared polygon man and reads two displayed poses.
 */
export function test_human_motion_step_vault_support(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const stance: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    motionHumanStance(body);
  const leftToe: IAutoMovieVector3 = stance.get("leftToes")!.worldPosition;
  const rightToe: IAutoMovieVector3 = stance.get("rightToes")!.worldPosition;
  const length: number = body.measure.footLength;
  const leftExit: IAutoMovieVector3 = {
    x: leftToe.x,
    y: 0,
    z: leftToe.z + 2 * length,
  };
  const rightExit: IAutoMovieVector3 = {
    x: rightToe.x,
    y: 0,
    z: rightToe.z + 2 * length,
  };
  /** Put a support on the floor at the given horizontal location. */
  const floor = (
    point: IAutoMovieVector3,
  ): IAutoMovieMotionHumanStepVault.Target => ({
    kind: "point",
    frame: "world",
    at: { ...point, y: 0 },
    normal: { x: 0, y: 1, z: 0 },
  });
  const palm: IAutoMovieVector3 = {
    x: rightToe.x - body.measure.shoulderHalfWidth,
    y: 0,
    z: rightToe.z + body.measure.forearm,
  };
  const step: IAutoMovieVector3 = { ...leftToe, y: 0, z: leftToe.z + length };
  const route: IAutoMovieMotionHumanStepVault = {
    hand: "right",
    entry: { left: floor(leftToe), right: floor(rightToe) },
    palm: floor(palm),
    step: floor(step),
    exit: { left: floor(leftExit), right: floor(rightExit) },
  };
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "ground-step-vault",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").support(stepVaultSupport(route)).node,
  });
  const segment: IAutoMovieMotionHumanSegment = performance.segments("a")[0]!;
  /** Read a planned transition in the same action-share units as the windows. */
  const share = (name: string): number =>
    segment.plan.events.find(
      (event: IAutoMovieMotionEvent): boolean => event.name === name,
    )!.share;
  const lift: number = share("lift2");
  const land: number = share("bear2");
  /** Observe one body's contact windows for the indicated limb. */
  const contacts = (
    part: IAutoMovieMotionHumanContactWindow["part"],
  ): IAutoMovieMotionHumanContactWindow[] =>
    segment.plan.contacts.filter(
      (contact: IAutoMovieMotionHumanContactWindow): boolean =>
        contact.part === part,
    );

  // 1. The through foot keeps its entry plant until lift, then bears at exit.
  const right: IAutoMovieMotionHumanContactWindow[] = contacts("rightFoot");
  TestValidator.predicate(
    "the through foot releases and lands in distinct windows",
    right.length === 2 &&
      right[0]!.to === lift &&
      lift < land &&
      right[1]!.from === land &&
      right[1]!.to === 1,
  );

  // 2. The palm and the stepping foot both bear through the passage.
  const hand: IAutoMovieMotionHumanContactWindow[] = contacts("rightHand");
  const left: IAutoMovieMotionHumanContactWindow[] = contacts("leftFoot");
  TestValidator.predicate(
    "the palm and opposite foot carry the through step before both feet settle",
    hand.length === 1 &&
      hand[0]!.kind === "plant" &&
      hand[0]!.from < lift &&
      hand[0]!.to > land &&
      left.length === 3 &&
      left[1]!.from < lift &&
      left[1]!.to > land &&
      left[2]!.from <= hand[0]!.to &&
      left[2]!.to === 1 &&
      contacts("leftHand").length === 0,
  );

  /** Horizontal distance from a displayed joint to its floor target. */
  const miss = (at: IAutoMovieVector3, target: IAutoMovieVector3): number =>
    Math.hypot(at.x - target.x, at.z - target.z);
  const lifted: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    performance.bones("a", segment.start + lift * segment.plan.duration);
  TestValidator.predicate(
    "the supporting wrist and opposite toe stay over their floor targets at lift",
    miss(lifted.get("rightHand")!.worldPosition, palm) <= 0.01 &&
      miss(lifted.get("leftToes")!.worldPosition, step) <= 0.01,
  );
  TestValidator.predicate(
    "the through toe clears the floor at lift",
    lifted.get("rightToes")!.worldPosition.y > 0.01,
  );

  // 3. The displayed feet end beyond the intermediate foothold.
  const displayed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    performance.bones("a", segment.start + segment.plan.duration);
  TestValidator.predicate(
    "both displayed toes finish within 10 mm of their exit footprints",
    miss(displayed.get("leftToes")!.worldPosition, leftExit) <= 0.01 &&
      miss(displayed.get("rightToes")!.worldPosition, rightExit) <= 0.01,
  );
}
