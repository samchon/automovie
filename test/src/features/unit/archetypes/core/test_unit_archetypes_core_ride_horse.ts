import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeQuadrupedGait,
  AutoMovieArchetypeRefusal,
  createHorse,
  createQuadruped,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMoviePrimitiveShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalTerminalSole } from "../../../internal/animalTerminalSole";
import { archetypeExtent } from "../../../internal/archetypeExtent";

/** The horse's species, whose gait table the expectations read. */
const HORSE: createQuadruped.ISpecies = createQuadruped.SPECIES.horse;

/** The height at the withers of Icelandic horses, metres: 1.38 m, Jensen et al. 2019, Acta Vet Scand 61, Table 2. */
const ICELANDIC: number = 1.38;

/** A millimetre, the most a planted hoof may move along the path. */
const MM: number = 1e-3;

/** A straight course of a length, metres, driven to a cruising speed and back at one rate, metres per second squared. */
function course(
  cruise: number,
  length: number = 40,
  rate: number = 3,
): AutoMovieArchetypeCourse.ICourse {
  return {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length }],
    cruise,
    acceleration: rate,
    deceleration: rate,
  };
}

/** The seconds of every landing of a limb's hoof over the whole ride, in time order. */
function footfalls(
  ride: ReturnType<typeof rideHorse>,
  limb: AutoMovieArchetypeQuadrupedBody.Limb,
): number[] {
  return ride.instants
    .filter((i: { label: string }): boolean => i.label === `${limb}On`)
    .map((i: { seconds: number }): number => i.seconds);
}

/** The seconds of a hoof's landings while the course holds its cruising speed, a second after reaching it and half a second before braking. */
function landings(
  ride: ReturnType<typeof rideHorse>,
  limb: AutoMovieArchetypeQuadrupedBody.Limb,
): number[] {
  const cruise: number = ride.plan.instants.find(
    (i: { label: string }): boolean => i.label === "cruise",
  )!.seconds;
  const brake: number = ride.plan.instants.find(
    (i: { label: string }): boolean => i.label === "brake",
  )!.seconds;
  return footfalls(ride, limb).filter(
    (seconds: number): boolean => seconds > cruise + 1 && seconds < brake - 0.5,
  );
}

/** The two ends of a bone's bar in its model, the end nearer the trunk first: the bar's centre less and plus half its length along its own axis, which runs down the limb. */
function ends(
  horse: ReturnType<typeof createHorse>,
  bone: string,
): [IAutoMovieVector3, IAutoMovieVector3] {
  const part: IAutoMovieModelPart = horse.parts.find(
    (p: IAutoMovieModelPart): boolean => p.id === bone,
  )!;
  const shape: IAutoMoviePrimitiveShape | null =
    part.geometry.type === "primitive" ? part.geometry.shape : null;
  const half: number =
    shape !== null && (shape.type === "cylinder" || shape.type === "capsule")
      ? shape.height / 2
      : 0;
  const along: IAutoMovieVector3 = Quaternion.rotateVector(
    part.transform!.rotation,
    { x: 0, y: half, z: 0 },
  );
  const a: IAutoMovieVector3 = Vector3.subtract(
    part.transform!.translation,
    along,
  );
  const b: IAutoMovieVector3 = Vector3.add(part.transform!.translation, along);
  return [a, b];
}

/** Where a limb's hoof joint, the lower end of its lowest bone, is in the world at a second of a ride. */
function hoof(
  ride: ReturnType<typeof rideHorse>,
  limb: AutoMovieArchetypeQuadrupedBody.Limb,
  seconds: number,
): IAutoMovieVector3 {
  const sample: ReturnType<typeof ride.at> = ride.at(seconds);
  return AutoMovieArchetypeFrame.point(
    sample.placement,
    ends(sample.archetype, AutoMovieArchetypeQuadrupedBody.BONES[limb][3])[1],
  );
}

/** The lowest complete terminal surface, not its elevated distal cap centre. */
function sole(
  ride: ReturnType<typeof rideHorse>,
  limb: AutoMovieArchetypeQuadrupedBody.Limb,
  seconds: number,
): number {
  const sample: ReturnType<typeof ride.at> = ride.at(seconds);
  const part: IAutoMovieModelPart = sample.archetype.parts.find(
    (candidate: IAutoMovieModelPart): boolean =>
      candidate.id === AutoMovieArchetypeQuadrupedBody.BONES[limb][3],
  )!;
  return animalTerminalSole(part, sample.placement);
}

