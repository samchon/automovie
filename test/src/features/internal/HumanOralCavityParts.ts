import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import { AutoMovieHumanOralCavity } from "../../../../packages/human/src/generation/AutoMovieHumanOralCavity";
import { HumanPeople } from "./HumanPeople";

/**
 * The oral cavity of a generated person, built for each call.
 *
 * Counting the teeth a viewer would see needs the cavity's parts, and building
 * them regenerates the body surface and the mouth interior. Each call builds
 * them for the person it names and returns the parts or the fact that they
 * cannot be built.
 */
export namespace HumanOralCavityParts {
  /** The cavity built for a person, or the reason it cannot be built. */
  export interface IOutcome {
    /** Cavity parts; undefined when the person has no mouth or the interior cannot be built. */
    interior: AutoMovieHumanOralCavity.IOutput | undefined;
  }
  /** Build the cavity of a person from the generation's own body surface. */
  export function get(name: string): IOutcome {
    const person: HumanPeople.IRigged = HumanPeople.rigged(name);
    const mouth: typeof person.body.mouth = person.body.mouth;
    const aperture: (typeof person.body.apertures)[number] | undefined = person.body.apertures.find(
      (a: (typeof person.body.apertures)[number]): boolean => a.name === "mouth",
    );
    if (mouth === undefined || aperture === undefined) return { interior: undefined };

    const surface: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate(person.body, []);

    try {
      const rim: [number, number, number][] | undefined = surface.rims.get(aperture.name);
      if (rim === undefined) return { interior: undefined };
      return { interior: AutoMovieHumanOralCavity.generate(rim, mouth, 1) };
    } catch {
      // A mouth whose interior cannot be built shows nothing to count; the
      // teeth row then fails as unmeasured instead of hiding the others.
      return { interior: undefined };
    }
  }

}
