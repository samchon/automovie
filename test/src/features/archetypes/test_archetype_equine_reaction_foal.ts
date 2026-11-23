import {
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineExpression,
  AutoMovieArchetypeEquineFoal,
  type AutoMovieArchetypeEquineLibertyCue,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  createFoal,
  createHorse,
  rideHorse,
  rideQuadruped,
} from "@automovie/archetypes";
import { Vector3, closestPointsBetweenSegments } from "@automovie/engine";
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

/**
 * A foal and its mare.
 *
 * Scenarios:
 * 1. At birth and at weaning the foal's withers height is 60% and 84% of the mature height and its cannon 0.85 and 1 / 1.06 of the mature horse's, the cited growth rows; its distal limb is longer for its trunk than an adult's at both ages; the adult horse keeps its own fractions; an age past weaning refuses.
 * 2. A foal following its mare keeps to her flank within 0.3 m and changes gait as she does.
 * 3. A suckling foal's muzzle meets the standing mare's udder, both keeping their hooves planted.
 * 4. The mare foals on her side with her limbs extended; the newborn rises from lying without going under the floor, walks round to the risen mare's flank without entering her and makes its first suckling attempt on her udder, and replays.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names every scenario and what it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the public foal and plays the public following, suckling and foaling over public rides, reading displayed parts.
 * @evidence contracts/development/testing.md#independent-expectations Growth rows are the cited sources' (and the provisional birth cannon as stated); distances are displayed geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases Birth versus weaning, foal versus adult, held versus moving.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous in-memory scenario.
 */
