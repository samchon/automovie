import {
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineComfort,
  type AutoMovieArchetypeEquineComfortCue,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equineExpressionObservation as Look } from "../internal/equineExpressionObservation";

/** The horse producer's model. */
type Horse = ReturnType<typeof createHorse>;

/** A horse ride. */
type Ride = AutoMovieArchetypeRide.IRide<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
>;

/** A sample of a horse ride. */
type Sample = AutoMovieArchetypeRide.ISample<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
>;

/** A named instant of a ride. */
type Instant = Ride["instants"][number];

/** An idle act's length bounds, seconds. */
type Bounds = readonly [number, number];

/**
 * The standing horse's facial comfort acts and seeded idle cycles over a real halt.
 *
 * Scenarios:
 * 1. A doze lowers the neck toward horizontal, droops both ears below their neutral carriage and slackens the lower lip; the flehmen raises the head and curls the upper lip up out of the muzzle; a yawn opens the jaw wide; each returns exactly to neutral after its window.
 * 2. A skin twitch is one named instant; the lead rope's end stays on the halter as the head moves.
 * 3. The same seed draws the same idle cycle; another seed draws different timing; every act's length and every neutral gap lies within the documented bounds, rests alternate sides, and the cycle ends by its end.
 * 4. A seeded cycle plays over the halt and is neutral in its gaps.
 * 5. A doze asked for at a walk refuses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names every scenario and what it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the public comfort acts and idle cycles over the public horse ride and reads displayed bars and instants.
 * @evidence contracts/development/testing.md#independent-expectations Carriages are read as displayed bar angles against the halt; the idle bounds are the ones `AutoMovieArchetypeEquineComfort` documents.
 * @evidence contracts/development/testing.md#distinguishing-cases Inside versus after each window, same versus different seeds, standing versus moving.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous in-memory scenario; the whole-body acts are `test_archetype_equine_reaction_comfort`'s.
 */
