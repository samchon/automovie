import type { AutoMovieArchetypeSignPost } from "../AutoMovieArchetypeSignPost";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { StreetFixtureDraw } from "./StreetFixtureDraw";

/*
 * An upright square post carrying a STOP sign blank above its grip span.
 *
 * The sign faces +Z, and its measured lower edge bounds the upright post
 * contact. The lowest point of the fixture stands on Y = 0. The blank is the
 * R1-1 regular octagon, its across-flats size the model's. `face` is a surface
 * on the blank's front, read with model `+Y` up, whose width and depth are the
 * across-flats size and whose outline is the octagon, so graphics placed in the
 * square's four corners are clipped at the blank's edge. The legend is not
 * drawn here; a production letters it on `face` with its own font.
 * Parameter params: The scene identifier, model choice and supported dimension
 * overrides.
 * Parameter seed: The seed for the draws the author leaves open.
 * Returns: The fixed model with its typed contacts.
 * If a supplied override lies outside the
 * selected profile.
 */
export function createSignPost(
  params: AutoMovieArchetypeSignPost.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSignPost.Affordance, AutoMovieArchetypeSignPost.Dimension> {
  const { builder, d }: StreetFixtureDraw.IFixture<AutoMovieArchetypeSignPost.Affordance> =
    StreetFixtureDraw.begin("signPost", "sign post", "composite", params, seed);
  const v: typeof Vector3.create = Vector3.create;
  const bottom: number = d.height!;
  const size: number = d.head!;
  const side: number = d.diameter!;
  builder.box(
    "post",
    v(side, bottom + size, side),
    v(0, (bottom + size) / 2, 0),
    {
      color: "#9aa1a8",
    },
  );
  // The R1-1 blank is a regular octagon with flats at its top, bottom and
  // sides: its corners lie at 22.5° + k·45° on the circumradius
  // size / (2 cos 22.5°), so the across-flats size is `size`.
  const centre: IAutoMovieVector3 = v(
    0,
    bottom + size / 2,
    side / 2 + BLANK_THICKNESS / 2,
  );
  const radius: number = size / (2 * Math.cos(Math.PI / 8));
  builder.convex(
    "sign",
    [-1, 1].flatMap((face: number): IAutoMovieVector3[] =>
      Array.from(
        { length: 8 },
        (_: unknown, k: number): IAutoMovieVector3 =>
          v(
            radius * Math.cos(Math.PI / 8 + (k * Math.PI) / 4),
            radius * Math.sin(Math.PI / 8 + (k * Math.PI) / 4),
            (face * BLANK_THICKNESS) / 2,
          ),
      ),
    ),
    centre,
    { color: "#c8102e" },
  );
  builder.affordance({
    id: "face",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, centre.y, centre.z + BLANK_THICKNESS / 2),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width: size,
    depth: size,
    // The blank's octagon in the face's own XZ plane, so graphics stop at
    // its cut corners.
    outline: Array.from(
      { length: 8 },
      (_: unknown, k: number): IAutoMovieVector3 =>
        v(
          radius * Math.cos(Math.PI / 8 + (k * Math.PI) / 4),
          0,
          radius * Math.sin(Math.PI / 8 + (k * Math.PI) / 4),
        ),
    ),
  });
  builder.affordance({
    id: "post",
    kind: "bar",
    symmetry: "half",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, bottom / 2, 0),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: side,
    length: bottom,
  });
  return builder.build(d.mass!);
}

/*
 * The estimated thickness of the sign blank, metres.
 */
const BLANK_THICKNESS: number = 0.003;
