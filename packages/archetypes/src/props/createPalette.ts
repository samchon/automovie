import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";

/**
 * An artist's hand palette, a sheet of cloth and a length of ribbon: flat
 * boards held in one hand, or fixed, while the other works on them. No source
 * is read: every figure is a provisional construction estimate.
 */
const SIZES: Readonly<Record<createPalette.Kind, createPalette.ISize>> = {
  palette: { width: 0.4, depth: 0.3, thickness: 0.005, mass: 0.3 },
  cloth: { width: 0.3, depth: 0.2, thickness: 0.001, mass: 0.02 },
  ribbon: { width: 0.4, depth: 0.05, thickness: 0.001, mass: 0.01 },
};

/**
 * A flat board held by one edge: a painter's palette on the thumb, a piece of
 * cloth pinched at its edge while it is sewn, or a ribbon's length stretched
 * for a ceremonial cut.
 *
 * The board lies in `XZ` centred on the origin, its upper face up. `hold` is
 * where the holding hand takes it: a palette's thumb hole near its `-X` edge, a
 * cloth's `-X` edge between thumb and fingers. `face` is its upper face, the
 * working surface, `width` along `X` and `depth` along `Z` a hand's breadth in
 * from the hold.
 *
 * @param params The kind and the optional scene id.
 * @returns The board and its contacts, metres.
 * @throws {AutoMovieArchetypeRefusal} For a kind outside the set.
 */
export function createPalette(
  params: createPalette.IParams,
): AutoMovieArchetype<createPalette.Affordance, createPalette.Dimension> {
  const kind: createPalette.Kind = ArchetypeDraw.choice(
    "palette",
    "kind",
    params.kind,
    createPalette.KINDS,
  );
  const size: createPalette.ISize = SIZES[kind];
  const v: typeof Vector3.create = Vector3.create;
  const draw: AutoMovieArchetypeDrawSession<createPalette.Dimension> =
    new AutoMovieArchetypeDrawSession(
      kind,
      { width: "m", depth: "m", mass: "kg" },
      undefined,
    );
  draw.derive("width", size.width);
  draw.derive("depth", size.depth);
  draw.derive("mass", size.mass);
  const builder: AutoMovieArchetypeBuilder<
    createPalette.Affordance,
    createPalette.Dimension
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

/** The inputs, contacts and sizes of {@link createPalette}. */
export namespace createPalette {
  /** A painter's palette, a piece of cloth or a ribbon. */
  export type Kind = "palette" | "cloth" | "ribbon";

  /** Both kinds. */
  export const KINDS: readonly Kind[] = ["palette", "cloth", "ribbon"];

  /** The hold and the working face. */
  export type Affordance = "hold" | "face";

  /** The width, the depth and the mass. */
  export type Dimension = "width" | "depth" | "mass";

  /** The kind and the scene id. */
  export interface IParams {
    /** Which board. */
    kind: Kind;

    /** The model's id, unique in a scene; the kind when absent. */
    id?: string;
  }

  /** A board's size, metres and kilograms. */
  export interface ISize {
    /** Along `X`. */
    width: number;

    /** Along `Z`. */
    depth: number;

    /** Along `Y`. */
    thickness: number;

    /** The mass. */
    mass: number;
  }
}