export function test_archetype_equine_expression_comfort(): void {
  const horse: Horse = createHorse(
    { tack: "saddle", withersHeight: 1.6, tempo: 0 },
    5,
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
  const faces: Ride = AutoMovieArchetypeEquineComfort.after(horse, ride, [
    { kind: "doze", from: t, seconds: 8 },
    { kind: "flehmen", from: t + 9, seconds: 4 },
    { kind: "yawn", from: t + 14, seconds: 3 },
    { kind: "twitch", region: "flank", from: t + 18, seconds: 0.5 },
  ]);
  const halt: Sample = ride.at(ride.duration);
  const elevation = (sample: Sample, id: string): number => {
    const axis: IAutoMovieVector3 = Look.axis(sample, id);
    return (Math.atan2(axis.y, Math.hypot(axis.x, axis.z)) * 180) / Math.PI;
  };
  const opened = (sample: Sample, id: string): number =>
    Look.degrees(Look.axis(sample, id), Look.axis(sample, "head")) -
    Look.degrees(Look.axis(halt, id), Look.axis(halt, "head"));

  // 1. Doze, flehmen and yawn.
  const dozing: Sample = faces.at(t + 4);
  TestValidator.predicate(
    "the doze lowers the neck toward horizontal",
    Math.abs(elevation(dozing, "neck")) <
      Math.abs(elevation(halt, "neck")) - 15,
  );
  for (const ear of ["leftEar", "rightEar"])
    TestValidator.predicate(
      `the doze droops the ${ear}`,
      Look.axis(dozing, ear).y < Look.axis(halt, ear).y - 0.3,
    );
  TestValidator.predicate(
    "the doze slackens the lower lip",
    Math.abs(opened(dozing, "jaw") - 4) <= 1e-6,
  );
  const flehmen: Sample = faces.at(t + 11);
  TestValidator.predicate(
    "the flehmen raises the head",
    elevation(flehmen, "head") > elevation(halt, "head") + 30,
  );
  TestValidator.predicate(
    "the flehmen curls the upper lip up out of the muzzle",
    Math.abs(opened(flehmen, "lip") - 45) <= 1e-6 &&
      Look.bar(flehmen, "lip").to.y > Look.bar(flehmen, "head").to.y,
  );
  const yawning: Sample = faces.at(t + 15.5);
  TestValidator.predicate(
    "the yawn opens the jaw wide",
    Math.abs(opened(yawning, "jaw") - 35) <= 1e-6,
  );
  // The lead rope's halter end stays on the head while it moves.
  const halter = (sample: Sample): IAutoMovieVector3 => {
    const rope: Look.IBar = Look.bar(sample, "lead");
    const head: IAutoMovieTransform = Look.frame(sample, "head");
    const end: IAutoMovieVector3 =
      Vector3.distance(rope.to, head.translation) <
      Vector3.distance(rope.from, head.translation)
        ? rope.to
        : rope.from;
    return Quaternion.rotateVector(
      Quaternion.inverse(head.rotation),
      Vector3.subtract(end, head.translation),
    );
  };
  for (const shown of [dozing, flehmen, yawning])
    TestValidator.predicate(
      "the lead rope stays on the halter",
      Vector3.distance(halter(shown), halter(halt)) <= 1e-9,
    );
  for (const after of [t + 8.5, t + 13.5, t + 17.5])
    TestValidator.equals(
      `the face is neutral again at ${after}`,
      JSON.stringify(faces.at(after).archetype.parts),
      JSON.stringify(ride.at(after).archetype.parts),
    );

  // 2. The twitch mark.
  TestValidator.equals(
    "the twitch is one named instant",
    faces.instants
      .filter((instant: Instant): boolean =>
        instant.label.startsWith("twitch:"),
      )
      .map((instant: Instant): string => `${instant.label}@${instant.seconds}`),
    [`twitch:flank@${t + 18}`],
  );

  // 3. Seeded idle cycles.
  const end: number = t + 120;
  const cycle: AutoMovieArchetypeEquineComfortCue.Act[] =
    AutoMovieArchetypeEquineComfort.idle(7, t, end);
  TestValidator.equals(
    "the same seed draws the same cycle",
    AutoMovieArchetypeEquineComfort.idle(7, t, end),
    cycle,
  );
  const other: AutoMovieArchetypeEquineComfortCue.Act[] =
    AutoMovieArchetypeEquineComfort.idle(8, t, end);
  TestValidator.predicate(
    "another seed draws different timing",
    JSON.stringify(
      other.map(
        (act: AutoMovieArchetypeEquineComfortCue.Act): number => act.from,
      ),
    ) !==
      JSON.stringify(
        cycle.map(
          (act: AutoMovieArchetypeEquineComfortCue.Act): number => act.from,
        ),
      ),
  );
  const bounds: Readonly<Record<string, Bounds>> = {
    rest: [8, 14],
    doze: [6, 10],
    swish: [1.5, 3],
    twitch: [0.5, 1],
    paw: [2, 3.5],
    stamp: [0.6, 0.9],
    shake: [1.5, 2.5],
    cowKick: [0.8, 1.2],
    yawn: [2.5, 4],
    flehmen: [3, 5],
  };
  for (const acts of [cycle, other]) {
    TestValidator.predicate("a cycle has several acts", acts.length >= 5);
    let before: number = t;
    let side: string | undefined;
    for (const act of acts) {
      const [low, high] = bounds[act.kind]!;
      TestValidator.predicate(
        `the ${act.kind} at ${act.from} lasts within its bounds`,
        act.seconds >= low && act.seconds <= high,
      );
      TestValidator.predicate(
        `the gap before ${act.from} is a neutral 1 to 3 s`,
        act.from - before >= 1 && act.from - before <= 3,
      );
      if (act.kind === "rest") {
        TestValidator.predicate(
          "rests alternate sides",
          side === undefined || act.side !== side,
        );
        side = act.side;
      }
      before = act.from + act.seconds;
    }
    TestValidator.predicate("the cycle ends by its end", before <= end);
  }

  // 4. A seeded cycle plays and is neutral between its acts.
  const idle: Ride = AutoMovieArchetypeEquineComfort.after(horse, ride, cycle);
  for (let k: number = 1; k < cycle.length; k++) {
    const gap: number =
      (cycle[k - 1]!.from + cycle[k - 1]!.seconds + cycle[k]!.from) / 2;
    TestValidator.equals(
      `the idle horse is neutral at ${gap}`,
      JSON.stringify(idle.at(gap).archetype.parts),
      JSON.stringify(ride.at(gap).archetype.parts),
    );
  }

  // 5. Refusal while moving.
  let caught: unknown = null;
  try {
    AutoMovieArchetypeEquineComfort.after(horse, ride, [
      { kind: "doze", from: ride.duration / 2, seconds: 4 },
    ]);
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "a doze at a walk refuses",
    caught instanceof AutoMovieArchetypeRefusal && caught.axis === "from",
  );
}
