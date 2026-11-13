import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import { type IHumanBody, createHumanBody } from "@automovie/motions";

import { PLAYGROUND_BODIES } from "../data/PLAYGROUND_BODIES";

/**
 * The prepared bodies of the playground: each person of `PLAYGROUND_BODIES`
 * as the canonical body `@automovie/human` builds and the body
 * `@automovie/motions` performs with.
 *
 * Preparing a body takes about two seconds, so each is prepared once, when a
 * composition first names it, and kept for the life of the page.
 */
export namespace PlaygroundBodies {
  /** One prepared body. */
  export interface IPrepared {
    /** The canonical body, which the polygon man is drawn from. */
    canonical: AutoMovieHumanCanonicalBody.IBody;

    /** The body a performance is planned on. */
    body: IHumanBody;
  }

  const prepared: Map<string, IPrepared> = new Map();

  /**
   * The prepared body of an id.
   *
   * @param id A key of `PLAYGROUND_BODIES`.
   * @returns The body.
   * @throws {Error} When no body has that id, naming the ones that exist.
   */
  export function get(id: string): IPrepared {
    const known: IPrepared | undefined = prepared.get(id);
    if (known !== undefined) return known;

    const entry: PLAYGROUND_BODIES.IEntry | undefined = PLAYGROUND_BODIES[id];
    if (entry === undefined)
      throw new Error(
        `No body is named ${id}; the playground has ${Object.keys(PLAYGROUND_BODIES).join(", ")}`,
      );

    const canonical: AutoMovieHumanCanonicalBody.IBody =
      AutoMovieHumanCanonicalBody.prepare(entry.parameters, {
        mass: entry.mass,
        id,
      });
    const made: IPrepared = {
      canonical,
      body: createHumanBody(canonical.skeleton, canonical.profile),
    };
    prepared.set(id, made);
    return made;
  }
}
