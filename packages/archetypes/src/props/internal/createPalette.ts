import { AutoMovieArchetypePalette } from "../AutoMovieArchetypePalette";
import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core/index";

/*
 * A flat board held by one edge: a painter's palette on the thumb, a piece of
 * cloth pinched at its edge while it is sewn, or a ribbon's length stretched
 * for a ceremonial cut.
 *
 * The board lies in `XZ` centred on the origin, its upper face up. `hold` is
 * where the holding hand takes it: a palette's thumb hole near its `-X` edge, a
 * cloth's `-X` edge between thumb and fingers. `face` is its upper face, the
 * working surface, `width` along `X` and `depth` along `Z` a hand's breadth in
 * from the hold.
 * Parameter params: The kind and the optional scene id.
 * Returns: The board and its contacts, metres.
 * For a kind outside the set.
 */
export function createPalette(
  params: AutoMovieArchetypePalette.IParams,
): AutoMovieArchetype<AutoMovieArchetypePalette.Affordance, AutoMovieArchetypePalette.Dimension> {
  const kind: AutoMovieArchetypePalette.Kind = ArchetypeDraw.choice(
    "palette",
    "kind",
    params.kind,
    AutoMovieArchetypePalette.KINDS,
  );
  const size: AutoMovieArchetypePalette.ISize = SIZES[kind];
  const v: typeof Vector3.create = Vector3.create;
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypePalette.Dimension> =
    new AutoMovieArchetypeDrawSession(
      kind,
      { width: "m", depth: "m", mass: "kg" },
      undefined,
    );
  draw.derive("width", size.width);
  draw.derive("depth", size.depth);
  draw.derive("mass", size.mass);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypePalette.Affordance,
    AutoMovieArchetypePalette.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? kind,
    name: kind,
    material: kind === "palette" ? "wood" : "felt",
    draw,
  });
  builder.box("board", v(size.width, size.thickness, size.depth), v(0, 0, 0), {
    color: kind === "palette" ? "#b8925a" : "#d9d2c3",
  });
  const edge: number = -size.width / 2 + 0.04;
  builder.affordance({
    id: "hold",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(edge, -size.thickness / 2, 0),
      v(0, -1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: size.thickness,
    length: 0.05,
  });
  const span: number = size.width - 0.1;
  builder.affordance({
    id: "face",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(
      v(size.width / 2 - span / 2, size.thickness / 2, 0),
    ),
    extent: null,
    width: span,
    depth: size.depth,
  });
  return builder.build(size.mass);
}

/*
 * An artist's hand palette, a sheet of cloth and a length of ribbon: flat
 * boards held in one hand, or fixed, while the other works on them. No source
 * is read: every figure is a provisional construction estimate.
 */
const SIZES: Readonly<Record<AutoMovieArchetypePalette.Kind, AutoMovieArchetypePalette.ISize>> = {
  palette: { width: 0.4, depth: 0.3, thickness: 0.005, mass: 0.3 },
  cloth: { width: 0.3, depth: 0.2, thickness: 0.001, mass: 0.02 },
  ribbon: { width: 0.4, depth: 0.05, thickness: 0.001, mass: 0.01 },
};
