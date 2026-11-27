import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionPropLaunch,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanPerformanceRead
} from "../../../../../packages/motions/src/perform/internal/HumanPerformanceRead";
import {
  HumanPropCatchHands
} from "../../../../../packages/motions/src/perform/internal/HumanPropCatchHands";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";

/** A point at the origin in the sphere and fixture frames. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/** The fixture's directions coincide with the world directions. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/**
 * Hands assigned to receive a moving animated prop belong to the capture only
 * during its fitted approach. Every other collider stays in the sweep.
 *
 * Scenarios:
 *
 * 1. Only the exact launch and capture second reserve the hand. A release
 *    without a sphere, or a capture without a fitted approach, reserves none.
 * 2. A left-hand approach omits the hand and its fingers at both ends of the
 *    approach. The forearm and right hand remain. Before and after the window
 *    every bone participates.
 * 3. The capture accepts a sphere within hand reach and refuses one far away.
 *    A grip without a fitted approach does not request a hand collision test.
 */
export async function test_motions_perform_catch_hands(): Promise<void> {
  const ball: IAutoMovieMotionPropLaunch = {
    prop: "ball",
    point: ZERO,
    velocity: ZERO,
    seconds: 0,
    sphere: { centre: ZERO, radius: 0.1 },
  };
  const grip: IAutoMovieMotionHumanPerformanceState.IGrip = {
    subject: "actor",
    side: "left",
    from: 1,
    to: 2,
    capture: { launch: ball, handContactFrom: 0.75, matches: (): boolean => true },
  };
  const approach: readonly HumanPropCatchHands.IApproach[] = HumanPropCatchHands.forLaunch(ball, [
    { ...grip, from: 0.875 },
    { ...grip, capture: { ...grip.capture!, launch: { ...ball } } },
    grip,
    { ...grip, capture: { launch: ball, matches: (): boolean => true } },
  ], 1);
  TestValidator.equals("only one exact reception is reserved", approach, [
    { subject: "actor", side: "left", from: 0.75, until: 1 },
  ]);
  const plain: IAutoMovieMotionPropLaunch = { prop: "ball", seconds: 0, point: ZERO, velocity: ZERO };
  TestValidator.predicate(
    "only a spherical prop with a capture can reserve a hand",
    HumanPropCatchHands.forLaunch(plain, [{ ...grip, capture: { ...grip.capture!, launch: plain } }], 1).length === 0 &&
      HumanPropCatchHands.forLaunch(ball, [grip], undefined).length === 0,
  );

  const names: readonly AutoMovieHumanoidBone[] = ["leftLowerArm", "leftHand", "leftRingProximal", "rightHand"];
  const omit = (seconds: number): readonly AutoMovieHumanoidBone[] => {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
      names.map((bone: AutoMovieHumanoidBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
        bone,
        { bone, localRotation: IDENTITY, worldRotation: IDENTITY, worldPosition: ZERO },
      ]),
    );
    return [...HumanPropCatchHands.omit(bones, approach, seconds).keys()];
  };
  const remaining: readonly AutoMovieHumanoidBone[] = ["leftLowerArm", "rightHand"];
  TestValidator.equals("the approach is inclusive", [omit(0.625), omit(0.75), omit(1), omit(1.125)], [names, remaining, remaining, names]);

  const { state } = await standingPerformanceState();
  const point: IAutoMovieVector3 = HumanPerformanceRead.bones(
    state,
    "actor",
    grip.from,
    new Set<AutoMovieHumanoidBone>(["leftHand"]),
  ).get("leftHand")!.worldPosition;
  const near = { position: point, rotation: IDENTITY };
  const far = { ...near, position: { ...point, z: point.z + 2 } };
  TestValidator.predicate(
    "only an observed sphere at the hand closes its fitted reception",
    HumanPropCatchHands.closes(state, grip, near) &&
      !HumanPropCatchHands.closes(state, grip, far) &&
      HumanPropCatchHands.closes(state, { subject: "actor", side: "left", from: 1, to: 2 }, far),
  );
}
