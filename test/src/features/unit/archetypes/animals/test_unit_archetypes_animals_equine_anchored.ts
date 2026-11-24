import {
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeQuadrupedBody,
  type AutoMovieArchetypeQuadrupedGait,
  type AutoMovieArchetypeRide,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
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

/** One gait and its constant speed. */
interface ICase {
  /** The gait. */
  gait: AutoMovieArchetypeQuadrupedGait.Gait;

  /** Metres per second. */
  speed: number;
}

/** The largest difference allowed between the two tracks' displayed points, metres: coordinate roundoff of two frame conversions. */
const SAME: number = 1e-6;

/**
 * A straight course world-anchored, as a lean or a lameness anchors it, is the same ride as the one-dimensional track: its footholds sit at fixed offsets in the body frame, so the displayed trunk and hooves must not change.
 *
 * Scenarios:
 * 1. A 1.65 m horse walks at 1.5 m/s and trots at 3.9 m/s on a straight constant-speed course, once plain and once with a zero lean, which world-anchors its hooves; over two seconds of strides every 20 ms the trunk's and each hoof's displayed world points agree within coordinate roundoff.
 *
 * Whether a hoof leaves and meets the ground at rest is the reach unit's to check: both tracks still swing the hoof at the body's speed at its ends, since a hoof at rest there lags a body its limbs cannot yet follow.
 */
export function test_unit_archetypes_animals_equine_anchored(): void {
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
      ...AutoMovieArchetypeQuadrupedBody.LIMBS.map(
        (limb: AutoMovieArchetypeQuadrupedBody.Limb): string =>
          AutoMovieArchetypeQuadrupedBody.BONES[limb][3],
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
  const sample: AutoMovieArchetypeRide.ISample<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = ride.at(at);
  const part: IAutoMovieModelPart = sample.archetype.parts.find(
    (each: IAutoMovieModelPart): boolean => each.id === id,
  )!;
  return AutoMovieArchetypeFrame.point(
    sample.placement,
    part.transform!.translation,
  );
}

/** The componentwise difference of two points. */
function difference(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): [number, number, number] {
  return [a.x - b.x, a.y - b.y, a.z - b.z];
}
