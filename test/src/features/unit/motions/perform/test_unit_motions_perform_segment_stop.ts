import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionWeaponPath,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSegmentStop } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { syntheticHumanPerson } from "../../../internal/synthetic/syntheticHumanPerson";
import { syntheticHumanSegment } from "../../../internal/synthetic/syntheticHumanSegment";

/**
 * `HumanSegmentStop` holds a stopped weapon's limb at its stop: the goal is a
 * constant of the stop, which the performance prepares once
 * (`IPrepared.stops`) and every later read takes as it is.
 *
 * Scenarios:
 *
 * 1. A prepared goal is returned as prepared, without evaluating a pose.
 * 2. A law that takes its stops itself prepares none.
 * 3. An action without weapons prepares none.
 */
export function test_unit_motions_perform_segment_stop(): void {
  const point: IAutoMovieVector3 = { x: 0, y: 1.4, z: 0.3 };
  const weapon: IAutoMovieMotionWeaponPath = {
    id: "fist",
    limb: "rightArm",
    radius: 0.05,
    from: 0,
    to: 1,
    path: (): IAutoMovieVector3 => point,
  };
  const segment: IAutoMovieMotionHumanSegment = syntheticHumanSegment({
    entryTime: 0,
    end: 1,
    duration: 1,
  });
  const person: IAutoMovieMotionHumanSegment.IPerson = syntheticHumanPerson(
    "ann",
    [segment],
  );

  // 1. A prepared goal.
  const held: IAutoMovieHumanLimbGoal = {
    point,
    bend: { x: 0, y: 1, z: 0 },
    planted: true,
  };
  segment.prepared = {
    legs: (): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =>
      new Map(),
    swivels: (): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =>
      new Map(),
    anchors: [],
    stops: new Map([["fist", held]]),
  };
  TestValidator.predicate(
    "a prepared stop is read as prepared",
    HumanSegmentStop.goal(person, segment, weapon, 0.6) === held,
  );

  // 2. A law that takes its stops.
  segment.plan.weapons = [weapon];
  segment.plan.stop = (): void => {};
  person.stops.set("0:fist", 0.6);
  TestValidator.predicate(
    "a law taking its stops prepares none",
    HumanSegmentStop.prepare(person, segment).size === 0,
  );

  // 3. No weapon.
  delete segment.plan.stop;
  segment.plan.weapons = [];
  TestValidator.predicate(
    "an action without weapons prepares none",
    HumanSegmentStop.prepare(person, segment).size === 0,
  );
}
