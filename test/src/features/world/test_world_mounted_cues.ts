import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  type AutoMovieArchetypeManoeuvre,
  AutoMovieArchetypeQuadrupedGait,
  type AutoMovieArchetypeRide,
  createHorse,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** Seconds between the speed profile's samples. */
const STEP: number = 0.1;

/** The authored delay from a cue to the rider's aid, seconds. */
const REACTION: number = 0.3;

/** The authored time a pace change takes once aided, seconds. */
const RAMP: number = 0.6;

/**
 * Break a horse from a starting stall on the door cue, and change a squadron
 * horse's gait on trumpet cues, on straight timed paths.
 *
 * Scenarios:
 *
 * 1. A horse standing in its stall lands no hoof before the doors open and its
 *    rider's reaction, and lands its first within one stride after.
 * 2. On each trumpet cue the horse changes gait up, from walk to trot and then
 *    from trot to a faster gait of its own table, each change falling after its
 *    cue and within the reaction, the ramp and one stride of the gait it
 *    leaves.
 * 3. A cue naming the gallop changes the trot to the gallop within the same bound,
 *    though the speed alone would not call it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the break, the cues and the bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Rides a real horse with `rideQuadruped` on `AutoMovieArchetypeCourse.timed` speed profiles and reads its hoof and gait instants.
 * @evidence contracts/development/testing.md#independent-expectations A standing horse takes no step. The stride bound is the species' own declared stride period at the speed, read from `AutoMovieArchetypeQuadrupedGait.timing`. Each cued cruise lies above the previous gait's greatest declared speed and below its own, so only the cued ramps cross a change point.
 * @evidence contracts/development/testing.md#distinguishing-cases A stall hold before the cue and the departure after it; three up-changes and no other gait change.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only spec; the trumpet and the doors are authored cue seconds.
 */
