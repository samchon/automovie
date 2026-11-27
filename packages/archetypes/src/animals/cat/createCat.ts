import type { AutoMovieArchetypeCat } from "../AutoMovieArchetypeCat";
import type { AutoMovieArchetype } from "../../core/index";
import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { CatBody } from "./CatBody";
import { createCohortQuadruped } from "../quadruped/createCohortQuadruped";

/*
 * Build one bare adult domestic-cat prototype for ordinary walking shots.
 *
 * The shared body and limb geometry carry the ground contacts through the
 * quadruped ride. The rig's circular solids and two coarse pinna plates are
 * construction proxies, with mass allocated by the shared volume rule.
 * Parameter params: Optional model identity, bare mass in kilograms and timing
 * coordinate.
 * Parameter seed: Draws timing when it was omitted. The shape is fixed.
 * Returns: The independent untacked quadruped model.
 * For unsupported mass or timing values.
 */
export function createCat(
  params: AutoMovieArchetypeCat.IParams = {},
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
