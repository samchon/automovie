import { AutoMovieEngineVector3 } from "@automovie/engine";

import type { AutoMovieArchetype } from "../core";
import { ClubBuild } from "../weapons/internal/ClubBuild";
import type { AutoMovieArchetypeClub } from "../weapons/AutoMovieArchetypeClub";

/** Canonical producer and authoring contract for BaseballBat. */
export namespace AutoMovieArchetypeBaseballBat {
  /**
   * A wooden baseball bat with its own grip and barrel contact.
   *
   * The model stands along +Y on its knob. The strike contact faces +Z on the
   * barrel.
   *
   * @param params The identifier, measured bat profile, and any free diameters
   *   set within their bands.
   * @param seed The seed selects an unspecified profile and draws free
   *   dimensions. Without a seed, it uses the first profile and band midpoints.
   * @returns The model with its named contacts in its local frame.
   * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
   *   cannot be realized.
   */
  export function create(
    params: AutoMovieArchetypeBaseballBat.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeBaseballBat.Affordance,
    AutoMovieArchetypeBaseballBat.Dimension
  > {
    const { builder, d }: ReturnType<typeof ClubBuild.draw> = ClubBuild.draw(
      "bat",
      params,
      seed,
      "baseball bat",
      "wood",
    );
    const length: number = d.length!;
    const thick: number = d.diameter! / 2;

    const wood: string = "#c9a36b";
    const rod = (id: string, radius: number, from: number, to: number): void => {
      builder.rod(
        id,
        radius,
        AutoMovieEngineVector3.create(0, from, 0),
        AutoMovieEngineVector3.create(0, to, 0),
        {
          color: wood,
        },
      );
    };

    const slim: number = d.handleDiameter! / 2;
    const handle: number = 0.3 * length;
    const barrel: number = length - ClubBuild.BARREL;
    const step: number = (barrel - handle) / 3;
    rod("knob", ClubBuild.KNOB / 2, 0, ClubBuild.KNOB_LENGTH);
    rod("handle", slim, ClubBuild.KNOB_LENGTH, handle);
    for (let k: number = 0; k < 3; k++)
      rod(
        `taper-${k + 1}`,
        slim + ((thick - slim) * (k + 1)) / 4,
        handle + k * step,
        handle + (k + 1) * step,
      );
    rod("barrel", thick, barrel, length);

    // The grasp begins at the top of the knob and ends before the first taper step.
    const span: number = Math.min(
      ClubBuild.HANDS,
      handle - ClubBuild.KNOB_LENGTH,
    );
    const middle: number = ClubBuild.KNOB_LENGTH + span / 2;
    ClubBuild.contacts(builder, length, thick, slim, middle, span, "two-hand");
    return builder.build(d.mass!);
  }
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "handleDiameter" | "length" | "mass";

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "grip" | "strike";

  /** The recorded baseball bat profiles. */
  export type Model = "s154" | "s155" | "t153" | "t156";

  /** The identifier, recorded model choice and adjustable dimensions. */
  export interface IParams extends Pick<
    AutoMovieArchetypeClub.IParams,
    "id" | "diameter" | "handleDiameter"
  > {
    /**
     * A recorded profile. Omission uses the seed or the first profile without a
     * seed.
     */
    model?: Model;
  }
}