/** How many hooves stand still on the ground over the four milliseconds after a second: a planted hoof does not move, and any other travels with or ahead of the body. */
function planted(ride: ReturnType<typeof rideHorse>, seconds: number): number {
  return AutoMovieArchetypeQuadrupedBody.LIMBS.filter(
    (limb: AutoMovieArchetypeQuadrupedBody.Limb): boolean =>
      Math.abs(
        hoof(ride, limb, seconds + 0.004).z - hoof(ride, limb, seconds).z,
      ) < MM,
  ).length;
}

/**
 * A horse's gaits keep the measured stride timing and footfall order, and its planted hooves hold the ground.
 *
 * Scenarios:
 * 1. At the measured horses' height the timing is the paper's rows: 1.121 s at a 1 m/s walk, 0.649 s at a 2 m/s trot, 0.482 s at a 6.5 m/s trot and 0.496 s at a 5 m/s canter. For the produced horse of tempo 0, whose height is measured at its withers, the stride time read between successive landings of the left fore hoof at each of those speeds times the square root of the height ratio is the row's stride time times that same factor, to a nanosecond.
 * 2. Over 200 seeds, each horse's stride time at its own scaled 4 m/s trot, divided by its factor, stays within one standard deviation (36 ms) of the paper's 0.569 s, and the seeds span more than one standard deviation.
 * 3. Footfall order within a stride: at the walk left fore, right hind, right fore, left hind a quarter of a stride apart, which is the lateral sequence left hind, left fore, right hind, right fore; at the trot the diagonal pairs land together, left fore with right hind; at the left canter right hind, then left hind with right fore, then left fore.
 * 4. Duty factor falls as speed rises in the walk and in the trot.
 * 5. A planted hoof holds the ground: through the stance of a 1.5 m/s walk and of a 4 m/s trot at steady speed, the left fore and the right hind distal joints stay within 10 mm of where they landed and their complete actual terminal soles stay within 10 mm of the ground; no terminal solid ever goes more than 10 mm below the ground. A sloped cylinder's distal cap centre is not its lowest surface.
 * 6. The limbs stay whole through the stride: at eight phases each bone's lower end meets the next bone's upper end within a tenth of a millimetre.
 * 7. A speed no row of the gait's table covers (a 5 m/s walk) is refused with the measured range.
 * 8. Over a whole 30 m walk that gathers speed from rest at 0.5 m/s squared and brakes to a halt at the same rate, every stance of every hoof holds its place in the world: from just after each landing through four fifths of the least share of a stride a hoof is planted for, the hoof joint moves less than a millimetre along the path. At the steady walk each complete terminal solid is more than 10 mm above the ground at the middle of its swing.
 * 9. At a steady gallop every stride has an instant with no hoof still on the ground, the suspension; the steady walk has none.
 */
