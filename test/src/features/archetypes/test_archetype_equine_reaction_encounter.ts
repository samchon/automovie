import {
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineEncounter,
  type AutoMovieArchetypeEquineEncounterCue,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  createHorse,
  rideHorse,
  type rideQuadruped,
} from "@automovie/archetypes";
import { Vector3, closestPointsBetweenSegments } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equineExpressionObservation as Look } from "../internal/equineExpressionObservation";

/** A horse. */
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

/** Two of a kind. */
type Pair<T> = readonly [T, T];

/**
 * Two untacked horses' agonistic encounter on one clock.
 *
 * Scenarios:
 * 1. Face to face and a little to one side, the second horse threatens with both ears pinned against neutral; the first rears and strikes the second's shoulder with its left fore, both hind hooves planted, the hoof meeting the shoulder's surface; the second bites the first's neck, the muzzle meeting its surface; neither body enters the other's while they overlap, and before each contact they stand clear.
 * 2. Its hindquarters beside the first's forehand, the second kicks the first's shoulder with both hind hooves, both fore hooves planted, the hooves meeting the surface.
 * 3. The struck horse pins its ears in response once the strike is over; the second horse's retreat starts from its halt and goes on along its course.
 * 4. Staging twice replays the same takes; a strike at a region out of reach refuses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names every scenario and what it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Stages the public encounter over public horse rides and reads displayed bars.
 * @evidence contracts/development/testing.md#independent-expectations Contact and clearance are the displayed bars' segment distances less their radii; planted hooves are the halt's own.
 * @evidence contracts/development/testing.md#distinguishing-cases Before versus at contact, striker versus kicker supports, threat versus neutral ears.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous in-memory scenario.
 */
