import {
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeQuadrupedLameness,
  AutoMovieArchetypeRefusal,
  createHorse,
  rideHorse,
  type rideQuadruped,
} from "@automovie/archetypes";
import type { IAutoMovieModelPart } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

type Ride = ReturnType<typeof rideHorse>;

/** One lameness take and the asymmetry it must show. */
interface ICase {
  /** What is checked. */
  label: string;
  /** The authored lameness, if any. */
  lameness?: AutoMovieArchetypeQuadrupedLameness.ILameness;
  /** The part whose height is read: the head or the pelvis (hindquarters). */
  part: string;
  /** The left minus right difference of that part's lowest height over each side's half-stride, metres. */
  expected: number;
}

/** Rhodin et al. 2018's detection thresholds, metres: head 6 mm, pelvis 3 mm; mild is their double. */
const HEAD: number = 0.006;
const PELVIS: number = 0.003;

/** The trot speed of Rhodin et al. 2018's trials, metres per second. */
const SPEED: number = 3.9;

/** The asymmetry bound, metres: sampling every 5 ms of a head moving at most about 0.2 m/s near its lowest point. */
const RESOLUTION: number = 0.001;

/**
 * A lame horse's head and pelvis move asymmetrically between the left and right stances as Rhodin et al. 2018 measured, mirrored between sides, and a sound horse stays symmetric.
 *
 * Scenarios:
 * 1. A mild left and right forelimb lameness: the head's lowest height over the lame fore's half-stride is higher by twice the 6 mm threshold, with the sign following the side.
 * 2. A mild left hindlimb lameness: the pelvis drops 6 mm less over the lame hind's half-stride; with compensation the head also mimics an ipsilateral forelimb lameness by the 6 mm threshold.
 * 3. A sound horse shows no asymmetry of either.
 * 4. A canter is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the cases, the source values and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed head and hindquarters heights of actual trotting rides over each fore's and hind's half-stride from its published landing.
 * @evidence contracts/development/testing.md#independent-expectations The expected differences are Rhodin et al.'s thresholds and the declared grade multiple; the 1 mm bound is the 5 ms sampling's resolution.
 * @evidence contracts/development/testing.md#distinguishing-cases Left and right, fore and hind, compensation, sound and a refused gait.
 * @evidence contracts/development/testing.md#execution-ownership A memory-only archetype unit on the public horse ride.
 */
export function test_archetype_equine_lameness(): void {
  const horse: ReturnType<typeof createHorse> = createHorse({
    withersHeight: 1.65,
    tempo: 0,
  });
  const cases: readonly ICase[] = [
    {
      label: "left fore",
      lameness: { limb: "leftFore", grade: "mild" },
      part: "head",
      expected: 2 * HEAD,
    },
    {
      label: "right fore",
      lameness: { limb: "rightFore", grade: "mild" },
      part: "head",
      expected: -2 * HEAD,
    },
    {
      label: "left hind",
      lameness: { limb: "leftHind", grade: "mild" },
      part: "hindquarters",
      expected: 2 * PELVIS,
    },
    {
      label: "left hind compensation",
      lameness: { limb: "leftHind", grade: "mild", compensation: true },
      part: "head",
      expected: HEAD,
    },
    { label: "sound head", part: "head", expected: 0 },
    { label: "sound pelvis", part: "hindquarters", expected: 0 },
  ];
  const issues: string[] = [];
  for (const { label, lameness, part, expected } of cases) {
    const ride: Ride = trot(lameness);
    const side = (limb: string): number => lowest(ride, part, limb);
    const lame: string = part === "head" ? "Fore" : "Hind";
    const difference: number = side(`left${lame}`) - side(`right${lame}`);
    if (!(Math.abs(difference - expected) <= RESOLUTION))
      issues.push(
        `${label}: difference ${difference} m, expected ${expected} m`,
      );
  }
  for (const [label, build] of [
    ["canter", (): Ride => trot({ limb: "leftFore", grade: "mild" }, "canter")],
  ] as const) {
    let refusal: unknown;
    try {
      build();
    } catch (error) {
      refusal = error;
    }
    if (
      !(
        refusal instanceof AutoMovieArchetypeRefusal &&
        refusal.axis === "lameness"
      )
    )
      issues.push(`${label} is not refused`);
  }
  TestValidator.equals("lameness asymmetry", issues, []);

  /** A straight constant-speed ride. */
  function trot(
    lameness: AutoMovieArchetypeQuadrupedLameness.ILameness | undefined,
    gait: "trot" | "canter" = "trot",
  ): Ride {
    const speed: number = gait === "trot" ? SPEED : 6;
    const course: rideQuadruped.ICourse = {
      start: { x: 0, z: 0, heading: 0 },
      cruise: speed,
      startSpeed: speed,
      endSpeed: speed,
      legs: [{ kind: "straight", length: speed * 5, gait }],
      ...(lameness === undefined ? {} : { lameness }),
    };
    return rideHorse(horse, course);
  }
}

/** The mean over strides of a part's lowest world height in the half-stride after each landing of a limb. */
function lowest(ride: Ride, id: string, limb: string): number {
  const landings: readonly number[] = ride.instants
    .filter((event): boolean => event.label === `${limb}On`)
    .map((event): number => event.seconds)
    .filter((at: number): boolean => at > 1 && at < ride.duration - 1);
  let total: number = 0;
  for (let i: number = 0; i + 1 < landings.length; i++) {
    const half: number = (landings[i + 1]! - landings[i]!) / 2;
    let low: number = Infinity;
    for (
      let at: number = landings[i]!;
      at <= landings[i]! + half;
      at += 0.005
    ) {
      const sample: ReturnType<Ride["at"]> = ride.at(at);
      const part: IAutoMovieModelPart = sample.archetype.parts.find(
        (p: IAutoMovieModelPart): boolean => p.id === id,
      )!;
      low = Math.min(
        low,
        AutoMovieArchetypeFrame.point(
          sample.placement,
          part.transform!.translation,
        ).y,
      );
    }
    total += low;
  }
  return total / (landings.length - 1);
}
