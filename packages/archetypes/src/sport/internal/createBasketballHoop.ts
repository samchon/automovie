import type { AutoMovieArchetypeBasketballHoop } from "../AutoMovieArchetypeBasketballHoop";
import type { AutoMovieArchetype } from "../../core/index";
import { GoalBuild } from "../GoalBuild";
import { buildBasketballHoop } from "../buildBasketballHoop";


/**
 * A basketball hoop with a rim bar and backboard surface.
 *
 * The backboard faces +Z at the goal plane and the rim projects toward the
 * court. Mount the board on a wall or stand in the scene.
 *
 * @param params The optional identifier and dimensions fixed within their
 *   recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a
 *   seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
 *   cannot be realized.
 */
export function createBasketballHoop(
  params: AutoMovieArchetypeBasketballHoop.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeBasketballHoop.Affordance,
  AutoMovieArchetypeBasketballHoop.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<typeof GoalBuild.draw<AutoMovieArchetypeBasketballHoop.Affordance>> =
    GoalBuild.draw("basketballHoop", params, seed);
  buildBasketballHoop(builder, d);
  return builder.build(d.mass!);
}
