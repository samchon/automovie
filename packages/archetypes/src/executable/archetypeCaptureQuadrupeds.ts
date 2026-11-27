import { rideQuadruped, AutoMovieArchetypeCamel, AutoMovieArchetypeDeer, AutoMovieArchetypeDog, AutoMovieArchetypeMule, AutoMovieArchetypePony, AutoMovieArchetypeDonkey, AutoMovieArchetypeHorse, AutoMovieArchetypeOx } from "../animals";
import type { AutoMovieArchetype } from "../core";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * The eight canonical coarse quadrupeds and the missing smaller-equid walks.
 *
 * @returns A named eight-kind panel and pony/donkey/mule walk consumers.
 */
export function archetypeCaptureQuadrupeds(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const animals: Record<string, AutoMovieArchetype> = {
    horse: AutoMovieArchetypeHorse.create({ tack: "both" }),
    pony: AutoMovieArchetypePony.create({ tack: "both" }),
    donkey: AutoMovieArchetypeDonkey.create({ tack: "both" }),
    mule: AutoMovieArchetypeMule.create({ tack: "both" }),
    dog: AutoMovieArchetypeDog.create({ ...AutoMovieArchetypeDog.REFERENCE, cohort: "pet", tempo: 0 }),
    ox: AutoMovieArchetypeOx.create(AutoMovieArchetypeOx.REFERENCE),
    camel: AutoMovieArchetypeCamel.create(AutoMovieArchetypeCamel.REFERENCE),
    deer: AutoMovieArchetypeDeer.create(AutoMovieArchetypeDeer.REFERENCE),
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
