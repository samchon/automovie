import { createDog, rideQuadruped } from "../animals";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * Inspect the coarse dog rides at their faster experimental point speeds.
 *
 * @returns Trot and transverse-gallop subjects from the canonical pet cohort.
 * @evidence contracts/development/common.md#meaningful-documentation Names the consumer, authored22kg reference/collar and the prototype transfer and phase limits supplied by DogGait.
 * @evidence contracts/development/implementation.md#principled-implementation Each subject samples the real factory/ride at the Akita experiment's2.69/4.34m/s; geometry, root placement, footfalls and contacts come from that ride rather than a renderer-only proxy.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One explicit canonical body and two ride subjects on a straight flying-start course.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The authored mass/tack are presentation inputs, not morphometric measurements. No fake gait, substituted renderer, flattened root placement or patched ride supplies the picture.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two existing ride plans are prepared once; each seek uses the shared sampler and its bounded phase tables.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both subjects share the immutable canonical rest animal and the common capture-subject producer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Subjects retain their model/plans for the catalogue lifetime; no browser, process or renderer is opened here.
 */
export function archetypeCaptureDogGaits(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const dog: ReturnType<typeof createDog> = createDog(
    {
      ...createDog.REFERENCE,
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
      rideQuadruped(
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
