import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanWallClimb,
  IAutoMovieMotionEvent,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  wallClimbSupport,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanStance } from "../internal/motionHumanStance";

/**
 * A climber moves their right foot from the base of a wall to a raised
 * foothold. Quaine and Martin (1999, DOI 10.1016/S0966-6362(99)00024-7)
 * measured how removing that foot transfers support to the remaining limbs.
 *
 * Scenarios:
 *
 * 1. The public support action opens two distinct right-foot windows at
 *    the old and new holds, with a gap between release and landing.
 * 2. Both hands grip and the opposite foot bears in the wall's frame
 *    throughout the change of right-foot hold.
 * 3. The displayed right toe joint arrives at the new foothold within the
 *    10 mm contact bound of the motion campaign.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the route, the measured support premise and three observable behaviors.
 * @evidence contracts/development/testing.md#behavioral-verification Builds one wall route through the public chain and reads the placed contact windows and terminal displayed toe joint.
 * @evidence contracts/development/testing.md#independent-expectations The three retained supports come from measured climbing, the gap follows the single-limb transfer contract, and the foothold is staged from body dimensions and compared at the campaign's 10 mm bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinguishes the released foot from the stationary one, and gripping hands from planted feet. The generic support-sequence spec covers unreachable targets.
 * @evidence contracts/development/testing.md#execution-ownership This named unit plans one motion on the shared polygon-man body fixture and reads one displayed pose in memory.
 */
export function test_human_motion_wall_climb_support(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const standing: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    motionHumanStance(body);
  const leftToe: IAutoMovieVector3 = standing.get("leftToes")!.worldPosition;
  const rightToe: IAutoMovieVector3 = standing.get("rightToes")!.worldPosition;
  const ledge: IAutoMovieVector3 = {
    x: rightToe.x,
    y: body.measure.footLength / 2,
    z: rightToe.z + body.measure.footLength,
  };
  const gripHeight: number = body.measure.hipHeight + body.measure.upperArm;
  const gripAhead: number = body.measure.forearm;
  const wall: IAutoMovieMotionHumanProp = {
    subject: "wall",
    fixed: true,
    frame: {
      position: { x: 0, y: 0, z: 0 },
      rotation: Quaternion.identity(),
    },
    points: {
      leftGrip: {
        point: {
          x: body.measure.shoulderHalfWidth,
          y: gripHeight,
          z: gripAhead,
        },
        normal: { x: 0, y: 0, z: -1 },
      },
      rightGrip: {
        point: {
          x: -body.measure.shoulderHalfWidth,
          y: gripHeight,
          z: gripAhead,
        },
        normal: { x: 0, y: 0, z: -1 },
      },
      leftStart: {
        point: { ...leftToe, y: 0 },
        normal: { x: 0, y: 1, z: 0 },
      },
      rightStart: {
        point: { ...rightToe, y: 0 },
        normal: { x: 0, y: 1, z: 0 },
      },
      ledge: { point: ledge, normal: { x: 0, y: 1, z: 0 } },
    },
  };
  /** Resolve a fixture point by its authored name in the fixed wall's frame. */
  const hold = (point: string): IAutoMovieMotionHumanWallClimb.Hold => ({
    kind: "prop",
    subject: wall.subject,
    point,
  });
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "wall-climb-support",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [wall],
    composition: HumanChain.subject("a").support(
      wallClimbSupport({
        start: {
          leftHand: hold("leftGrip"),
          rightHand: hold("rightGrip"),
          leftFoot: hold("leftStart"),
          rightFoot: hold("rightStart"),
        },
        moves: [{ limb: "rightFoot", to: hold("ledge") }],
      }),
    ).node,
  });
  const segment: IAutoMovieMotionHumanSegment = performance.segments("a")[0]!;
  const lift: number = segment.plan.events.find(
    (event: IAutoMovieMotionEvent): boolean => event.name === "lift1",
  )!.share;
  const bear: number = segment.plan.events.find(
    (event: IAutoMovieMotionEvent): boolean => event.name === "bear1",
  )!.share;

  // 1. A foot must break contact before bearing on a different hold.
  const right: readonly IAutoMovieMotionHumanContactWindow[] =
    segment.plan.contacts.filter(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.part === "rightFoot",
    );
  TestValidator.predicate(
    "the right foot lifts and lands in separate windows",
    right.length === 2 &&
      right[0]!.to === lift &&
      lift < bear &&
      right[1]!.from === bear &&
      right[1]!.to === 1,
  );

  // 2. No other limb changes holds while that foot moves.
  for (const part of ["leftHand", "rightHand", "leftFoot"] as const) {
    const windows: IAutoMovieMotionHumanContactWindow[] =
      segment.plan.contacts.filter(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.part === part,
      );
    const contact: IAutoMovieMotionHumanContactWindow | undefined = windows[0];
    TestValidator.predicate(
      `${part} keeps one bearing window in the wall's frame`,
      windows.length === 1 &&
        contact !== undefined &&
        contact.from < lift &&
        contact.to === 1 &&
        contact.kind === (part === "leftFoot" ? "plant" : "grip") &&
        contact.support.kind === "prop" &&
        contact.support.subject === wall.subject,
    );
  }

  // 3. The display places the toe on the authored raised hold.
  const displayed: IAutoMovieVector3 = performance
    .bones("a", segment.start + segment.plan.duration)
    .get("rightToes")!.worldPosition;
  TestValidator.predicate(
    "the displayed toe reaches the raised hold within 10 mm",
    Vector3.length(Vector3.subtract(displayed, ledge)) <= 0.01,
  );
}
