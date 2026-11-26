import type { AutoMovieArchetypeBollard } from "../AutoMovieArchetypeBollard";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { StreetFixtureDraw } from "../StreetFixtureDraw";

/**
 * A ground-standing steel bollard with a shaft grip and a top surface.
 *
 * The installed height and selected Reliance pipe diameter supply the shaft,
 * its bar and its top support. The lowest point of the fixture stands on Y =
 * 0.
 *
 * @param params The scene identifier, model choice and supported dimension
 *   overrides.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createBollard(
  params: AutoMovieArchetypeBollard.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBollard.Affordance, AutoMovieArchetypeBollard.Dimension> {
  const { builder, d }: StreetFixtureDraw.IFixture<AutoMovieArchetypeBollard.Affordance> =
    StreetFixtureDraw.begin("bollard", "bollard", "steel", params, seed);
  const v: typeof Vector3.create = Vector3.create;
  const height: number = d.height!;
  const diameter: number = d.diameter!;
  builder.rod("shaft", diameter / 2, v(0, 0, 0), v(0, height, 0), {
    color: "#e2b714",
    surface: "steel",
  });
  StreetFixtureDraw.shaft(builder, 0, height, diameter);
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, height, 0)),
    extent: null,
    width: diameter,
    depth: diameter,
  });
  return builder.build(d.mass!, { rests: "steel" });
}
