import {
  ArchetypeFrame,
  type ArchetypeRide,
  QuadrupedBody,
  type QuadrupedGait,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** A horse ride. */
type Ride = ArchetypeRide.IRide<createHorse.Affordance, createHorse.Dimension>;

/** One gait and its constant speed. */
interface ICase {
  /** The gait. */
  gait: QuadrupedGait.Gait;

  /** Metres per second. */
  speed: number;
}

/** How far a hoof may move horizontally within 10 ms of leaving the ground, metres: at rest there, a quintic start moves it well under a millimetre. */
const REST: number = 0.001;

/** The largest difference allowed between the two tracks' displayed points, metres: coordinate roundoff of two frame conversions. */
const SAME: number = 1e-6;

/**
 * A straight course world-anchored, as a lean or a lameness anchors it, is the same ride as the one-dimensional track: its footholds sit at fixed offsets in the body frame, so the displayed trunk and hooves must not change.
 *
 * Scenarios:
 * 1. A 1.65 m horse walks at 1.5 m/s and trots at 3.9 m/s on a straight constant-speed course, once plain and once with a zero lean, which world-anchors its hooves; over two seconds of strides every 20 ms the trunk's and each hoof's displayed world points agree within coordinate roundoff.
 * 2. On both tracks every hoof leaves the ground at rest: within 10 ms of each liftoff it moves under a millimetre. Touchdown is not checked: where the landing foothold lies beyond the limb's reach until the body arrives, the hoof follows the limb onto it (the known limit of the limbs' forward reach, the walk carriage's shortfall).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the horse, gaits, anchoring and the quantities compared.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed parts of actual public rides.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the plain ride itself; the bound is the roundoff of two frame conversions.
 * @evidence contracts/development/testing.md#distinguishing-cases Walk and trot, stance and swing within each stride.
 * @evidence contracts/development/testing.md#execution-ownership A memory-only archetype unit on the public horse ride.
 */
export function test_archetype_equine_anchored(): void {
  const horse: ReturnType<typeof createHorse> = createHorse({
    withersHeight: 1.65,
    tempo: 0,
  });
  const cases: readonly ICase[] = [
    { gait: "walk", speed: 1.5 },
    { gait: "trot", speed: 3.9 },
  ];
  const issues: string[] = [];
  for (const { gait, speed } of cases) {
    const ride = (anchored: boolean): Ride =>
      rideHorse(horse, {
        start: { x: 0, z: 0, heading: 0 },
        cruise: speed,
        startSpeed: speed,
        endSpeed: speed,
        legs: [{ kind: "straight", length: speed * 5, gait }],
        ...(anchored ? { lean: (): number => 0 } : {}),
      });
    const plain: Ride = ride(false);
    const anchored: Ride = ride(true);
    const ids: readonly string[] = [
      "trunk",
      ...QuadrupedBody.LIMBS.map(
        (limb: QuadrupedBody.Limb): string => QuadrupedBody.BONES[limb][3],
      ),
    ];
    let worst: number = 0;
    let where: string = "";
    for (let at: number = 1.5; at <= 3.5; at += 0.02)
      for (const id of ids) {
        const gap: number = Math.hypot(
          ...difference(point(plain, id, at), point(anchored, id, at)),
        );
        if (gap > worst) [worst, where] = [gap, `${id} at ${at.toFixed(2)} s`];
      }
    // A hoof leaves the ground at rest in the world: over the 10 ms after each liftoff it moves no more than `REST`.
    for (const [name, ridden] of [
      ["plain", plain],
      ["anchored", anchored],
    ] as const)
      for (const instant of ridden.instants)
        for (const limb of QuadrupedBody.LIMBS) {
          if (instant.label !== `${limb}Off`) continue;
          if (instant.seconds < 1 || instant.seconds > ridden.duration - 1)
            continue;
          const id: string = QuadrupedBody.BONES[limb][3];
          const a: IAutoMovieVector3 = point(ridden, id, instant.seconds);
          const b: IAutoMovieVector3 = point(
            ridden,
            id,
            instant.seconds + 0.01,
          );
          const moved: number = Math.hypot(a.x - b.x, a.z - b.z);
          if (!(moved <= REST))
            issues.push(
              `${gait} ${name}: ${limb} moves ${moved} m within 10 ms of its liftoff at ${instant.seconds} s`,
            );
        }
    if (!(worst <= SAME))
      issues.push(
        `${gait}: the anchored ride departs by ${worst} m (${where})`,
      );
  }
  TestValidator.equals(
    "an anchored straight course is the same ride",
    issues,
    [],
  );
}

/** A part's displayed world origin. */
function point(ride: Ride, id: string, at: number): IAutoMovieVector3 {
  const sample: ArchetypeRide.ISample<
    createHorse.Affordance,
    createHorse.Dimension
  > = ride.at(at);
  const part: IAutoMovieModelPart = sample.archetype.parts.find(
    (each: IAutoMovieModelPart): boolean => each.id === id,
  )!;
  return ArchetypeFrame.point(sample.placement, part.transform!.translation);
}

/** The componentwise difference of two points. */
function difference(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): [number, number, number] {
  return [a.x - b.x, a.y - b.y, a.z - b.z];
}
