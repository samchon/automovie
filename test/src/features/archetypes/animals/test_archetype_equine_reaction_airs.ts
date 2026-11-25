import {
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineSpanishWalk,
  AutoMovieArchetypeEquineStance,
  type AutoMovieArchetypeEquineStanceCue,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  createHorse,
  rideHorse,
  type rideQuadruped,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equineExpressionObservation as Look } from "../../internal/equineExpressionObservation";

/** The horse producer's model. */
type Horse = ReturnType<typeof createHorse>;

/** A horse ride. */
type Ride = AutoMovieArchetypeRide.IRide<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
>;

/** A swing's highest fore sole and the second it is reached. */
interface IPeak {
  /** The sole's height above the floor, metres. */
  height: number;

  /** The film second. */
  at: number;
}

/** A sample of a horse ride. */
type Sample = AutoMovieArchetypeRide.ISample<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
>;

/**
 * The school airs over a real halted horse: pesade, levade, courbette and capriole.
 *
 * Scenarios:
 * 1. The pesade and levade hold their sources' trunk angles, 45 and 32.5 degrees (the middle of 30 to 35; Airs above the ground), on both planted hind soles with the forelimbs folded off the floor.
 * 2. In a three-leap courbette the forelegs never touch down, all four hooves are off the floor in the middle of every leap, the hind hooves land between leaps, and the horse ends three leaps forward on the floor.
 * 3. In the capriole all four hooves are off the floor through the flight, the trunk's height follows the ballistic apex of its flight time, and the horse lands on all four where it took off.
 * 4. Seeking backward and forward gives the same poses; an air asked for while the horse still moves and a capriole without a flight refuse.
 * 5. A Spanish walk swings each fore hoof high above the ordinary walk's swing with its carpus straight.
 * 6. A levade after a quarter spin pitches about the turned trunk's lateral axis: the spun bearing is kept and the trunk rises by the levade's angle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names every scenario and what it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the public stance's airs over the public horse ride and reads displayed limb bars and trunk.
 * @evidence contracts/development/testing.md#independent-expectations Angles are the cited sources'; the flight height is g T² / 8 from the authored flight time; contact is the displayed terminal bar's lowest point against the floor plane.
 * @evidence contracts/development/testing.md#distinguishing-cases Held airs versus leaps, in the air versus between leaps, before and after the flight, admitted versus refused cues.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous in-memory scenario; the ground responses are `test_archetype_equine_reaction`'s.
 */
