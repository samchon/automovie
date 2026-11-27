import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core";

/*
 * A scenic wooden drumstick along +Y, with its butt at the origin. The overall
 * length and shaft diameter follow the Vic Firth American Classic 5A
 * (https://vicfirth.com/products/american-classicr-5a-doubleglaze-double-coat-of-lacquer-finish).
 * The shoulder, spherical bead, grip placement and 50 g mass are scenic
 * estimates. `face` is the bead's tangent point on +Z. The grip frame is offset
 * by the same amount, so the line to the face follows the stick and the shaft
 * clears the head when the bead lands.
 * Parameter params: The model id, supplied as an option or as a positional string.
 * Returns: A rigid wooden stick with `grip` and `face` contacts.
 */
export function createDrumstick(
  params: { id?: string } | string = {},
): AutoMovieArchetype<"grip" | "face", never> {
  const v: typeof Vector3.create = Vector3.create;
  const length: number = 0.4064;
  const shaftRadius: number = 0.014351 / 2;
  const beadRadius: number = 0.009;
  const bead: number = length - beadRadius;
  const shoulder: number = 0.8 * length;
  const color: string = "#c58b54";
  const builder: AutoMovieArchetypeBuilder<"grip" | "face", never> =
    new AutoMovieArchetypeBuilder({
      id: typeof params === "string" ? params : params.id,
      name: "drumstick",
      material: "wood",
      draw: new AutoMovieArchetypeDrawSession<never>(
        "drumstick",
        {},
        undefined,
      ),
    });
  builder.rod("shaft", shaftRadius, v(0, 0, 0), v(0, shoulder, 0), { color });
  builder.rod("neck", shaftRadius * 0.55, v(0, shoulder, 0), v(0, bead, 0), {
    color,
  });
  builder.ball("bead", beadRadius, v(0, bead, 0), { color });
  builder.affordance({
    id: "grip",
    kind: "handle",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0.105, beadRadius),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * shaftRadius,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, bead, beadRadius),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
  });
  return builder.build(0.05);
}
