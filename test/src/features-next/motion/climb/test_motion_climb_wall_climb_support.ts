import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionHumanWallClimb,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanClimb,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { collectTakeClean } from "../../../features/internal/collectTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanStance } from "../../../features/internal/motionHumanStance";

/**
 * A climber moves their right foot from the base of a wall to a raised
 * foothold. Quaine and Martin (1999, DOI 10.1016/S0966-6362(99)00024-7)
 * measured how removing that foot transfers support to the remaining limbs.
 *
 * Scenarios:
 *
 * 1. The right foot leaves its old hold before the raised swing pose and
 *    lands in a separate window. Holding the starting stance before moving
 *    gives the initial plant a positive duration. An immediate transfer
 *    reaches the starting wall hold at the departure key.
 * 2. Both hand grip points and the opposite foot have windows in the wall's
 *    frame and reach the authored points through departure and set-down.
 * 3. The displayed right toe leaves the old footprint, clears the new
 *    hold, and reaches the raised foothold within the 10 mm contact bound.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the route, the measured support premise and three observable behaviors.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the public support sequence with and without an authored hold at the starting stance and verifies the right-foot windows, retained wall contacts, and displayed toe at departure, apex, landing and finish.
 * @evidence contracts/development/testing.md#independent-expectations The three retained supports come from measured climbing, the gap follows the single-limb transfer contract, and the foothold is staged from body dimensions and compared at the campaign's 10 mm bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinguishes a positive starting plant from a contact attained at a single key, the released foot from the stationary one, and gripping hands from planted feet. The generic support-sequence spec covers unreachable targets.
 * @evidence contracts/development/testing.md#execution-ownership This named unit builds two performances with the shared polygon-man body and reads the displayed contact poses in memory.
 */
export function test_motion_climb_wall_climb_support(): void {
  const failures: string[] = [];
  for (const key of BODIES)
    try {
      take(key, failures);
    } catch (error) {
      failures.push(
        `${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  TestValidator.equals("wall climb", failures, []);
}

/** The two canonical bodies. */
const BODIES: readonly BodyKey[] = ["m-average", "f-small"];

/** A canonical body's key. */
type BodyKey = "m-average" | "f-small";

/**
 * The take on one body, its verdicts recorded.
 *
 * @param key The body.
 * @param failures Where a verdict fault is recorded.
 */
function take(key: BodyKey, failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
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
  const route: IAutoMovieMotionHumanWallClimb = {
    start: {
      leftHand: hold("leftGrip"),
      rightHand: hold("rightGrip"),
      leftFoot: hold("leftStart"),
      rightFoot: hold("rightStart"),
    },
    moves: [{ limb: "rightFoot", to: hold("ledge") }],
  };
  const params: IAutoMovieMotionHumanSupport.IParams =
    AutoMovieMotionHumanClimb.wallClimbSupport(route);
  const first: IAutoMovieMotionHumanSupport.IStance = params.stances[0]!;
  for (const pause of [false, true]) {
    const performance: HumanPerformance = new HumanPerformance({
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
        pause ? { ...params, stances: [first, ...params.stances] } : params,
      ).node,
    });
    collectTakeClean(`${key} wall climb performance`, performance, failures);
    const segment: IAutoMovieMotionHumanSegment = performance.segments("a")[0]!;
    /** Read the film share of a named support key. */
    const share = (name: string): number =>
      segment.plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === name,
      )!.share;
    const acquired: number = share("stance0");
    const depart: number = pause ? share("stance1") : acquired;
    const lift: number = share(pause ? "lift2" : "lift1");
    const bear: number = share(pause ? "bear2" : "bear1");

    // 1. A foot must break contact before bearing on a different hold.
    const right: readonly IAutoMovieMotionHumanContactWindow[] =
      segment.plan.contacts.filter(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.part === "rightFoot",
      );
    const scenario: string = pause ? "held start" : "immediate transfer";
    TestValidator.predicate(
      `${scenario}: the right foot releases before lift and lands in a distinct window`,
      right.length === 2 &&
        right.every(
          (window: IAutoMovieMotionHumanContactWindow): boolean =>
            window.kind === "plant" &&
            window.support.kind === "prop" &&
            window.support.subject === wall.subject,
        ) &&
        right[0]!.from === acquired &&
        right[0]!.to === depart &&
        (pause ? acquired < depart : acquired === depart) &&
        depart < lift &&
        lift < bear &&
        right[1]!.from === bear &&
        bear < 1 &&
        right[1]!.to === 1,
    );

    // 2. No other limb changes holds while that foot moves.
    for (const part of ["leftHand", "rightHand", "leftFoot"] as const) {
      const windows: IAutoMovieMotionHumanContactWindow[] =
        segment.plan.contacts.filter(
          (window: IAutoMovieMotionHumanContactWindow): boolean =>
            window.part === part,
        );
      const contact: IAutoMovieMotionHumanContactWindow | undefined =
        windows[0];
      TestValidator.predicate(
        `${scenario}: ${part} keeps one bearing window in the wall's frame`,
        windows.length === 1 &&
          contact !== undefined &&
          contact.from <= depart &&
          contact.to === 1 &&
          contact.kind === (part === "leftFoot" ? "plant" : "grip") &&
          contact.support.kind === "prop" &&
          contact.support.subject === wall.subject,
      );
    }

    for (const transfer of [depart, lift, bear, 1]) {
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        performance.bones(
          "a",
          segment.start + transfer * segment.plan.duration,
        );
      for (const [side, point] of [
        ["left", "leftGrip"],
        ["right", "rightGrip"],
      ] as const) {
        const grip: IAutoMovieVector3 = HumanHand.frame(
          body,
          bones,
          side,
          "grip",
        ).point;
        TestValidator.predicate(
          `${scenario}: ${side} grip socket reaches its hold at share ${transfer}`,
          Vector3.length(Vector3.subtract(grip, wall.points[point]!.point)) <=
            0.01,
        );
      }
      const toe: IAutoMovieVector3 = bones.get("leftToes")!.worldPosition;
      TestValidator.predicate(
        `${scenario}: the left toe stays over its wall point at share ${transfer}`,
        Math.hypot(toe.x - leftToe.x, toe.z - leftToe.z) <= 0.01,
      );
      // The toe joint has its natural standing height above the old floor.
      const moving: IAutoMovieVector3 = bones.get("rightToes")!.worldPosition;
      if (transfer === depart)
        TestValidator.predicate(
          `${scenario}: the displayed toe leaves its old footprint`,
          Vector3.length(Vector3.subtract(moving, rightToe)) <= 0.01,
        );
      else if (transfer === lift)
        TestValidator.predicate(
          `${scenario}: the displayed toe rises clear of both holds`,
          moving.y > Math.max(rightToe.y, ledge.y) + 0.01 &&
            moving.z > rightToe.z &&
            moving.z < ledge.z,
        );
      else
        TestValidator.predicate(
          `${scenario}: the displayed toe reaches the raised hold at share ${transfer}`,
          Vector3.length(Vector3.subtract(moving, ledge)) <= 0.01,
        );
    }
  }
}
