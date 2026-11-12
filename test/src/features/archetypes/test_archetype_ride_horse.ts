import {
  ArchetypeCourse,
  ArchetypeFrame,
  ArchetypeRefusal,
  HorseGait,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMoviePrimitiveShape,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";

/** The height at the withers of Icelandic horses, metres: 1.38 m, Jensen et al. 2019, Acta Vet Scand 61, Table 2. */
const ICELANDIC: number = 1.38;

/** A millimetre, the most a planted hoof may move along the path. */
const MM: number = 1e-3;

/** A straight course of a length, metres, driven to a cruising speed and back at one rate, metres per second squared. */
function course(
  cruise: number,
  length: number = 40,
  rate: number = 3,
): ArchetypeCourse.ICourse {
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
  limb: createHorse.Limb,
): number[] {
  return ride.instants
    .filter((i: { label: string }): boolean => i.label === `${limb}On`)
    .map((i: { seconds: number }): number => i.seconds);
}

/** The seconds of a hoof's landings while the course holds its cruising speed, a second after reaching it and half a second before braking. */
function landings(
  ride: ReturnType<typeof rideHorse>,
  limb: createHorse.Limb,
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
  const shape: AutoMoviePrimitiveShape | null =
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
  limb: createHorse.Limb,
  seconds: number,
): IAutoMovieVector3 {
  const sample: ReturnType<typeof ride.at> = ride.at(seconds);
  return ArchetypeFrame.point(
    sample.placement,
    ends(sample.archetype, createHorse.BONES[limb][3])[1],
  );
}

/** How many hooves stand still on the ground over the four milliseconds after a second: a planted hoof does not move, and any other travels with or ahead of the body. */
function planted(ride: ReturnType<typeof rideHorse>, seconds: number): number {
  return createHorse.LIMBS.filter(
    (limb: createHorse.Limb): boolean =>
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
 * 5. A planted hoof holds the ground: through the stance of a 1.5 m/s walk and of a 4 m/s trot at steady speed, the left fore and the right hind hoof stay within 10 mm of where they landed and within 10 mm of the ground; no hoof ever goes more than 10 mm below the ground.
 * 6. The limbs stay whole through the stride: at eight phases each bone's lower end meets the next bone's upper end within a tenth of a millimetre.
 * 7. A speed no row of the gait's table covers (a 5 m/s walk) is refused with the measured range.
 * 8. Over a whole 30 m walk that gathers speed from rest at 0.5 m/s squared and brakes to a halt at the same rate, every stance of every hoof holds its place in the world: from just after each landing through four fifths of the least share of a stride a hoof is planted for, the hoof joint moves less than a millimetre along the path. At the steady walk each hoof is more than 10 mm above the ground at the middle of its swing.
 * 9. At a steady gallop every stride has an instant with no hoof still on the ground, the suspension; the steady walk has none.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Rides a produced horse along a straight course and reads the ride's landing instants and the posed model's bone ends in the world; a stride of the wrong period, hooves landing out of order, a planted hoof that slides or sinks while the horse holds, gathers or loses speed, a swinging hoof dragged along the ground, a gallop without suspension, or a limb whose bones come apart is caught.
 * @evidence contracts/development/testing.md#independent-expectations Stride times, their standard deviations and the footfall orders are Robilliard, Pfau and Wilson 2007, J Exp Biol 210:187, Tables 1 to 4, scaled to the produced horse by dynamic similarity at equal Froude number (Alexander and Jayes 1983; Alexander 1984): speeds and times by the square root of its withers height over the 1.38 m of Icelandic horses (Jensen et al. 2019), worked here from the height measured on the model (the 5 m/s canter row reads 0.496 plus or minus 0.024 s; the 0.47 s quoted in #3373 is the gallop's row). The ride is deterministic, so the scaled stride is held to floating tolerance, not to the paper's spread. A planted hoof not moving is what planted means; the millimetre is the ride's own statement that a planted hoof stays where it landed at any speed, and the 10 mm the campaign's contact tolerance (#3358). The least stance share is the duty factor at the fastest speed the walk reaches, since the duty factor falls with speed. A gallop is the gait with a suspension, and a walk never has fewer than two hooves down. Bones meeting at their joints is rigidity.
 * @evidence contracts/development/testing.md#distinguishing-cases Three gaits for order, two for the planted hoof at steady speed, a whole course with both speed ramps for the planted hoof at changing speed, both ends of the trot's speed range for timing, a gait with a suspension against one without; the gallop's hind-to-fore lag and the walk's quarter-stride lag within a side, which the paper does not give as numbers, are the model's stated estimates and are not asserted. The timing's tempo and height refusals belong to `test_archetype_contract_refusal`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the nine scenarios and what each pins.
 */
export function test_archetype_ride_horse(): void {
  const findings: string[] = [];
  const steady: ReturnType<typeof createHorse> = createHorse({ tempo: 0 }, 5);
  const withers: number = archetypeExtent(steady, "y", ["withers"]).high;

  // 1. The rows as measured, at the measured horses' height.
  const rows: readonly (readonly [HorseGait.Gait, number, number])[] = [
    ["walk", 1, 1.121],
    ["trot", 2, 0.649],
    ["trot", 6.5, 0.482],
    ["canter", 5, 0.496],
  ];
  for (const [gait, speed, stride] of rows)
    if (Math.abs(HorseGait.timing(gait, speed).stride - stride) > 1e-9)
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
  const order = (gait: HorseGait.Gait, speed: number): string => {
    const ride: ReturnType<typeof rideHorse> = rideHorse(
      steady,
      course(speed),
      gait,
    );
    const fore: number[] = landings(ride, "leftFore");
    const start: number = fore[1]!;
    const stride: number = fore[2]! - fore[1]!;
    return createHorse.LIMBS.map((limb: createHorse.Limb): [string, number] => [
      limb,
      Math.round(
        ((landings(ride, limb).find(
          (t: number): boolean => t >= start - 1e-6,
        )! -
          start) /
          stride) *
          100,
      ) % 100,
    ])
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
    !(HorseGait.timing("walk", 1).duty > HorseGait.timing("walk", 3).duty) ||
    !(HorseGait.timing("trot", 2).duty > HorseGait.timing("trot", 6.5).duty)
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
    const timing: HorseGait.ITiming = HorseGait.timing(gait, speed);
    for (const limb of ["leftFore", "rightHind"] as const) {
      const on: number = landings(ride, limb)[1]!;
      const landed: IAutoMovieVector3 = hoof(
        ride,
        limb,
        on + 0.02 * timing.stride,
      );
      for (let k: number = 1; k <= 8; k++) {
        const at: IAutoMovieVector3 = hoof(
          ride,
          limb,
          on + (0.02 + (0.9 * k) / 8) * timing.duty * timing.stride,
        );
        if (Math.abs(at.z - landed.z) > 0.01 || Math.abs(at.y) > 0.01)
          findings.push(
            `${gait}: ${limb} hoof moved ${at.z - landed.z} m along and stands ${at.y} m high in stance`,
          );
      }
    }
    const start: number = landings(ride, "leftFore")[1]!;
    for (let k: number = 0; k < 8; k++) {
      const seconds: number = start + (k * timing.stride) / 8;
      const sample: ReturnType<typeof ride.at> = ride.at(seconds);
      for (const limb of createHorse.LIMBS) {
        const chain: readonly string[] = createHorse.BONES[limb];
        if (hoof(ride, limb, seconds).y < -0.01)
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
    !(refused instanceof ArchetypeRefusal) ||
    refused.feasible?.kind !== "range"
  )
    findings.push("a 5 m/s walk is not refused with the gait's range");

  // 8. A whole walk from rest to a halt. The duty factor falls with speed, so the share of a stride every stance lasts at least is the one at the fastest speed reached.
  const walk: ReturnType<typeof rideHorse> = rideHorse(
    steady,
    course(1.5, 30, 0.5),
    "walk",
  );
  const share: number = HorseGait.timing("walk", 1.5, 0, withers).duty;
  for (const limb of createHorse.LIMBS) {
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
    const lifted: number = hoof(
      walk,
      limb,
      level[1]! + (share + (1 - share) / 2) * (level[2]! - level[1]!),
    ).y;
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