export function test_unit_archetypes_core_ride_horse(): void {
  const findings: string[] = [];
  const steady: ReturnType<typeof createHorse> = createHorse({ tempo: 0 }, 5);
  const withers: number = archetypeExtent(steady, "y", ["withers"]).high;

  // 1. The rows as measured, at the measured horses' height.
  const rows: readonly (readonly [
    AutoMovieArchetypeQuadrupedGait.Gait,
    number,
    number,
  ])[] = [
    ["walk", 1, 1.121],
    ["trot", 2, 0.649],
    ["trot", 6.5, 0.482],
    ["canter", 5, 0.496],
  ];
  for (const [gait, speed, stride] of rows)
    if (
      Math.abs(
        AutoMovieArchetypeQuadrupedGait.timing(HORSE, gait, speed).stride -
          stride,
      ) > 1e-9
    )
      findings.push(`${gait} at ${speed} m/s is not the paper's ${stride} s`);

  // 1. Stride times of this horse, at the speeds of equal Froude number, scaled by the square root of the height ratio.
  const by: number = Math.sqrt(withers / ICELANDIC);
  for (const [gait, speed, stride] of rows) {
    const on: number[] = landings(
      rideHorse(steady, course(speed * by, 80), gait),
      "leftFore",
    );
    const measured: number = (on[on.length - 1]! - on[0]!) / (on.length - 1);
    if (!(on.length >= 3 && Math.abs(measured - stride * by) <= 1e-9))
      findings.push(
        `${gait} at ${speed * by} m/s strides in ${measured} s over ${on.length} landings, not ${stride * by}`,
      );
  }

  // 2. Seeds stay inside the scaled standard deviation at the trot's 4 m/s row.
  let low: number = Infinity;
  let high: number = -Infinity;
  for (let seed: number = 0; seed < 200; seed++) {
    const horse: ReturnType<typeof createHorse> = createHorse({}, seed);
    const scale: number = Math.sqrt(
      archetypeExtent(horse, "y", ["withers"]).high / ICELANDIC,
    );
    const on: number[] = landings(
      rideHorse(horse, course(4 * scale), "trot"),
      "leftFore",
    );
    const offset: number =
      ((on[on.length - 1]! - on[0]!) / (on.length - 1) / scale - 0.569) / 0.036;
    low = Math.min(low, offset);
    high = Math.max(high, offset);
  }
  if (!(low >= -1.03 && high <= 1.03))
    findings.push(
      `seeded trot strides run ${low} to ${high} standard deviations from the scaled mean`,
    );
  if (high - low < 1) findings.push("seeds do not vary the stride time");

  // 3. Footfall order: each hoof's first landing after a left fore landing, as a share of the stride.
  const order = (
    gait: AutoMovieArchetypeQuadrupedGait.Gait,
    speed: number,
  ): string => {
    const ride: ReturnType<typeof rideHorse> = rideHorse(
      steady,
      course(speed),
      gait,
    );
    const fore: number[] = landings(ride, "leftFore");
    const start: number = fore[1]!;
    const stride: number = fore[2]! - fore[1]!;
    return AutoMovieArchetypeQuadrupedBody.LIMBS.map(
      (limb: AutoMovieArchetypeQuadrupedBody.Limb): [string, number] => [
        limb,
        Math.round(
          ((landings(ride, limb).find(
            (t: number): boolean => t >= start - 1e-6,
          )! -
            start) /
            stride) *
            100,
        ) % 100,
      ],
    )
      .sort((a: [string, number], b: [string, number]): number => a[1] - b[1])
      .map((entry: [string, number]): string => `${entry[0]}@${entry[1]}`)
      .join(" ");
  };
  TestValidator.equals(
    "walk footfalls",
    order("walk", 1.5),
    "leftFore@0 rightHind@25 rightFore@50 leftHind@75",
  );
  TestValidator.equals(
    "trot footfalls",
    order("trot", 4),
    "leftFore@0 rightHind@0 rightFore@50 leftHind@50",
  );
  TestValidator.equals(
    "left canter footfalls",
    order("canter", 5),
    "leftFore@0 rightHind@41 rightFore@73 leftHind@73",
  );

  // 4. Duty factor falls with speed.
  if (
    !(
      AutoMovieArchetypeQuadrupedGait.timing(HORSE, "walk", 1).duty >
      AutoMovieArchetypeQuadrupedGait.timing(HORSE, "walk", 3).duty
    ) ||
    !(
      AutoMovieArchetypeQuadrupedGait.timing(HORSE, "trot", 2).duty >
      AutoMovieArchetypeQuadrupedGait.timing(HORSE, "trot", 6.5).duty
    )
  )
    findings.push("duty factor does not fall with speed");

  // 5 and 6. Planted hooves and whole limbs at steady speed.
  for (const [gait, speed] of [
    ["walk", 1.5],
    ["trot", 4],
  ] as const) {
    const ride: ReturnType<typeof rideHorse> = rideHorse(
      steady,
      course(speed),
      gait,
    );
    const timing: AutoMovieArchetypeQuadrupedGait.ITiming =
      AutoMovieArchetypeQuadrupedGait.timing(HORSE, gait, speed);
    for (const limb of ["leftFore", "rightHind"] as const) {
      const on: number = landings(ride, limb)[1]!;
      const landed: IAutoMovieVector3 = hoof(
        ride,
        limb,
        on + 0.02 * timing.stride,
      );
      for (let k: number = 1; k <= 8; k++) {
        const seconds: number =
          on + (0.02 + (0.9 * k) / 8) * timing.duty * timing.stride;
        const at: IAutoMovieVector3 = hoof(ride, limb, seconds);
        const gap: number = sole(ride, limb, seconds);
        if (Math.abs(at.z - landed.z) > 0.01 || Math.abs(gap) > 0.01)
          findings.push(
            `${gait}: ${limb} hoof moved ${at.z - landed.z} m along and its whole solid stands ${gap} m above ground in stance`,
          );
      }
    }
    const start: number = landings(ride, "leftFore")[1]!;
    for (let k: number = 0; k < 8; k++) {
      const seconds: number = start + (k * timing.stride) / 8;
      const sample: ReturnType<typeof ride.at> = ride.at(seconds);
      for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
        const chain: readonly string[] =
          AutoMovieArchetypeQuadrupedBody.BONES[limb];
        if (sole(ride, limb, seconds) < -0.01)
          findings.push(
            `${gait}: ${limb} hoof under the ground at phase ${k}/8`,
          );
        for (let j: number = 0; j < 3; j++)
          if (
            Vector3.length(
              Vector3.subtract(
                ends(sample.archetype, chain[j]!)[1],
                ends(sample.archetype, chain[j + 1]!)[0],
              ),
            ) > 1e-4
          )
            findings.push(
              `${gait}: ${chain[j]} and ${chain[j + 1]} came apart at phase ${k}/8`,
            );
      }
    }
  }

  // 7. A speed outside the gait's table.
  let refused: unknown;
  try {
    rideHorse(steady, course(5), "walk");
  } catch (error) {
    refused = error;
  }
  if (
    !(refused instanceof AutoMovieArchetypeRefusal) ||
    refused.feasible?.kind !== "range"
  )
    findings.push("a 5 m/s walk is not refused with the gait's range");

  // 8. A whole walk from rest to a halt. The duty factor falls with speed, so the share of a stride every stance lasts at least is the one at the fastest speed reached.
  const walk: ReturnType<typeof rideHorse> = rideHorse(
    steady,
    course(1.5, 30, 0.5),
    "walk",
  );
  const share: number = AutoMovieArchetypeQuadrupedGait.timing(
    HORSE,
    "walk",
    1.5,
    0,
    withers,
  ).duty;
  for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
    const on: number[] = footfalls(walk, limb);
    let worst: number = 0;
    let where: number = 0;
    for (let i: number = 0; i + 1 < on.length; i++) {
      const stance: number = share * (on[i + 1]! - on[i]!);
      const landed: number = hoof(walk, limb, on[i]! + 0.02 * stance).z;
      for (const part of [0.2, 0.4, 0.6, 0.8]) {
        const slid: number = Math.abs(
          hoof(walk, limb, on[i]! + part * stance).z - landed,
        );
        if (slid > worst) {
          worst = slid;
          where = on[i]!;
        }
      }
    }
    if (!(on.length >= 10 && worst < MM))
      findings.push(
        `walk from rest to a halt: the ${limb} hoof slid ${worst} m in the stance landed at ${where} s of ${walk.duration} s, over ${on.length} landings`,
      );

    // Mid-swing at the steady walk: halfway between this stance's lift-off and the next landing.
    const level: number[] = landings(walk, limb);
    const lifted: number = sole(
      walk,
      limb,
      level[1]! + (share + (1 - share) / 2) * (level[2]! - level[1]!),
    );
    if (!(lifted > 0.01))
      findings.push(
        `walk: the ${limb} hoof is ${lifted} m above the ground at the middle of its swing`,
      );
  }

  // 9. Suspension: sampled eighty times a stride, the gallop has an instant with no hoof still, the walk none.
  const airborne = (ride: ReturnType<typeof rideHorse>): number[] => {
    const fore: number[] = landings(ride, "leftFore");
    const counts: number[] = [];
    for (let i: number = 1; i + 1 < fore.length && i <= 3; i++) {
      let free: number = 0;
      for (let k: number = 0; k < 80; k++)
        if (
          planted(ride, fore[i]! + (k / 80) * (fore[i + 1]! - fore[i]!)) === 0
        )
          free++;
      counts.push(free);
    }
    return counts;
  };
  const gallop: number[] = airborne(
    rideHorse(steady, course(6.5, 80), "gallop"),
  );
  if (gallop.length < 3 || gallop.some((free: number): boolean => free === 0))
    findings.push(
      `gallop: instants without a planted hoof per stride, of 80: ${gallop.join(", ")}`,
    );
  const walking: number[] = airborne(walk);
  if (walking.length < 3 || walking.some((free: number): boolean => free > 0))
    findings.push(
      `walk: instants without a planted hoof per stride, of 80: ${walking.join(", ")}`,
    );
  TestValidator.equals("the horse's gaits hold", findings, []);
}
