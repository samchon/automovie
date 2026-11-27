import type { AutoMovieArchetypeSpectacles } from "../AutoMovieArchetypeSpectacles";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { WornPropDraw } from "./WornPropDraw";

/**
 * Spectacles with a bridge hold and a nose socket.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createSpectacles(
  params: Pick<
    WornPropDraw.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSpectacles.Affordance, AutoMovieArchetypeSpectacles.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof WornPropDraw.prepare<AutoMovieArchetypeSpectacles.Affordance>> =
    WornPropDraw.prepare<AutoMovieArchetypeSpectacles.Affordance>(
      "spectacles",
      params,
      seed,
    );
  const v: typeof Vector3.create = Vector3.create;
  const thin: number = WornPropDraw.THIN;

  // The front standing on its lenses' bottom edge, the temples back from its ends.
  builder.box("front", v(d.width, d.height, thin), v(0, d.height / 2, 0), {
    color: "#1d1f22",
  });
  for (const [id, sign] of [
    ["leftTemple", 1],
    ["rightTemple", -1],
  ] as const)
    builder.rod(
      id,
      thin / 2,
      v((sign * (d.width - thin)) / 2, d.height * 0.7, -thin / 2),
      v((sign * (d.width - thin)) / 2, d.height * 0.7, -d.depth),
      { color: "#1d1f22" },
    );
  builder.affordance({
    id: "hold",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.height / 2, 0),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "precision",
    aperture: thin,
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.height * 0.4, -thin / 2),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}