export function test_archetype_equine_reaction_foal(): void {
  const mature: number = 1.62;
  const length = (
    model: ReturnType<typeof createHorse>,
    id: string,
  ): number => {
    const part: IAutoMovieModelPart = model.parts.find(
      (each: IAutoMovieModelPart): boolean => each.id === id,
    )!;
    return part.geometry.type === "primitive" &&
      (part.geometry.shape.type === "capsule" ||
        part.geometry.shape.type === "cylinder")
      ? part.geometry.shape.height
      : NaN;
  };
  const adult: ReturnType<typeof createHorse> = createHorse({
    tack: "bare",
    withersHeight: mature,
    tempo: 0,
  });

  // 1. Growth rows.
  for (const [age, withers, cannon] of [
    [0, 0.6, 0.85],
    [createFoal.WEANING, 0.84, 1 / 1.06],
  ] as const) {
    const foal: ReturnType<typeof createHorse> = createFoal({ age, mature });
    TestValidator.predicate(
      `the foal at ${age} days stands ${withers} of mature height`,
      Math.abs(foal.dimensions.withersHeight! - withers * mature) <= 1e-9,
    );
    TestValidator.predicate(
      `the foal at ${age} days has ${cannon} of the mature cannon`,
      Math.abs(
        length(foal, "leftForeCannon") / length(adult, "leftForeCannon") -
          cannon,
      ) <= 1e-9,
    );
    const ratio = (model: ReturnType<typeof createHorse>): number =>
      (length(model, "leftForeCannon") + length(model, "leftForePastern")) /
      length(model, "trunk");
    TestValidator.predicate(
      `the foal at ${age} days has a longer distal limb for its trunk`,
      ratio(foal) > ratio(adult),
    );
  }
  TestValidator.predicate(
    "the adult keeps its own cannon fraction",
    Math.abs(length(adult, "leftForeCannon") - 0.173 * mature) <= 1e-9,
  );
  let caught: unknown = null;
  try {
    createFoal({ age: 200 });
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "an age past weaning refuses",
    caught instanceof AutoMovieArchetypeRefusal && caught.axis === "age",
  );

  // 2. Following.
  const mare: ReturnType<typeof createHorse> = createHorse(
    { tack: "bare", withersHeight: mature, tempo: 0 },
    4,
  );
  const foal: ReturnType<typeof createHorse> = createFoal({ age: 90, mature });
  const going: Ride = rideHorse(mare, {
    start: { x: 0, z: 0, heading: 0 },
    cruise: 3.2,
    startSpeed: 1.2,
    endSpeed: 1.2,
    acceleration: 0.5,
    deceleration: 0.5,
    startFromStanding: undefined,
    legs: [{ kind: "straight", length: 40 }],
  });
  const keep: AutoMovieArchetypeEquineFoal.IFollow = {
    side: "left",
    out: 1.2,
    back: 0.4,
  };
  const following: Ride = AutoMovieArchetypeEquineFoal.follow(
    foal,
    going,
    keep,
  );
  for (let at: number = 1; at < going.duration - 1; at += 0.5) {
    const spot: IAutoMovieVector3 = Vector3.add(
      going.at(at).placement.translation,
      { x: keep.out, y: 0, z: -keep.back },
    );
    TestValidator.predicate(
      `the foal keeps to the flank at ${at}`,
      Vector3.distance(
        { ...following.at(at).placement.translation, y: 0 },
        { ...spot, y: 0 },
      ) <= 0.3,
    );
  }
  const changes = (ride: Ride): number =>
    ride.instants.filter((instant: Instant): boolean =>
      instant.label.startsWith("gait:"),
    ).length;
  TestValidator.predicate(
    "the foal changes gait as the mare does",
    changes(going) > 0 && changes(following) > 0,
  );

  // 3. Suckling.
  const standing: Ride = rideHorse(
    mare,
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
  const udder: IAutoMovieVector3 = AutoMovieArchetypeEquineFoal.udder(
    standing.at(standing.duration),
  );
  const approach: Ride = rideQuadruped(
    foal,
    {
      start: { x: 1.12 + 2, z: udder.z, heading: -90 },
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
  const t: number = Math.max(standing.duration, approach.duration) + 0.5;
  const sucking: Ride = AutoMovieArchetypeEquineExpression.layer(
    foal,
    approach,
    [
      AutoMovieArchetypeEquineFoal.suckling(standing, {
        from: t,
        to: t + 3,
        ease: 0.5,
      }),
    ],
  );
  const shown: Sample = sucking.at(t + 1.5);
  const head: Look.IBar = Look.bar(shown, "head");
  TestValidator.predicate(
    "the muzzle meets the udder",
    Math.abs(
      Vector3.distance(
        head.to,
        AutoMovieArchetypeEquineFoal.udder(standing.at(t + 1.5)),
      ) - head.radius,
    ) <= 2e-3,
  );
  for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS)
    TestValidator.predicate(
      `the foal's ${limb} stays planted while suckling`,
      Vector3.distance(
        Look.bar(shown, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]).to,
        Look.bar(
          approach.at(approach.duration),
          AutoMovieArchetypeQuadrupedBody.BONES[limb][3],
        ).to,
      ) <= 1e-6,
    );

  // 4. The newborn's rise after the foaling.
  const newborn: ReturnType<typeof createHorse> = createFoal({
    age: 0,
    mature,
  });
  // Each animal rests pitched so its trunk's and hindquarters' centres lie level, as the rest specs set it.
  const pitch = (model: ReturnType<typeof createHorse>): number => {
    const centre = (id: string): IAutoMovieVector3 =>
      model.parts.find((each: IAutoMovieModelPart): boolean => each.id === id)!
        .transform!.translation;
    return (
      (Math.atan2(
        centre("trunk").y - centre("hindquarters").y,
        centre("trunk").z - centre("hindquarters").z,
      ) *
        180) /
      Math.PI
    );
  };
  // The newborn's longer cannons fold steeper under it (70 degrees from down) so its carpi and hocks stay within its shorter upper bones' reach.
  const rest = (
    model: ReturnType<typeof createHorse>,
    fold: number,
  ): AutoMovieArchetypeEquineLibertyCue.Rest => ({
    loweringSeconds: 2,
    restingSeconds: 1,
    risingSeconds: 2,
    restPitch: pitch(model),
    tailDirection: -90,
    folded: { fore: [fold, 0], hind: [-fold, 0] },
    windows: { body: [0, 1], fore: [0, 1], hind: [0, 1] },
  });
  const foaling: AutoMovieArchetypeEquineFoal.IFoaling = {
    from: t,
    mare: { side: "left", down: 3, hold: 6 },
    delivery: t + 6,
    foal: rest(newborn, 70),
    behind: 3,
  };
  const [lying] = AutoMovieArchetypeEquineFoal.foaling(
    mare,
    standing,
    newborn,
    foaling,
  );
  const [, born] = AutoMovieArchetypeEquineFoal.foaling(
    mare,
    standing,
    newborn,
    {
      ...foaling,
      suckle: { side: "left", seconds: 3 },
    },
  );
  const onSide: number = lying.instants.find(
    (instant: Instant): boolean => instant.label === "lie:down",
  )!.seconds;
  TestValidator.predicate(
    "the mare foals on her side, her barrel down on the floor",
    Floor.body(lying.at(onSide + 1)) >= -1e-9 &&
      Floor.part(lying.at(onSide + 1), "trunk") <= 0.03,
  );
  for (const limb of ["leftFore", "leftHind"] as const)
    TestValidator.predicate(
      `the mare's lower ${limb} stays extended`,
      Math.abs(
        Look.degrees(
          Look.axis(
            lying.at(onSide + 1),
            AutoMovieArchetypeQuadrupedBody.BONES[limb][0],
          ),
          Look.axis(
            lying.at(onSide + 1),
            AutoMovieArchetypeQuadrupedBody.BONES[limb][1],
          ),
        ) -
          Look.degrees(
            Look.axis(
              standing.at(standing.duration),
              AutoMovieArchetypeQuadrupedBody.BONES[limb][0],
            ),
            Look.axis(
              standing.at(standing.duration),
              AutoMovieArchetypeQuadrupedBody.BONES[limb][1],
            ),
          ),
      ) <= 1,
    );
  const latch: number = born.instants.find(
    (instant: Instant): boolean => instant.label === "suckleOn",
  )!.seconds;
  const nursing: Sample = born.at(latch);
  const muzzle: Look.IBar = Look.bar(nursing, "head");
  TestValidator.predicate(
    "the newborn's first suckling meets the udder",
    Math.abs(
      Vector3.distance(
        muzzle.to,
        AutoMovieArchetypeEquineFoal.udder(lying.at(latch)),
      ) - muzzle.radius,
    ) <= 2e-3,
  );

  // Neither body enters the other while the foal suckles; a cylinder is read as the capsule inside it.
  const bars = (sample: Sample): Look.IBar[] =>
    sample.archetype.parts
      .filter(
        (part: IAutoMovieModelPart): boolean =>
          part.geometry.type === "primitive" &&
          (part.geometry.shape.type === "capsule" ||
            part.geometry.shape.type === "cylinder"),
      )
      .map((part: IAutoMovieModelPart): Look.IBar => {
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
  for (let at: number = lying.duration; at <= latch + 2; at += 0.25)
    TestValidator.predicate(
      `the foal does not enter the mare as it goes to suckle at ${at}`,
      bars(born.at(at)).every((a: Look.IBar): boolean =>
        bars(lying.at(at)).every(
          (b: Look.IBar): boolean =>
            closestPointsBetweenSegments(a.from, a.to, b.from, b.to).distance -
              a.radius -
              b.radius >=
            -2e-3,
        ),
      ),
    );
  for (let at: number = t + 6; at <= born.duration; at += 0.1)
    TestValidator.predicate(
      `the newborn stays on the floor at ${at}`,
      Floor.body(born.at(at)) >= -1e-6,
    );
  TestValidator.predicate(
    "the newborn stands at the end",
    Floor.part(born.at(born.duration), "trunk") > 0.3,
  );
  const once: string = JSON.stringify(born.at(t + 7).archetype.parts);
  born.at(t + 9);
  TestValidator.equals(
    "the foaling replays",
    JSON.stringify(born.at(t + 7).archetype.parts),
    once,
  );
}