export function test_world_mounted_cues(): void {
  const horse: AutoMovieArchetype = createHorse({ withersHeight: 1.62 }, 1001);
  const species: createQuadruped.ISpecies = createQuadruped.species(horse);
  const middle: (gait: AutoMovieArchetypeQuadrupedGait.Gait) => number = (
    gait: AutoMovieArchetypeQuadrupedGait.Gait,
  ): number => {
    const range: AutoMovieArchetypeManoeuvre.ISpeedRange =
      AutoMovieArchetypeQuadrupedGait.range(species, gait, 1.62);
    return (range.minimum + range.maximum) / 2;
  };
  const top: (gait: AutoMovieArchetypeQuadrupedGait.Gait) => number = (
    gait: AutoMovieArchetypeQuadrupedGait.Gait,
  ): number =>
    AutoMovieArchetypeQuadrupedGait.range(species, gait, 1.62).maximum;
  const stride: (
    gait: AutoMovieArchetypeQuadrupedGait.Gait,
    speed: number,
  ) => number = (
    gait: AutoMovieArchetypeQuadrupedGait.Gait,
    speed: number,
  ): number =>
    AutoMovieArchetypeQuadrupedGait.timing(
      species,
      gait,
      speed,
      horse.dimensions.tempo ?? 0,
      1.62,
    ).stride;

  // 1. The break.
  const doors: number = 2;
  const go: number = doors + REACTION;
  const trot: number = middle("trot");
  const breakaway: AutoMovieArchetypeRide.IRide<string, string> = rideQuadruped(
    horse,
    AutoMovieArchetypeCourse.timed(
      "runner",
      profile([
        knot(0, 0),
        knot(go, 0),
        knot(go + 2, trot),
        knot(go + 6, trot),
      ]),
    ),
  );
  const landings: number[] = breakaway.instants
    .filter(
      (
        i: AutoMovieArchetypeRide.IRide<string, string>["instants"][number],
      ): boolean => i.label.endsWith("On"),
    )
    .map(
      (
        i: AutoMovieArchetypeRide.IRide<string, string>["instants"][number],
      ): number => i.seconds,
    );
  const walk: number = AutoMovieArchetypeQuadrupedGait.range(
    species,
    "walk",
    1.62,
  ).minimum;
  TestValidator.predicate(
    `no hoof lands in the stall and the first lands within a stride of the break: ${JSON.stringify(landings.slice(0, 4))}`,
    landings.length > 0 &&
      landings.every((seconds: number): boolean => seconds > go) &&
      landings[0]! <= go + 2 + stride("walk", walk),
  );

  // 2. The trumpet cues.
  const order: readonly AutoMovieArchetypeQuadrupedGait.Gait[] = [
    "walk",
    "trot",
    "canter",
    "gallop",
  ];
  const cues: readonly number[] = [4, 9];
  // Each cued gait cruises a third of the way from the gait it leaves' greatest speed to its own, so the cue alone carries it past the change point.
  const cruise: number[] = order.map(
    (gait: AutoMovieArchetypeQuadrupedGait.Gait, k: number): number =>
      k === 0 ? middle(gait) : (2 * top(order[k - 1]!) + top(gait)) / 3,
  );
  const knots: IKnot[] = [knot(0, cruise[0]!)];
  cues.forEach((cue: number, k: number): void => {
    knots.push(knot(cue + REACTION, cruise[k]!));
    knots.push(knot(cue + REACTION + RAMP, cruise[k + 1]!));
  });
  knots.push(knot(15, cruise[2]!));
  const squadron: AutoMovieArchetypeRide.IRide<string, string> = rideQuadruped(
    horse,
    AutoMovieArchetypeCourse.timed("trooper", profile(knots)),
  );
  const changes: AutoMovieArchetypeRide.IRide<
    string,
    string
  >["instants"][number][] = squadron.instants.filter(
    (
      i: AutoMovieArchetypeRide.IRide<string, string>["instants"][number],
    ): boolean => i.label.startsWith("gait:"),
  );
  TestValidator.predicate(
    `each trumpet cue changes the gait up within the reaction, the ramp and one stride: ${JSON.stringify(changes)}`,
    changes.length === 2 &&
      changes.every(
        (
          change: AutoMovieArchetypeRide.IRide<
            string,
            string
          >["instants"][number],
          k: number,
        ): boolean =>
          change.label.startsWith(`gait:${k === 0 ? "walk" : "trot"}-`) &&
          species.table.order.indexOf(
            change.label.split("-")[1] as AutoMovieArchetypeQuadrupedGait.Gait,
          ) > species.table.order.indexOf(k === 0 ? "walk" : "trot") &&
          change.seconds > cues[k]! &&
          change.seconds <=
            cues[k]! + REACTION + RAMP + stride(order[k]!, cruise[k]!),
      ),
  );

  // 3. A trumpet cue names the gallop, which the speed alone does not call over the canter.
  const charge: number = 4;
  const gallop: number = middle("gallop");
  const charging: AutoMovieArchetypeRide.IRide<string, string> = rideQuadruped(
    horse,
    {
      plan: AutoMovieArchetypeCourse.timed(
        "charger",
        profile([
          knot(0, cruise[1]!),
          knot(charge + REACTION, cruise[1]!),
          knot(charge + REACTION + RAMP, gallop),
          knot(charge + 6, gallop),
        ]),
      ),
      cues: [{ from: charge + REACTION, to: charge + 6, gait: "gallop" }],
    },
  );
  const charged: AutoMovieArchetypeRide.IRide<
    string,
    string
  >["instants"][number][] = charging.instants.filter(
    (
      i: AutoMovieArchetypeRide.IRide<string, string>["instants"][number],
    ): boolean => i.label.startsWith("gait:"),
  );
  TestValidator.predicate(
    `the charge cue changes the trot to the gallop within the reaction, the ramp and one stride: ${JSON.stringify(charged)}`,
    charged.length === 1 &&
      charged[0]!.label === "gait:trot-gallop" &&
      charged[0]!.seconds > charge &&
      charged[0]!.seconds <=
        charge + REACTION + RAMP + stride("trot", cruise[1]!),
  );
}

/**
 * Straight samples along +Z of a speed linear between knots of (second, metres
 * per second), every `STEP`.
 */
function profile(knots: readonly IKnot[]): AutoMovieArchetypeCourse.ISample[] {
  const samples: AutoMovieArchetypeCourse.ISample[] = [];
  let z: number = 0;
  for (let k: number = 0; k + 1 < knots.length; ++k) {
    const t0: number = knots[k]!.seconds;
    const v0: number = knots[k]!.speed;
    const t1: number = knots[k + 1]!.seconds;
    const v1: number = knots[k + 1]!.speed;
    const count: number = Math.max(1, Math.round((t1 - t0) / STEP));
    for (let i: number = k === 0 ? 0 : 1; i <= count; ++i) {
      const t: number = t0 + ((t1 - t0) * i) / count;
      const u: number = (t - t0) / (t1 - t0);
      const along: number = v0 * (t - t0) + ((v1 - v0) * (t - t0) * u) / 2;
      samples.push({ seconds: t, x: 0, y: 0, z: z + along });
    }
    z += ((v0 + v1) / 2) * (t1 - t0);
  }
  return samples;
}

/** A knot of a speed profile. */
interface IKnot {
  /** The film second. */
  seconds: number;

  /** The speed there, metres per second. */
  speed: number;
}

/** A knot at a second and speed. */
function knot(seconds: number, speed: number): IKnot {
  return { seconds, speed };
}
