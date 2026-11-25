import { Vector3 } from "@automovie/engine";

import type { AutoMovieArchetype } from "../core";
import { ClubBuild } from "./ClubBuild";
import type { createClub } from "./createClub";

/**
 * An inert straight practice baton for film staging.
 *
 * The digital prop stands on its butt along +Y. The saved grip and contact
 * frames remain available to existing takes.
 *
 * @param params The identifier, existing display profile and any free
 *   dimensions set within their bands.
 * @param seed The seed selects an unspecified profile and draws free
 *   dimensions. Without a seed, it uses the first profile and band midpoints.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
 *   cannot be realized.
 */
export function createPracticeBaton(
  params: createPracticeBaton.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createPracticeBaton.Affordance,
  createPracticeBaton.Dimension
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
    Vector3.create(0, 0, 0),
    Vector3.create(0, length, 0),
    { color: "#2c2f33" },
  );
  ClubBuild.contacts(builder, length, thick, thick, 0.08, 0.12, "power");
  return builder.build(d.mass!);
}

/** The authored parameters and contact names for {@link createPracticeBaton}. */
export namespace createPracticeBaton {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "length" | "mass";

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "grip" | "strike";

  /** The recorded digital prop profiles. */
  export type Model = "mp24" | "mp26";

  /** The identifier, recorded model choice and adjustable dimensions. */
  export interface IParams extends Pick<
    createClub.IParams,
    "id" | "diameter" | "mass"
  > {
    /**
     * A recorded profile. Omission uses the seed or the first profile without a
     * seed.
     */
    model?: Model;
  }
}
