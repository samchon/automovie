import type { AutoMovieArchetype } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { CatBody } from "./CatBody";
import { createCohortQuadruped } from "./createCohortQuadruped";

/**
 * Build one bare adult domestic-cat prototype for ordinary walking shots.
 *
 * The shared body and limb geometry carry the ground contacts through the
 * quadruped ride. The rig's circular solids and two coarse pinna plates are
 * construction proxies, with mass allocated by the shared volume rule.
 *
 * @param params Optional model identity, bare mass in kilograms and timing
 *   coordinate.
 * @param seed Draws timing when it was omitted. The shape is fixed.
 * @returns The independent untacked quadruped model.
 * @throws {AutoMovieArchetypeRefusal} For unsupported mass or timing values.
 */
export function createCat(
  params: createCat.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createCohortQuadruped.Affordance,
  AutoMovieArchetypeQuadrupedBody.Dimension
> {
  return createCohortQuadruped({
    archetype: "cat",
    name: (): string => "adult domestic cat prototype",
    names: ["adult"],
    choices: ["adult"],
    reference: "adult",
    references: { adult: CatBody.REFERENCE },
    body: CatBody,
    params: { id: params.id, mass: params.mass, tempo: params.tempo },
    seed,
  });
}

/** Authored inputs for the single bare domestic-cat reference. */
export namespace createCat {
  /** Optional independently authored instance data. */
  export interface IParams {
    /** Model id used by ordinary staging and motion APIs. */
    id?: string;

    /**
     * Positive finite bare mass in kilograms. The fixed reference supplies 4.5
     * kg when absent.
     */
    mass?: number;

    /**
     * Stride displacement in standard-deviation units from -1 to 1; seedless
     * defaults to zero.
     */
    tempo?: number;
  }
}
