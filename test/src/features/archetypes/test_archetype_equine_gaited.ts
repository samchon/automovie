import {
  type AutoMovieArchetypeEquineGaitedProfile,
  type AutoMovieArchetypeQuadrupedGait,
  AutoMovieArchetypeRefusal,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeHorseRide } from "../internal/archetypeHorseRide";

type Ride = ReturnType<typeof rideHorse>;

/** One ambling breed, its gait, the speed it is ridden at and the lateral advanced placement its source reports. */
interface ICase {
  /** The breed. */
  breed: AutoMovieArchetypeEquineGaitedProfile.Breed;
  /** Its gait. */
  gait: AutoMovieArchetypeQuadrupedGait.Gait;
  /** Metres per second, inside the source's speed range. */
  speed: number;
  /** The hind's landing ahead of its own side's fore, as a share of the stride. */
  lateral: number;
}

/**
 * Each ambling breed takes its own four-beat stepping gait: its footfalls land in the source's lateral sequence and placement, some hoof is always on the ground, and a horse without the breed refuses the gait.
 *
 * Scenarios:
 * 1. A 1.52 m horse of each breed goes at its gait at a speed inside the source's range: every left fore lands its source's lateral advanced placement after the left hind, within 0.01 of a stride.
 * 2. Over two strides, sampled every 10 ms, at least one hoof stands on its planted height: no suspension.
 * 3. An ordinary horse asked for the rack refuses with an AutoMovieArchetypeRefusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the breeds, the placement, the support and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public ride's footfall instants and displayed hoof heights.
 * @evidence contracts/development/testing.md#independent-expectations The placements are the chapter's (IntechOpen 83285): running walk 0.222, rack 0.212, fox trot 0.384, paso llano 0.231, and the fox trot's for the paso corto; none of the gaits has a suspension.
 * @evidence contracts/development/testing.md#distinguishing-cases Five breeds, lateral and diagonal couplets, and a horse without the capability.
 * @evidence contracts/development/testing.md#execution-ownership A memory-only archetype unit on the public horse ride.
 */
export function test_archetype_equine_gaited(): void {
  const cases: readonly ICase[] = [
    { breed: "walking", gait: "runningWalk", speed: 3.5, lateral: 0.222 },
    { breed: "racking", gait: "rack", speed: 5, lateral: 0.212 },
    { breed: "foxTrotter", gait: "foxTrot", speed: 3.3, lateral: 0.384 },
    { breed: "peruvian", gait: "pasoLlano", speed: 3.2, lateral: 0.231 },
    { breed: "pasoFino", gait: "pasoCorto", speed: 3.3, lateral: 0.384 },
  ];
  const issues: string[] = [];
  for (const { breed, gait, speed, lateral } of cases) {
    const horse = createHorse({ breed, withersHeight: 1.52, tempo: 0 }, 1);
    const ride: Ride = rideHorse(
      horse,
      {
        start: { x: 0, z: 0, heading: 0 },
        cruise: speed,
        startSpeed: speed,
        endSpeed: speed,
        legs: [{ kind: "straight", length: speed * 5 }],
      },
      gait,
    );
    const fore: number[] = archetypeHorseRide.footfalls(ride, "leftFore");
    const hind: number[] = archetypeHorseRide.footfalls(ride, "leftHind");
    for (let k: number = 1; k + 1 < fore.length; k++) {
      const stride: number = fore[k + 1]! - fore[k]!;
      const before: number = Math.max(
        ...hind.filter((at: number): boolean => at <= fore[k]!),
      );
      const placement: number = (fore[k]! - before) / stride;
      if (!(Math.abs(placement - lateral) <= 0.01))
        issues.push(
          `${gait}: lateral placement ${placement}, expected ${lateral}`,
        );
    }
    const from: number = fore[1]!;
    const to: number = fore[3]!;
    const planted: number[] = (
      ["leftFore", "rightFore", "leftHind", "rightHind"] as const
    ).map((limb): number => {
      let low: number = Infinity;
      for (let at: number = from; at <= to; at += 0.01)
        low = Math.min(low, archetypeHorseRide.hoof(ride, limb, at).y);
      return low;
    });
    for (let at: number = from; at <= to; at += 0.01) {
      const down: number = (
        ["leftFore", "rightFore", "leftHind", "rightHind"] as const
      ).filter(
        (limb, k: number): boolean =>
          archetypeHorseRide.hoof(ride, limb, at).y <= planted[k]! + 0.001,
      ).length;
      if (down === 0) {
        issues.push(`${gait}: no hoof on the ground at ${at.toFixed(2)} s`);
        break;
      }
    }
  }
  let refusal: unknown;
  try {
    rideHorse(
      createHorse({ withersHeight: 1.52, tempo: 0 }, 1),
      {
        start: { x: 0, z: 0, heading: 0 },
        cruise: 5,
        startSpeed: 5,
        endSpeed: 5,
        legs: [{ kind: "straight", length: 25 }],
      },
      "rack",
    );
  } catch (error) {
    refusal = error;
  }
  if (!(refusal instanceof AutoMovieArchetypeRefusal))
    issues.push(`an ordinary horse asked to rack raises ${String(refusal)}`);
  TestValidator.equals("ambling gaits", issues, []);
}
