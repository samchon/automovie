import type { AutoMovieArchetypeLampPost } from "../AutoMovieArchetypeLampPost";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype } from "../../core/index";
import { StreetFixtureDraw } from "./StreetFixtureDraw";

/**
 * A lamp post with a ground base, upright grip and post-top luminaire.
 *
 * The mounting height and base and luminaire dimensions locate the grip on the
 * shaft. The lowest point of the fixture stands on Y = 0.
 *
 * @param params The scene identifier and any dimensions to fix inside their
 *   bands.
 * @param seed The seed for the draws the author leaves open.
 * @returns The fixed model with its typed contacts.
 * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
 *   selected profile.
 */
export function createLampPost(
  params: AutoMovieArchetypeLampPost.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLampPost.Affordance, AutoMovieArchetypeLampPost.Dimension> {
  const { builder, d }: StreetFixtureDraw.IFixture<AutoMovieArchetypeLampPost.Affordance> =
    StreetFixtureDraw.begin("lampPost", "lamp post", "composite", params, seed);
  const v: typeof Vector3.create = Vector3.create;
  const height: number = d.height!;
  const diameter: number = d.diameter!;
  const foot: number = d.baseHeight!;
  const color: string = "#2f3236";
  builder.rod("base", d.base! / 2, v(0, 0, 0), v(0, foot, 0), { color });
  builder.rod("shaft", diameter / 2, v(0, foot, 0), v(0, height, 0), { color });
  builder.rod(
    "luminaire",
    d.head! / 2,
    v(0, height, 0),
    v(0, height + d.headHeight!, 0),
    { color: "#f4f1e0" },
  );
  StreetFixtureDraw.shaft(builder, foot, height, diameter);
  return builder.build(d.mass!);
}
