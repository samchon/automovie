import {
  createCamel,
  createDeer,
  createDog,
  createDonkey,
  createHorse,
  createMule,
  createOx,
  createPony,
  rideQuadruped,
} from "../animals";
import type { AutoMovieArchetype } from "../core";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * The eight canonical coarse quadrupeds and the missing smaller-equid walks.
 *
 * @returns A named eight-kind panel and pony/donkey/mule walk consumers.
 * @evidence contracts/development/common.md#meaningful-documentation Names all eight producers, explicit non-equid reference/mass choices and the authored1.2m/s flying-start inspection course. No new biological gait, ROM or visual result is claimed.
 * @evidence contracts/development/implementation.md#principled-implementation Public producers build the same parts used by production consumers. Static members retain their neutral sources; each smaller-equid ride uses its registered species table and passes the original animal to independent geometry marks.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build one named canonical animal per kind, expose their panel and add three missing real ride subjects through the shared subject adapter.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No renamed horse, substitute mesh, Humanoid motion, renderer-only pose or measured-speed assertion supplies an animal. Mass inputs remain the existing explicitly authored gallery choices.
 * @evidence contracts/development/implementation.md#efficient-algorithms Eight bounded primitive models and three existing bounded phase plans are prepared once; current samples use their ride owner.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The panel and moving members share the same immutable animals; drawing, marks and placement remain with the common instrument.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The catalogue owns its plain models/plans. This helper opens no process, viewer, renderer or file and retains no completed sample cache.
 */
export function archetypeCaptureQuadrupeds(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const animals: Record<string, AutoMovieArchetype> = {
    horse: createHorse({ tack: "both" }),
    pony: createPony({ tack: "both" }),
    donkey: createDonkey({ tack: "both" }),
    mule: createMule({ tack: "both" }),
    dog: createDog({ ...createDog.REFERENCE, cohort: "pet", tempo: 0 }),
    ox: createOx(createOx.REFERENCE),
    camel: createCamel(createCamel.REFERENCE),
    deer: createDeer(createDeer.REFERENCE),
  };
  const entries: Record<string, archetypeCaptureCatalog.ISubject> = {
    "canonical-quadrupeds": archetypeCaptureSubject.still(animals),
  };
  for (const name of ["pony", "donkey", "mule"] as const) {
    const animal: AutoMovieArchetype = animals[name]!;
    entries[`ride-${name}-walk`] = archetypeCaptureSubject.moving(
      name,
      rideQuadruped(
        animal,
        {
          start: { x: 0, z: 0, heading: 0 },
          legs: [{ kind: "straight", length: 8 }],
          cruise: 1.2,
          startSpeed: 1.2,
          endSpeed: 1.2,
        },
        "walk",
      ),
      animal,
    );
  }
  return entries;
}
