import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";
import { HumanSegmentLegs } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { syntheticHumanPlan } from "../../../internal/synthetic/syntheticHumanPlan";

/** A curve with no seed. */
const NONE = (): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =>
  new Map();

/**
 * `HumanSegmentLegs` keeps one leg fit over an action's legs-still window: the
 * fit the performance prepared at the window's start (`IPrepared.still`)
 * replaces the legs' goals by their joint records in every plain leaf resolve
 * inside the window, whose seeds it adds.
 *
 * An action at 1 s keeps its legs still from 0.5 to 1.5 plan seconds.
 *
 * Scenarios:
 *
 * 1. `within` holds inside the window for a plain resolve with both legs goaled,
 *    and not outside it, for a continued resolve, or with one leg free.
 * 2. `still` keeps the leg records of a pose and the leaf fits' leg seeds.
 * 3. `resolved` inside the window resolves the posture without leg goals, with the
 *    kept records as joints and the kept seeds added; outside it resolves the
 *    posture as given.
 */
export function test_unit_motions_perform_segment_legs(): void {
  const person: HumanSegmentLegs.IPerson = { layers: [], overlays: [] };
  const plan: IAutoMovieMotionHumanActionPlan = syntheticHumanPlan({
    duration: 2,
    legsStill: [0.5, 1.5],
  });
  const carrier: HumanSegmentLegs.ICarrier = { start: 1, plan };
  const goal: IAutoMovieHumanLimbGoal = {
    point: { x: 0, y: 0, z: 0 },
    bend: { x: 0, y: 0, z: 1 },
  };
  const under: IAutoMovieMotionHumanPosture = {
    ...plan.posture(0),
    limbs: { leftLeg: goal, rightLeg: goal, leftArm: goal },
  };

  // 1. The window.
  TestValidator.predicate(
    "only a plain resolve with both legs goaled inside the window",
    HumanSegmentLegs.within(person, carrier, 2, under, true) &&
      !HumanSegmentLegs.within(person, carrier, 1.2, under, true) &&
      !HumanSegmentLegs.within(person, carrier, 2, under, false) &&
      !HumanSegmentLegs.within(
        person,
        carrier,
        2,
        { ...under, limbs: { leftLeg: goal } },
        true,
      ),
  );

  // 2. The kept fit.
  const seed: IAutoMovieSwivelSeed = { swivel: 12, branch: 0 };
  const pose: IAutoMoviePose = {
    skeleton: "humanoid",
    root: null,
    joints: [
      { bone: "leftUpperLeg", flexion: 20, abduction: 1, twist: 2 },
      { bone: "head", flexion: 5, abduction: 0, twist: 0 },
    ],
  };
  const kept: IAutoMovieMotionHumanSegment.IStill = HumanSegmentLegs.still(
    pose,
    new Map<string, IAutoMovieSwivelSeed | null>([
      ["leaf::leftLeg", seed],
      ["leaf::leftArm", seed],
    ]),
  );
  TestValidator.predicate(
    "the leg records and seeds are kept",
    kept.joints.length === 1 &&
      kept.joints[0]!.bone === "leftUpperLeg" &&
      kept.seeds.leftLeg === seed &&
      kept.seeds.leftArm === undefined,
  );

  // 3. A resolve inside and outside the window.
  const prepared: HumanSegmentLegs.ICarrier = {
    ...carrier,
    prepared: {
      legs: NONE,
      swivels: NONE,
      anchors: [],
      stops: new Map(),
      still: kept,
    },
  };
  const asked: IAutoMovieMotionHumanPosture[] = [];
  const resolve = (
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded => {
    asked.push(posture);
    return { pose, seeds: {}, values: {} };
  };
  const inside: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
    HumanSegmentLegs.resolved(person, prepared, 2, under, true, resolve);
  HumanSegmentLegs.resolved(person, prepared, 1.2, under, true, resolve);
  TestValidator.predicate(
    "the window keeps the prepared legs",
    asked[0]!.limbs.leftLeg === undefined &&
      asked[0]!.limbs.leftArm === goal &&
      asked[0]!.joints.leftUpperLeg?.[0] === 20 &&
      inside.seeds.leftLeg === seed &&
      asked[1] === under,
  );
}
