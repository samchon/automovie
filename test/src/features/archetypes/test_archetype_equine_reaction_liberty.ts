import {
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineFall,
  AutoMovieArchetypeEquineLiberty,
  type AutoMovieArchetypeEquineLibertyCue,
  AutoMovieArchetypeQuadrupedBody,
  type AutoMovieArchetypeQuadrupedLateralRestPlan,
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

import { equineExpressionObservation as Look } from "../internal/equineExpressionObservation";
import { equineFloorObservation as Floor } from "../internal/equineFloorObservation";

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

/** A lying side. */
type Side = "left" | "right";

/**
 * Trained liberty poses and the trained fall over an untacked horse.
 *
 * Scenarios:
 * 1. The kneel rests both carpi on the floor with both hind hooves planted; the bow stretches one fore hoof forward on the floor and kneels the other; the sit rests the hindquarters and both hocks on the floor with both fore hooves planted; each holds still through its hold and no part goes under the floor.
 * 2. The lateral dead hold lies the barrel on the floor still through its hold and rises to standing.
 * 3. A fall from a canter onto each side drops the shoulder and barrel onto the floor on that side, slides the authored distance, never goes under the floor, starts continuous with the stride, rises and joins its first steps of a walk off, and seeks the same both ways.
 * 4. A fall onto unprepared ground or above the speed bound refuses, typed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names every scenario and what it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the public liberty work and fall over public horse rides and reads displayed parts.
 * @evidence contracts/development/testing.md#independent-expectations Contacts are each displayed primitive's lowest point against the floor plane; the slide is the displayed placement's travel.
 * @evidence contracts/development/testing.md#distinguishing-cases Planted versus folded limbs, held versus moving, both sides, prepared versus unprepared and slow versus fast.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous in-memory scenario.
 */
export function test_archetype_equine_reaction_liberty(): void {
  const horse: ReturnType<typeof createHorse> = createHorse({
    tack: "bare",
    withersHeight: 1.72,
    tempo: 0,
  });
  const course = (length: number, cruise: number): rideQuadruped.ICourse => ({
    start: { x: 0, z: 0, heading: 0 },
    cruise,
    startSpeed: 0,
    endSpeed: 0,
    acceleration: 2,
    deceleration: 2,
    startFromStanding: true,
    legs: [{ kind: "straight", length }],
  });
  const walk: Ride = rideHorse(horse, course(2, 1.2), "walk");
  const t: number = walk.duration + 0.5;
  const halt: Sample = walk.at(walk.duration);
  const trunk: IAutoMovieModelPart = horse.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "trunk",
  )!;
  const quarters: IAutoMovieModelPart = horse.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "hindquarters",
  )!;
  const rest: AutoMovieArchetypeEquineLibertyCue.Rest = {
    loweringSeconds: 2,
    restingSeconds: 1,
    risingSeconds: 2,
    restPitch:
      (Math.atan2(
        trunk.transform!.translation.y - quarters.transform!.translation.y,
        trunk.transform!.translation.z - quarters.transform!.translation.z,
      ) *
        180) /
      Math.PI,
    tailDirection: -90,
    folded: { fore: [90, 0], hind: [-90, 0] },
    windows: { body: [0, 1], fore: [0, 1], hind: [0, 1] },
  };
  const lateral = (
    side: Side,
  ): AutoMovieArchetypeQuadrupedLateralRestPlan.IParams => ({
    side,
    rollDegrees: 90,
    tuckDegrees: 35,
    turnSeconds: 1,
    holdSeconds: 0.8,
    offset: 0.08,
  });
  const planted = (
    sample: Sample,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
  ): boolean =>
    Vector3.distance(
      Look.bar(sample, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]).to,
      Look.bar(halt, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]).to,
    ) <= 1e-6 &&
    Math.abs(
      Floor.part(sample, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]),
    ) <= 1e-6;
  const still = (a: Sample, b: Sample): boolean =>
    JSON.stringify(a.archetype.parts) === JSON.stringify(b.archetype.parts);

  // 1. Kneel, bow and sit.
  const work: Ride = AutoMovieArchetypeEquineLiberty.after(horse, walk, [
    { kind: "kneel", from: t, entry: 1.5, hold: 1, exit: 1.5 },
    { kind: "bow", side: "left", from: t + 5, entry: 1.5, hold: 1, exit: 1.5 },
    { kind: "sit", from: t + 10, entry: 1.5, hold: 1, exit: 1.5 },
  ]);
  const kneeling: Sample = work.at(t + 1.5 + 0.1);
  for (const limb of ["leftFore", "rightFore"] as const)
    TestValidator.predicate(
      `the kneel rests the ${limb}'s carpus on the floor`,
      Math.abs(
        Math.min(
          Floor.part(kneeling, AutoMovieArchetypeQuadrupedBody.BONES[limb][2]),
          Floor.part(kneeling, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]),
        ),
      ) <= 1e-6 &&
        Look.bar(kneeling, AutoMovieArchetypeQuadrupedBody.BONES[limb][2]).from
          .y <= 0.06,
    );
  for (const limb of ["leftHind", "rightHind"] as const)
    TestValidator.predicate(
      `the kneel keeps the ${limb} planted`,
      planted(kneeling, limb),
    );
  const bowing: Sample = work.at(t + 5 + 1.5 + 0.1);
  TestValidator.predicate(
    "the bow stretches the left fore forward on the floor",
    Math.abs(
      Floor.part(bowing, AutoMovieArchetypeQuadrupedBody.BONES.leftFore[3]),
    ) <= 1e-6 &&
      Look.bar(bowing, AutoMovieArchetypeQuadrupedBody.BONES.leftFore[3]).to.z >
        Look.bar(bowing, AutoMovieArchetypeQuadrupedBody.BONES.leftFore[0]).from
          .z +
          0.2,
  );
  TestValidator.predicate(
    "the bow kneels the right fore",
    Look.bar(bowing, AutoMovieArchetypeQuadrupedBody.BONES.rightFore[2]).from
      .y <= 0.06,
  );
  const sitting: Sample = work.at(t + 10 + 1.5 + 0.1);
  TestValidator.predicate(
    "the sit rests the hindquarters on the floor",
    Math.abs(Floor.part(sitting, "hindquarters")) <= 1e-6,
  );
  for (const limb of ["leftHind", "rightHind"] as const)
    TestValidator.predicate(
      `the sit rests the ${limb}'s hock on the floor`,
      Math.abs(
        Math.min(
          Floor.part(sitting, AutoMovieArchetypeQuadrupedBody.BONES[limb][1]),
          Floor.part(sitting, AutoMovieArchetypeQuadrupedBody.BONES[limb][2]),
          Floor.part(sitting, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]),
        ),
      ) <= 2e-3 &&
        Look.bar(sitting, AutoMovieArchetypeQuadrupedBody.BONES[limb][2]).from
          .y <= 0.07,
    );
  for (const limb of ["leftFore", "rightFore"] as const)
    TestValidator.predicate(
      `the sit keeps the ${limb} planted`,
      planted(sitting, limb),
    );
  for (const [label, from] of [
    ["kneel", t],
    ["bow", t + 5],
    ["sit", t + 10],
  ] as const) {
    TestValidator.predicate(
      `the ${label} holds still`,
      still(work.at(from + 1.5 + 0.05), work.at(from + 2.5 - 0.05)),
    );
    for (let at: number = from; at <= from + 4; at += 0.25)
      TestValidator.predicate(
        `no part goes under the floor in the ${label} at ${at}`,
        Floor.body(work.at(at)) >= -1e-6,
      );
  }

  // 2. The lateral dead hold.
  const dead: Ride = AutoMovieArchetypeEquineLiberty.after(horse, walk, [], {
    from: t,
    rest,
    lateral: lateral("left"),
  });
  const onSide: number = dead.instants.find(
    (instant: Instant): boolean => instant.label === "rest:lateralOn",
  )!.seconds;
  TestValidator.predicate(
    "the dead hold lies the barrel on the floor",
    Math.abs(Floor.part(dead.at(onSide + 0.1), "trunk")) <= 1e-3,
  );
  TestValidator.predicate(
    "the dead hold is still",
    still(dead.at(onSide + 0.05), dead.at(onSide + 0.75)),
  );
  TestValidator.predicate(
    "the dead hold rises to standing",
    Floor.body(dead.at(dead.duration)) >= -1e-6 &&
      Math.abs(Floor.part(dead.at(dead.duration), "trunk")) > 0.5,
  );

  // 3. Falls from a canter onto both sides.
  const canter: Ride = rideHorse(horse, course(40, 6), "canter");
  const from: number = canter.duration / 2;
  for (const side of ["left", "right"] as const) {
    const fall: Ride = AutoMovieArchetypeEquineFall.after(horse, canter, {
      from,
      drop: 0.6,
      slide: 3,
      prepared: true,
      rest,
      lateral: lateral(side),
      away: { length: 2, speed: 1.2 },
    });
    const stop: number = fall.instants.find(
      (instant: Instant): boolean => instant.label === "fall:stop",
    )!.seconds;
    const lying: Sample = fall.at(stop + 0.1);
    TestValidator.predicate(
      `the ${side} fall lies the barrel on the floor`,
      Math.abs(Floor.part(lying, "trunk")) <= 1e-3,
    );
    const near: number = Look.bar(
      lying,
      AutoMovieArchetypeQuadrupedBody.BONES[`${side}Fore`][0],
    ).from.y;
    const far: number = Look.bar(
      lying,
      AutoMovieArchetypeQuadrupedBody.BONES[
        `${side === "left" ? "right" : "left"}Fore`
      ][0],
    ).from.y;
    TestValidator.predicate(
      `the ${side} fall lands on its ${side} shoulder`,
      near < far,
    );
    const start: IAutoMovieVector3 = canter.at(from).placement.translation;
    TestValidator.predicate(
      `the ${side} fall slides 3 m`,
      Math.abs(
        Vector3.distance(
          { ...fall.at(stop).placement.translation, y: 0 },
          { ...start, y: 0 },
        ) - 3,
      ) <= 0.05,
    );
    for (let at: number = from; at <= fall.duration; at += 0.1)
      TestValidator.predicate(
        `the ${side} fall stays on the floor at ${at}`,
        Floor.body(fall.at(at)) >= -1e-6,
      );
    TestValidator.predicate(
      `the ${side} fall starts continuous with the stride`,
      Vector3.distance(
        Look.bar(fall.at(from + 1e-4), "trunk").from,
        Look.bar(canter.at(from), "trunk").from,
      ) <= 0.01,
    );
    // The rise joins its first steps: the standing pose carries on into the walk off, its hooves where it stood.
    const risen: number = fall.instants.find(
      (instant: Instant): boolean => instant.label === "rest:standing",
    )!.seconds;
    const before: Sample = fall.at(risen - 1e-6);
    const after: Sample = fall.at(risen + 1e-6);
    TestValidator.predicate(
      `the ${side} fall's rise joins its first step`,
      AutoMovieArchetypeQuadrupedBody.LIMBS.every(
        (limb: AutoMovieArchetypeQuadrupedBody.Limb): boolean =>
          Vector3.distance(
            Look.bar(before, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]).to,
            Look.bar(after, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]).to,
          ) <= 0.02,
      ) &&
        Vector3.distance(
          Look.bar(before, "trunk").from,
          Look.bar(after, "trunk").from,
        ) <= 0.02,
    );
    TestValidator.predicate(
      `the ${side} fall walks off`,
      Vector3.distance(
        fall.at(fall.duration).placement.translation,
        after.placement.translation,
      ) > 1.5,
    );
    const times: number[] = [from + 0.3, stop + 0.4, fall.duration - 0.5];
    const forward: string[] = times.map((at: number): string =>
      JSON.stringify(fall.at(at).archetype.parts),
    );
    const backward: string[] = [...times]
      .reverse()
      .map((at: number): string => JSON.stringify(fall.at(at).archetype.parts))
      .reverse();
    TestValidator.equals(`the ${side} fall seeks both ways`, backward, forward);
  }

  // 4. Refusals.
  const refused = (label: string, run: () => void, axis: string): void => {
    let caught: unknown = null;
    try {
      run();
    } catch (error) {
      caught = error;
    }
    TestValidator.predicate(
      `${label} refuses on ${axis}`,
      caught instanceof AutoMovieArchetypeRefusal && caught.axis === axis,
    );
  };
  refused(
    "a fall onto unprepared ground",
    () =>
      AutoMovieArchetypeEquineFall.after(horse, canter, {
        from,
        drop: 0.6,
        slide: 3,
        prepared: false,
        rest,
        lateral: lateral("left"),
      }),
    "surface",
  );
  const gallop: Ride = rideHorse(horse, course(80, 8.5), "gallop");
  refused(
    "a fall above the speed bound",
    () =>
      AutoMovieArchetypeEquineFall.after(horse, gallop, {
        from: gallop.duration / 2,
        drop: 0.6,
        slide: 3,
        prepared: true,
        rest,
        lateral: lateral("left"),
      }),
    "speed",
  );
}
