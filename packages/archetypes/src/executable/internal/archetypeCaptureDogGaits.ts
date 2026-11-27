import { AutoMovieArchetypeQuadruped, AutoMovieArchetypeDog } from "../../animals";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * Inspect the coarse dog rides at their faster experimental point speeds.
 *
 * @returns Trot and transverse-gallop subjects from the canonical pet cohort.
 */
export function archetypeCaptureDogGaits(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const dog: ReturnType<typeof AutoMovieArchetypeDog.create> = AutoMovieArchetypeDog.create(
    {
      ...AutoMovieArchetypeDog.REFERENCE,
      cohort: "pet",
      tempo: 0,
      collar: {
        width: 0.02,
        thickness: 0.003,
        leadLength: 0.6,
        leadRadius: 0.004,
      },
    },
    43,
  );
  const subjects: Record<string, archetypeCaptureCatalog.ISubject> = {};
  for (const [gait, speed] of [
    ["trot", 2.69],
    ["gallop", 4.34],
  ] as const)
    subjects[`ride-dog-${gait}`] = archetypeCaptureSubject.moving(
      "dog",
      AutoMovieArchetypeQuadruped.ride(
        dog,
        {
          start: { x: 0, z: 0, heading: 0 },
          legs: [{ kind: "straight", length: 20 }],
          cruise: speed,
          startSpeed: speed,
          endSpeed: speed,
        },
        gait,
      ),
      dog,
    );
  return subjects;
}
