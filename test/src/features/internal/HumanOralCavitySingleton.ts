import { Singleton } from "tstl";

import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import { AutoMovieHumanOralCavity } from "../../../../packages/human/src/generation/AutoMovieHumanOralCavity";
import { HumanPeople } from "./HumanPeople";

/**
 * The oral cavity of a generated person, built once and shared.
 *
 * Counting the teeth a viewer would see needs the cavity's parts, and building
 * them regenerates the body surface and the mouth interior. A person never
 * changes within a run, so one `Singleton` per person name builds it once,
 * and every later call reads the result or the fact that it cannot be built.
 */
export namespace HumanOralCavitySingleton {
  /** The cavity built for a person, or the reason it cannot be built. */
  export interface IOutcome {
    /** Cavity parts; undefined when the person has no mouth or the interior cannot be built. */
    interior: AutoMovieHumanOralCavity.IOutput | undefined;
  }

  /**
   * The oral cavity of a person.
   *
   * @param name Person's name in the test table.
   */
  export function get(name: string): IOutcome {
    let found: Singleton<IOutcome, []> | undefined = cache.get(name);

    if (found === undefined) {
      found = new Singleton((): IOutcome => build(name));
      cache.set(name, found);
    }
    return found.get();
  }

  /** Build the cavity of a person from the generation's own body surface. */
  function build(name: string): IOutcome {
    const person: HumanPeople.IRigged = HumanPeople.rigged(name);
    const mouth: typeof person.body.mouth = person.body.mouth;
    const aperture: (typeof person.body.apertures)[number] | undefined = person.body.apertures.find(
      (a: (typeof person.body.apertures)[number]): boolean => a.name === "mouth",
    );
    if (mouth === undefined || aperture === undefined) return { interior: undefined };

    const surface: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate(person.body, []);

    try {
      return { interior: AutoMovieHumanOralCavity.generate(surface.mesh, mouth, aperture, 1) };
    } catch {
      // A mouth whose interior cannot be built shows nothing to count; the
      // teeth row then fails as unmeasured instead of hiding the others.
      return { interior: undefined };
    }
  }

  /** Singletons by person name. */
  const cache: Map<string, Singleton<IOutcome, []>> = new Map();
}
