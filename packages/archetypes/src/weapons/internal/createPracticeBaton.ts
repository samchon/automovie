import type { AutoMovieArchetypePracticeBaton } from "../AutoMovieArchetypePracticeBaton";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import type { AutoMovieArchetype } from "../../core/index";
import { ClubBuild } from "./ClubBuild";


/*
 * An inert straight practice baton for film staging.
 *
 * The digital prop stands on its butt along +Y. The saved grip and contact
 * frames remain available to existing takes.
 * Parameter params: The identifier, existing display profile and any free
 * dimensions set within their bands.
 * Parameter seed: The seed selects an unspecified profile and draws free
 * dimensions. Without a seed, it uses the first profile and band midpoints.
 * Returns: The model with its named contacts in its local frame.
 * When a supplied dimension or choice
 * cannot be realized.
 */
export function createPracticeBaton(
  params: AutoMovieArchetypePracticeBaton.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypePracticeBaton.Affordance,
  AutoMovieArchetypePracticeBaton.Dimension
> {
  const { builder, d }: ReturnType<typeof ClubBuild.draw> = ClubBuild.draw(
    "baton",
    params,
    seed,
    "baton",
    "plastic",
  );
  const length: number = d.length!;
  const thick: number = d.diameter! / 2;

  builder.rod(
    "shaft",
    thick,
    AutoMovieEngineVector3.create(0, 0, 0),
    AutoMovieEngineVector3.create(0, length, 0),
    { color: "#2c2f33" },
  );
  ClubBuild.contacts(builder, length, thick, thick, 0.08, 0.12, "power");
  return builder.build(d.mass!);
}
