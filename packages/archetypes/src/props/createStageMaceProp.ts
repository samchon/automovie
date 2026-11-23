import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype } from "../core";
import { StageShaftConstruction } from "./StageShaftConstruction";
import type { createStageWeaponProp } from "./createStageWeaponProp";

/**
 * Padded round-headed stage prop.
 *
 * A display form with a round ornament above a one-hand shaft grip. Its origin
 * is at the shaft base.
 *
 * @param params The scene identity and optional total display height in metres.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createStageMaceProp(
  params: createStageMaceProp.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createStageMaceProp.Affordance,
  createStageMaceProp.Dimension
> {
  return StageShaftConstruction(
    "mace",
    params,
    seed,
    0.8,
    (builder, height) => {
      const v: typeof Vector3.create = Vector3.create;
      const radius: number = 0.115 * height;
      builder.ball("ornament", radius, v(0, height - radius, 0), {
        color: "#968ccc",
      });
    },
  );
}

/** Authoring options for {@link createStageMaceProp}. */
export namespace createStageMaceProp {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "height";

  /**
   * The createStageWeaponProp contact set its shared construction types. This
   * producer builds grip.
   */
  export type Affordance = createStageWeaponProp.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<createStageWeaponProp.IParams, "id" | "height">;
}
