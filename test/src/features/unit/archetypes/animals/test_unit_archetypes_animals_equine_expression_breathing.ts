import {
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineBreathing,
  type AutoMovieArchetypeRide,
  createHorse,
  rideHorse,
  type rideQuadruped,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** A horse ride. */
type Ride = AutoMovieArchetypeRide.IRide<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
>;

/** A breathing horse ride. */
type Breathing = AutoMovieArchetypeEquineBreathing.IRide<
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
 * A saddled horse breathing: locked to the canter's stride, recovering after an effort, at rest otherwise, with the tack riding the barrel.
 *
 * Scenarios:
 * 1. At the canter the displayed barrel is fullest at every left fore landing and slimmest half a stride later: one breath per stride at a fixed phase of the hoof events.
 * 2. After an effort the breathing rate and depth fall monotonically to the rest values (12 per minute, MSD Veterinary Manual; the authored 4 mm) by the recovery's end, the nostrils flaring early and not at rest.
 * 3. At the largest expansion every part the barrel carries, the saddle's and the harness's, keeps its distance from the barrel's surface: it moves out exactly as the barrel grows.
 * 4. With no effort the horse breathes at rest values, and seeking replays.
 */
export function test_unit_archetypes_animals_equine_expression_breathing(): void {
  const horse: ReturnType<typeof createHorse> = createHorse(
    { tack: "both", withersHeight: 1.72, tempo: 0 },
    3,
  );
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
  const find = (
    parts: readonly IAutoMovieModelPart[],
    id: string,
  ): IAutoMovieModelPart =>
    parts.find((each: IAutoMovieModelPart): boolean => each.id === id)!;
  const part = (sample: Sample, id: string): IAutoMovieModelPart =>
    find(sample.archetype.parts, id);
  const width = (found: IAutoMovieModelPart): number => {
    const shape: IAutoMovieModelPart["geometry"] = found.geometry;
    return shape.type === "primitive" &&
      (shape.shape.type === "capsule" || shape.shape.type === "sphere")
      ? shape.shape.radius
      : NaN;
  };
  const radius = (sample: Sample, id: string): number =>
    width(part(sample, id));
  const rest: number = width(find(horse.parts, "trunk"));

  // 1. One breath per canter stride.
  const canter: Breathing = AutoMovieArchetypeEquineBreathing.layer(
    horse,
    rideHorse(horse, course(40, 6), "canter"),
    { gait: "canter" },
  );
  const landings: number[] = canter.instants
    .filter((instant: Instant): boolean => instant.label === "leftForeOn")
    .map((instant: Instant): number => instant.seconds)
    .filter(
      (seconds: number): boolean =>
        seconds > canter.duration * 0.3 && seconds < canter.duration * 0.7,
    );
  TestValidator.predicate(
    "the canter has several strides",
    landings.length >= 3,
  );
  for (let k: number = 0; k + 1 < landings.length; k++) {
    const full: number = radius(canter.at(landings[k]!), "trunk");
    const slim: number = radius(
      canter.at((landings[k]! + landings[k + 1]!) / 2),
      "trunk",
    );
    TestValidator.predicate(
      `the barrel is fullest at landing ${k}`,
      Math.abs(full - rest - canter.breath(landings[k]!).depth) <= 1e-9 &&
        canter.breath(landings[k]!).locked,
    );
    TestValidator.predicate(
      `the barrel is slimmest mid-stride ${k}`,
      Math.abs(slim - rest) <= 1e-9,
    );
  }

  // 2. Recovery after an effort, on a halted horse.
  const walk: Ride = rideHorse(horse, course(2, 1.2), "walk");
  const effort: AutoMovieArchetypeEquineBreathing.IEffort = {
    from: walk.duration + 1,
    seconds: 30,
    rate: 90,
    depth: 0.02,
  };
  const recovering: Breathing = AutoMovieArchetypeEquineBreathing.layer(
    horse,
    walk,
    {
      gait: "walk",
      efforts: [effort],
    },
  );
  let previous: AutoMovieArchetypeEquineBreathing.IBreath = recovering.breath(
    effort.from,
  );
  for (let s: number = 1; s <= 31; s += 1) {
    const now: AutoMovieArchetypeEquineBreathing.IBreath = recovering.breath(
      effort.from + s,
    );
    TestValidator.predicate(
      `the recovery falls monotonically at ${s} s`,
      now.rate <= previous.rate + 1e-12 && now.depth <= previous.depth + 1e-12,
    );
    previous = now;
  }
  TestValidator.predicate(
    "the recovery reaches rest by its end",
    previous.rate === 12 && previous.depth === 0.004,
  );
  const flaring: Sample = recovering.at(
    effort.from + (1 - recovering.breath(effort.from).phase) / 1.5,
  );
  TestValidator.predicate(
    "the nostrils flare early in the recovery",
    radius(flaring, "leftNostril") > radius(walk.at(0), "leftNostril"),
  );

  // 3. The saddle rides the barrel at its largest expansion.
  const peak: number = landings[0]!;
  const big: Sample = canter.at(peak);
  const plain: Sample = rideHorse(horse, course(40, 6), "canter").at(peak);
  const offAxis = (sample: Sample, id: string): number => {
    const trunk: IAutoMovieModelPart = part(sample, "trunk");
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(
      trunk.transform!.rotation,
      { x: 0, y: 1, z: 0 },
    );
    const from: IAutoMovieVector3 = Vector3.subtract(
      part(sample, id).transform!.translation,
      trunk.transform!.translation,
    );
    return Vector3.length(
      Vector3.addScaled(from, axis, -Vector3.dot(from, axis)),
    );
  };
  const growth: number = radius(big, "trunk") - radius(plain, "trunk");
  const moved: string[] = big.archetype.parts
    .map((each: IAutoMovieModelPart): string => each.id)
    .filter(
      (id: string): boolean =>
        id !== "trunk" &&
        // Reins and the lead are spans re-laid between the head and their held contacts, not laid on the barrel.
        !id.startsWith("rein") &&
        id !== "lead" &&
        Math.abs(offAxis(big, id) - offAxis(plain, id)) > 1e-9,
    );
  for (const id of moved)
    TestValidator.predicate(
      `the ${id} moves out exactly with the barrel`,
      Math.abs(offAxis(big, id) - offAxis(plain, id) - growth) <= 1e-9,
    );
  for (const id of ["saddle", "pommel", "cantle"])
    TestValidator.predicate(
      `the saddle's ${id} rides the barrel`,
      moved.includes(id),
    );
  TestValidator.predicate(
    "the harness rides the barrel",
    moved.some(
      (id: string): boolean =>
        !["saddle", "pommel", "cantle"].includes(id) &&
        !id.startsWith("stirrup") &&
        !id.startsWith("leather"),
    ),
  );

  // 4. At rest without effort, and replay.
  const calm: Breathing = AutoMovieArchetypeEquineBreathing.layer(horse, walk, {
    gait: "walk",
  });
  for (const at of [0.5, walk.duration, walk.duration + 5])
    TestValidator.predicate(
      `no effort breathes at rest at ${at}`,
      calm.breath(at).rate === 12 && calm.breath(at).depth === 0.004,
    );
  const times: number[] = [1, 3.3, 7.9];
  const forward: string[] = times.map((at: number): string =>
    JSON.stringify(recovering.at(effort.from + at).archetype.parts),
  );
  const backward: string[] = [...times]
    .reverse()
    .map((at: number): string =>
      JSON.stringify(recovering.at(effort.from + at).archetype.parts),
    )
    .reverse();
  TestValidator.equals("seeking replays the breath", backward, forward);
}