export function test_archetype_equine_reaction_encounter(): void {
  const horses: Pair<Horse> = [
    createHorse({ tack: "bare", withersHeight: 1.6, tempo: 0 }, 1),
    createHorse({ tack: "bare", withersHeight: 1.6, tempo: 0 }, 2),
  ];
  const walk = (horse: Horse, x: number, z: number, heading: number): Ride =>
    rideHorse(
      horse,
      {
        start: { x, z, heading },
        cruise: 1.2,
        startSpeed: 0,
        endSpeed: 0,
        acceleration: 1,
        deceleration: 1,
        startFromStanding: true,
        legs: [{ kind: "straight", length: 2 }],
      } satisfies rideQuadruped.ICourse,
      "walk",
    );
  const first: Ride = walk(horses[0], 0, 0, 0);
  const facing: Ride = walk(horses[1], 1, 5.6, 180);
  const t: number = Math.max(first.duration, facing.duration) + 0.5;
  const halt: Pair<Sample> = [
    first.at(first.duration),
    facing.at(facing.duration),
  ];
  const retreat: Ride = rideHorse(
    horses[1],
    {
      start: {
        x: halt[1].placement.translation.x,
        z: halt[1].placement.translation.z,
        heading: 180,
      },
      cruise: 3,
      startSpeed: 0,
      endSpeed: 0,
      acceleration: 1.5,
      deceleration: 1.5,
      startFromStanding: true,
      legs: [{ kind: "straight", length: 10 }],
    },
    "trot",
  );
  const acts: readonly AutoMovieArchetypeEquineEncounterCue.Act[] = [
    { kind: "threat", horse: 1, from: t, to: t + 2, ease: 0.3 },
    {
      kind: "strike",
      horse: 0,
      side: "left",
      region: "shoulder",
      from: t + 3,
      entry: 1,
      hold: 0.5,
      exit: 1,
    },
    {
      kind: "bite",
      horse: 1,
      region: "neck",
      from: t + 7,
      to: t + 9,
      ease: 0.5,
    },
  ];
  const stage = (): Pair<Ride> =>
    AutoMovieArchetypeEquineEncounter.stage(
      horses,
      [
        { ride: first },
        { ride: facing, retreat: { from: t + 10, ride: retreat } },
      ],
      acts,
    );
  const staged: Pair<Ride> = stage();
  const bars = (sample: Sample): Look.IBar[] =>
    sample.archetype.parts
      .filter(
        (part: IAutoMovieModelPart): boolean =>
          part.geometry.type === "primitive" &&
          (part.geometry.shape.type === "capsule" ||
            part.geometry.shape.type === "cylinder"),
      )
      .map((part: IAutoMovieModelPart): Look.IBar => {
        // A cylinder is read as the capsule inside it: its segment shortened by its radius at each end.
        const shown: Look.IBar = Look.bar(sample, part.id);
        if (
          part.geometry.type !== "primitive" ||
          part.geometry.shape.type !== "cylinder"
        )
          return shown;
        const length: number = Vector3.distance(shown.from, shown.to);
        const inset: number = Math.min(shown.radius, length / 2) / length;
        return {
          ...shown,
          from: Vector3.lerp(shown.from, shown.to, inset),
          to: Vector3.lerp(shown.to, shown.from, inset),
        };
      });
  const gap = (a: Look.IBar, b: Look.IBar): number =>
    closestPointsBetweenSegments(a.from, a.to, b.from, b.to).distance -
    a.radius -
    b.radius;
  // How far a hoof's endpoint stands off the other horse's barrel surface.
  const sole = (
    sample: Sample,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
    other: Sample,
  ): number => {
    const end: IAutoMovieVector3 = Look.bar(
      sample,
      AutoMovieArchetypeQuadrupedBody.BONES[limb][3],
    ).to;
    const barrel: Look.IBar = Look.bar(other, "trunk");
    return (
      closestPointsBetweenSegments(end, end, barrel.from, barrel.to).distance -
      barrel.radius
    );
  };
  const nearest = (a: Sample, b: Sample): number =>
    Math.min(
      ...bars(a).flatMap((x: Look.IBar): number[] =>
        bars(b).map((y: Look.IBar): number => gap(x, y)),
      ),
    );
  const planted = (
    sample: Sample,
    rest: Sample,
    limbs: readonly AutoMovieArchetypeQuadrupedBody.Limb[],
  ): boolean =>
    limbs.every(
      (limb: AutoMovieArchetypeQuadrupedBody.Limb): boolean =>
        Vector3.distance(
          Look.bar(sample, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]).to,
          Look.bar(rest, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]).to,
        ) <= 1e-6,
    );

  // 1. Threat, strike and bite.
  TestValidator.predicate(
    "the threat pins the ears against neutral",
    Look.degrees(
      Look.axis(staged[1].at(t + 1), "leftEar"),
      Look.axis(halt[1], "leftEar"),
    ) > 30,
  );
  const struck: Sample = staged[0].at(t + 3 + 1 + 0.25);
  const target: Sample = staged[1].at(t + 3 + 1 + 0.25);
  TestValidator.predicate(
    "the strike's hoof meets the shoulder",
    Math.abs(sole(struck, "leftFore", target)) <= 2e-3,
  );
  TestValidator.predicate(
    "the striker keeps both hind hooves planted",
    planted(struck, halt[0], ["leftHind", "rightHind"]),
  );
  const biting: Sample = staged[1].at(t + 8);
  TestValidator.predicate(
    `the bite's muzzle meets the neck ${gap(Look.bar(biting, "head"), Look.bar(staged[0].at(t + 8), "neck"))}`,
    Math.abs(
      gap(Look.bar(biting, "head"), Look.bar(staged[0].at(t + 8), "neck")),
    ) <= 2e-3,
  );
  for (let at: number = t; at <= t + 9.5; at += 0.1)
    TestValidator.predicate(
      `the bodies do not interpenetrate at ${at}`,
      nearest(staged[0].at(at), staged[1].at(at)) >= -2e-3,
    );
  TestValidator.predicate(
    "the horses stand clear before the strike",
    nearest(staged[0].at(t + 2.9), staged[1].at(t + 2.9)) > 0.05,
  );

  // 2. A double-barrel kick, tail to head.
  const behind: Ride = walk(horses[1], 0.9, 1.7, 0);
  const kicker: Sample = behind.at(behind.duration);
  const kicked: Pair<Ride> = AutoMovieArchetypeEquineEncounter.stage(
    horses,
    [{ ride: first }, { ride: behind }],
    [
      {
        kind: "kick",
        horse: 1,
        region: "shoulder",
        from: t,
        entry: 0.8,
        hold: 0.3,
        exit: 0.8,
      },
    ],
  );
  const kicking: Sample = kicked[1].at(t + 0.8 + 0.15);
  for (const limb of ["leftHind", "rightHind"] as const)
    TestValidator.predicate(
      `the kick's ${limb} meets the shoulder`,
      Math.abs(sole(kicking, limb, kicked[0].at(t + 0.95))) <= 2e-3,
    );
  TestValidator.predicate(
    "the kicker keeps both fore hooves planted",
    planted(kicking, kicker, ["leftFore", "rightFore"]),
  );

  // 3. Response and retreat.
  TestValidator.predicate(
    "the struck horse pins its ears",
    Look.degrees(
      Look.axis(staged[1].at(t + 6), "rightEar"),
      Look.axis(halt[1], "rightEar"),
    ) > 30,
  );
  TestValidator.predicate(
    "the retreat starts from the halt",
    Vector3.distance(
      staged[1].at(t + 10).placement.translation,
      halt[1].placement.translation,
    ) <= 1e-6,
  );
  TestValidator.predicate(
    "the retreat goes on along its course",
    Vector3.distance(
      staged[1].at(t + 10 + 4).placement.translation,
      halt[1].placement.translation,
    ) > 2,
  );

  // 4. Replay and refusal.
  const again: Pair<Ride> = stage();
  for (const at of [t + 1, t + 4.2, t + 8])
    TestValidator.equals(
      `staging replays at ${at}`,
      JSON.stringify(again[0].at(at).archetype.parts) +
        JSON.stringify(again[1].at(at).archetype.parts),
      JSON.stringify(staged[0].at(at).archetype.parts) +
        JSON.stringify(staged[1].at(at).archetype.parts),
    );
  let caught: unknown = null;
  try {
    AutoMovieArchetypeEquineEncounter.stage(
      horses,
      [{ ride: first }, { ride: walk(horses[1], 1, 12, 180) }],
      [
        {
          kind: "strike",
          horse: 0,
          side: "left",
          region: "shoulder",
          from: t + 6,
          entry: 1,
          hold: 0.5,
          exit: 1,
        },
      ],
    );
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "a strike out of reach refuses",
    caught instanceof AutoMovieArchetypeRefusal && caught.axis === "strike",
  );
}
