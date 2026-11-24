import {
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeQuadrupedBody,
  type AutoMovieArchetypeRide,
  createDog,
  rideQuadruped,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Actual canine prototypes retain their declared faster cycles and planted feet.
 *
 * Scenarios:
 * 1. All three coarse Husky cohorts run the shared ride at the Akita trial's
 *    trot 2.69 m/s and gallop 4.34 m/s, with common fore cycles 0.57/0.45 s.
 * 2. Every actual lower-bar endpoint stays planted within 1 mm during its own
 *    declared fore/hind support interval under nonzero translation and yaw.
 * 3. Actual left/right-lead footfall instants retain synchronized trot diagonals
 *    and the explicitly provisional transverse gallop phase construction.
 *
 * These are transfer/prototype checks. The source did not measure Husky gait,
 * stride SD, complete gallop phases, anatomical ROM or the borrowed lift shape.
 */
export function test_unit_archetypes_core_ride_dog_fast(): void {
  const findings: string[] = [];
  const cases: readonly (readonly [
    "trot" | "gallop",
    number,
    number,
    number,
    number,
  ])[] = [
    ["trot", 2.69, 0.57, 0.23, 0.21],
    ["gallop", 4.34, 0.45, 0.14, 0.16],
  ];
  for (const cohort of ["pet", "show", "sled"] as const)
    for (const [gait, speed, cycle, foreStance, hindStance] of cases)
      for (const lead of ["left", "right"] as const) {
        const ride: AutoMovieArchetypeRide.IRide<
          createDog.Affordance,
          AutoMovieArchetypeQuadrupedBody.Dimension
        > = rideQuadruped(
          createDog(
            {
              mass: 22,
              cohort,
              tempo: 0,
              collar: {
                width: 0.02,
                thickness: 0.003,
                leadLength: 0.6,
                leadRadius: 0.004,
              },
            },
            43,
          ),
          {
            start: { x: 2, z: -3, heading: 29 },
            legs: [{ kind: "straight", length: 20, lead }],
            cruise: speed,
            startSpeed: speed,
            endSpeed: speed,
          },
          gait,
        );
        const left: readonly { seconds: number; label: string }[] =
          ride.instants.filter(
            (instant: { seconds: number; label: string }): boolean =>
              instant.label === "leftForeOn" && instant.seconds > 0.5,
          );
        if (
          left.length < 2 ||
          Math.abs(left[1]!.seconds - left[0]!.seconds - cycle) > 1e-9
        )
          findings.push(`${cohort}/${gait}/${lead}: actual cycle changed`);
        const zero: number = left[0]!.seconds;
        const sample: ReturnType<typeof ride.at> = ride.at(zero);
        const rope: IAutoMovieModelPart = sample.archetype.parts.find(
          (part: IAutoMovieModelPart): boolean => part.id === "lead",
        )!;
        const axis: IAutoMovieVector3 = Quaternion.rotateVector(
          rope.transform!.rotation,
          { x: 0, y: 1, z: 0 },
        );
        if (Math.hypot(axis.x - 1, axis.y, axis.z) > 1e-9)
          findings.push(
            `${cohort}/${gait}/${lead}: the actual outward lead axis changed to ${JSON.stringify(axis)}`,
          );
        const expected: Readonly<
          Record<AutoMovieArchetypeQuadrupedBody.Limb, number>
        > =
          gait === "trot"
            ? { leftFore: 0, rightFore: 0.5, leftHind: 0.5, rightHind: 0 }
            : lead === "left"
              ? { leftFore: 0, rightFore: 0.8, leftHind: 0.6, rightHind: 0.3 }
              : { leftFore: 0, rightFore: 0.2, leftHind: 0.5, rightHind: 0.8 };
        for (const limb of [
          "leftFore",
          "rightFore",
          "leftHind",
          "rightHind",
        ] as const) {
          const landing: { seconds: number; label: string } | undefined =
            ride.instants.find(
              (instant: { seconds: number; label: string }): boolean =>
                instant.label === `${limb}On` && instant.seconds >= zero - 1e-9,
            );
          if (landing === undefined) {
            findings.push(`${cohort}/${gait}: missing ${limb} landing`);
            continue;
          }
          if (
            Math.abs((landing.seconds - zero) / cycle - expected[limb]) > 1e-8
          )
            findings.push(`${cohort}/${gait}/${lead}: ${limb} phase changed`);
          const duration: number = limb.endsWith("Fore")
            ? foreStance
            : hindStance;
          const first: IAutoMovieVector3 = foot(
            ride,
            limb,
            landing.seconds + duration * 0.2,
          );
          const last: IAutoMovieVector3 = foot(
            ride,
            limb,
            landing.seconds + duration * 0.8,
          );
          if (Vector3.length(Vector3.subtract(first, last)) > 0.001)
            findings.push(
              `${cohort}/${gait}/${lead}: ${limb} slipped during its support`,
            );
        }
      }
  TestValidator.equals(
    "faster dog prototypes and physical support windows",
    findings,
    [],
  );
}

/** Observe the actual lower-bar joint through model and course transforms. */
function foot(
  ride: AutoMovieArchetypeRide.IRide<
    createDog.Affordance,
    AutoMovieArchetypeQuadrupedBody.Dimension
  >,
  limb: AutoMovieArchetypeQuadrupedBody.Limb,
  seconds: number,
): IAutoMovieVector3 {
  const sample: ReturnType<typeof ride.at> = ride.at(seconds);
  const part: IAutoMovieModelPart = sample.archetype.parts.find(
    (candidate: IAutoMovieModelPart): boolean =>
      candidate.id === `${limb}Pastern`,
  )!;
  if (
    part.geometry.type !== "primitive" ||
    (part.geometry.shape.type !== "capsule" &&
      part.geometry.shape.type !== "cylinder")
  )
    throw new Error(
      "The real prototype must retain a primitive lower control bar",
    );
  const point: IAutoMovieVector3 = Vector3.add(
    part.transform!.translation,
    Quaternion.rotateVector(part.transform!.rotation, {
      x: 0,
      y: part.geometry.shape.height / 2,
      z: 0,
    }),
  );
  return AutoMovieArchetypeFrame.point(sample.placement, point);
}