export function test_archetype_equine_reaction_airs(): void {
  const horse: Horse = createHorse(
    { tack: "saddle", withersHeight: 1.72, tempo: 0 },
    11,
  );
  const ride: Ride = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      cruise: 1.2,
      startSpeed: 0,
      endSpeed: 0,
      acceleration: 1,
      deceleration: 1,
      startFromStanding: true,
      legs: [{ kind: "straight", length: 2 }],
    },
    "walk",
  );
  const t: number = ride.duration + 0.5;
  const leaps: number = 3;
  const cues: readonly AutoMovieArchetypeEquineStanceCue.Cue[] = [
    { kind: "air", air: "pesade", from: t, entry: 1.6, hold: 1.5, exit: 1.6 },
    {
      kind: "air",
      air: "levade",
      from: t + 5,
      entry: 1.6,
      hold: 1.5,
      exit: 1.6,
    },
    {
      kind: "courbette",
      leaps,
      from: t + 10,
      entry: 1.6,
      hold: 1.8,
      exit: 1.6,
    },
    { kind: "capriole", from: t + 16, entry: 0.6, hold: 0.5, exit: 0.6 },
  ];
  const stance: Ride = AutoMovieArchetypeEquineStance.after(horse, ride, cues);
  const halt: Sample = ride.at(ride.duration);
  const sole = (
    sample: Sample,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
  ): number => {
    const id: string = AutoMovieArchetypeQuadrupedBody.BONES[limb][3];
    const bar: Look.IBar = Look.bar(sample, id);
    const part: IAutoMovieModelPart = sample.archetype.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
    )!;
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(bar.to, bar.from),
    );
    const low: number = Math.min(bar.from.y, bar.to.y);
    return part.geometry.type === "primitive" &&
      part.geometry.shape.type === "cylinder"
      ? low - bar.radius * Math.hypot(axis.x, axis.z)
      : low - bar.radius;
  };
  const elevation = (sample: Sample): number => {
    const axis: IAutoMovieVector3 = Look.axis(sample, "trunk");
    return (Math.atan2(axis.y, Math.hypot(axis.x, axis.z)) * 180) / Math.PI;
  };

  // 1. Held airs.
  for (const [label, from, angle] of [
    ["pesade", t, 45],
    ["levade", t + 5, 32.5],
  ] as const) {
    const held: Sample = stance.at(from + 1.6 + 0.75);
    TestValidator.predicate(
      `the ${label} holds ${angle} degrees`,
      Math.abs(elevation(held) - elevation(halt) - angle) <= 1e-6,
    );
    for (const limb of ["leftHind", "rightHind"] as const)
      TestValidator.predicate(
        `the ${label} stands on the ${limb}`,
        Math.abs(sole(held, limb)) <= 1e-6,
      );
    for (const limb of ["leftFore", "rightFore"] as const)
      TestValidator.predicate(
        `the ${label} holds the ${limb} off the floor`,
        sole(held, limb) > 0.2,
      );
  }

  // 2. Courbette.
  const hold: number = t + 10 + 1.6;
  const period: number = 1.8 / leaps;
  for (let k: number = 0; k < leaps; k++) {
    const middle: Sample = stance.at(hold + (k + 0.5) * period);
    TestValidator.predicate(
      `courbette leap ${k} is in the air`,
      AutoMovieArchetypeQuadrupedBody.LIMBS.every(
        (limb: AutoMovieArchetypeQuadrupedBody.Limb): boolean =>
          sole(middle, limb) > 0.01,
      ),
    );
    if (k > 0) {
      const between: Sample = stance.at(hold + k * period + 1e-6);
      TestValidator.predicate(
        `the hind hooves land before leap ${k}`,
        Math.abs(sole(between, "leftHind")) <= 1e-3 &&
          sole(between, "leftFore") > 0.1,
      );
    }
  }
  const after: Sample = stance.at(t + 15.5);
  for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
    const moved: number =
      Look.bar(after, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]).to.z -
      Look.bar(halt, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]).to.z;
    TestValidator.predicate(
      `the ${limb} ends ${leaps} leaps forward on the floor`,
      Math.abs(sole(after, limb)) <= 1e-6 && moved > 0.9,
    );
  }

  // 3. Capriole.
  const flight: number = t + 16 + 0.6;
  const apex: number = (9.80665 * 0.5 * 0.5) / 8;
  const top: Sample = stance.at(flight + 0.25);
  const gathered: Sample = stance.at(flight - 1e-6);
  TestValidator.predicate(
    "the capriole flies to its ballistic apex",
    Math.abs(
      Look.frame(top, "trunk").translation.y -
        Look.frame(gathered, "trunk").translation.y -
        apex,
    ) <= 1e-6,
  );
  for (const at of [flight + 0.05, flight + 0.25, flight + 0.45]) {
    const shown: Sample = stance.at(at);
    TestValidator.predicate(
      `all four hooves are off the floor at ${at}`,
      AutoMovieArchetypeQuadrupedBody.LIMBS.every(
        (limb: AutoMovieArchetypeQuadrupedBody.Limb): boolean =>
          sole(shown, limb) > 0,
      ),
    );
  }
  const landed: Sample = stance.at(t + 18);
  const before: Sample = stance.at(t + 16 - 0.1);
  for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS)
    TestValidator.predicate(
      `the ${limb} lands where it took off`,
      Vector3.distance(
        Look.bar(landed, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]).to,
        Look.bar(before, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]).to,
      ) <= 1e-6,
    );

  // 6. A levade after a quarter spin pitches about the turned trunk's own lateral axis: the trunk keeps the spun bearing and rises by the levade's angle, with no roll.
  const turned: Ride = AutoMovieArchetypeEquineStance.after(horse, ride, [
    { kind: "spin", degrees: 90, from: t, entry: 3.2, hold: 0.3, exit: 0.6 },
    {
      kind: "air",
      air: "levade",
      from: t + 5,
      entry: 1.6,
      hold: 1.5,
      exit: 1.6,
    },
  ]);
  const bearing = (sample: Sample): number => {
    const axis: IAutoMovieVector3 = Look.axis(sample, "trunk");
    return (Math.atan2(axis.x, axis.z) * 180) / Math.PI;
  };
  const spun: Sample = turned.at(t + 4.6);
  const raised: Sample = turned.at(t + 5 + 1.6 + 0.75);
  TestValidator.predicate(
    "the spin turns the trunk a quarter",
    Math.abs(Math.abs(bearing(spun) - bearing(halt)) - 90) <= 1e-6,
  );
  TestValidator.predicate(
    "the levade after the spin keeps the spun bearing",
    Math.abs(bearing(raised) - bearing(spun)) <= 1e-6,
  );
  TestValidator.predicate(
    "the levade after the spin pitches 32.5 degrees",
    Math.abs(elevation(raised) - elevation(spun) - 32.5) <= 1e-6,
  );

  // 5. Spanish walk: each fore hoof swings high on a straight carpus, far above the ordinary walk's swing.
  const walkCourse: rideQuadruped.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    cruise: 1.2,
    startSpeed: 0,
    endSpeed: 0,
    acceleration: 1,
    deceleration: 1,
    startFromStanding: true,
    legs: [{ kind: "straight", length: 6 }],
  };
  const ordinary: Ride = rideHorse(horse, walkCourse, "walk");
  const spanish: Ride = AutoMovieArchetypeEquineSpanishWalk.layer(ordinary);
  const peak = (shown: Ride): IPeak => {
    let best: IPeak = { height: -Infinity, at: 0 };
    for (let at: number = 1; at < shown.duration - 1; at += 0.02) {
      const height: number = sole(shown.at(at), "leftFore");
      if (height > best.height) best = { height, at };
    }
    return best;
  };
  const high: IPeak = peak(spanish);
  const low: IPeak = peak(ordinary);
  TestValidator.predicate(
    "the Spanish walk lifts the fore hoof high",
    high.height > 0.3 * horse.dimensions.withersHeight! &&
      high.height > 2 * low.height,
  );
  const lifted: Sample = spanish.at(high.at);
  TestValidator.predicate(
    "the lifted forelimb keeps its carpus straight",
    Look.degrees(
      Look.axis(lifted, "leftForeRadius"),
      Look.axis(lifted, "leftForeCannon"),
    ) <= 15,
  );
  // 4. Seek both ways, and refusals.
  const times: number[] = [t + 2, t + 7, hold + 0.4, flight + 0.2];
  const forward: string[] = times.map((at: number): string =>
    JSON.stringify(stance.at(at).archetype.parts),
  );
  const backward: string[] = [...times]
    .reverse()
    .map((at: number): string => JSON.stringify(stance.at(at).archetype.parts))
    .reverse();
  TestValidator.equals("seeking both ways replays the airs", backward, forward);
  const refused = (
    label: string,
    bad: readonly AutoMovieArchetypeEquineStanceCue.Cue[],
    axis: string,
  ): void => {
    let caught: unknown = null;
    try {
      AutoMovieArchetypeEquineStance.after(horse, ride, bad);
    } catch (error) {
      caught = error;
    }
    TestValidator.predicate(
      `${label} refuses on ${axis}`,
      caught instanceof AutoMovieArchetypeRefusal && caught.axis === axis,
    );
  };
  refused(
    "a levade at a walk",
    [
      {
        kind: "air",
        air: "levade",
        from: ride.duration / 2,
        entry: 1,
        hold: 1,
        exit: 1,
      },
    ],
    "from",
  );
  refused(
    "a capriole without a flight",
    [{ kind: "capriole", from: t, entry: 0.5, hold: 0, exit: 0.5 }],
    "hold",
  );
}
