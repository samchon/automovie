import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";

/**
 * FIDE's Standards of Chess Equipment, section 2.3: "King – 9.5 cm", "Queen –
 * 8.5 cm", "Bishop – 7 cm", "Knight – 6 cm", "Rook – 5.5 cm", "Pawn – 5 cm";
 * section 2.4: "The diameter of a piece's base should measure 40-50% of its
 * height" (handbook.fide.com, version effective until 28 February 2026, read
 * 2026-11-21). The base is taken at 45 percent. The profile's proportions and
 * the weighted mass are provisional estimates.
 */
const HEIGHTS: Readonly<Record<createChessPiece.Kind, number>> = {
  king: 0.095,
  queen: 0.085,
  bishop: 0.07,
  knight: 0.06,
  rook: 0.055,
  pawn: 0.05,
};

/**
 * A piece's base diameter as a share of its height, within FIDE's 40 to 50
 * percent.
 */
const BASE: number = 0.45;

/**
 * A weighted piece's mass per metre of height, kilograms: a provisional
 * estimate.
 */
const MASS_PER_HEIGHT: number = 0.5;

/**
 * One chess piece standing on its base.
 *
 * The piece stands along `+Y` from the centre of its base at the origin. Its
 * `base` socket is that origin, set on a board square's socket to place it; its
 * `grip` is a precision pinch at the head, where a player takes a piece, as
 * FIDE's laws have a move made with one hand.
 *
 * @param params The piece's kind, side and optional scene id.
 * @returns The inert piece and its contact frames, metres.
 * @throws {AutoMovieArchetypeRefusal} For a kind or side outside the set.
 */
export function createChessPiece(
  params: createChessPiece.IParams,
): AutoMovieArchetype<createChessPiece.Affordance, createChessPiece.Dimension> {
  const kind: createChessPiece.Kind = ArchetypeDraw.choice(
    "chessPiece",
    "kind",
    params.kind,
    createChessPiece.KINDS,
  );
  const side: createChessPiece.Side = ArchetypeDraw.choice(
    "chessPiece",
    "side",
    params.side ?? "white",
    createChessPiece.SIDES,
  );
  const v: typeof Vector3.create = Vector3.create;
  const height: number = HEIGHTS[kind];
  const base: number = BASE * height;
  const draw: AutoMovieArchetypeDrawSession<createChessPiece.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "chessPiece",
      { height: "m", base: "m", mass: "kg" },
      undefined,
    );
  draw.derive("height", height);
  draw.derive("base", base);
  draw.derive("mass", MASS_PER_HEIGHT * height);
  const builder: AutoMovieArchetypeBuilder<
    createChessPiece.Affordance,
    createChessPiece.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? "chessPiece",
    name: `${side} ${kind}`,
    material: "wood",
    draw,
  });
  const color: string = side === "white" ? "#efe4cf" : "#2b2622";
  builder.rod("base", base / 2, v(0, 0, 0), v(0, 0.15 * height, 0), { color });
  builder.rod("body", base / 4, v(0, 0.15 * height, 0), v(0, 0.8 * height, 0), {
    color,
  });
  builder.ball("head", 0.1 * height, v(0, 0.9 * height, 0), { color });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0.85 * height, 0),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "precision",
    aperture: base / 2,
    length: 0.3 * height,
  });
  builder.affordance({
    id: "base",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
  });
  return builder.build(MASS_PER_HEIGHT * height);
}

/** The inputs, contacts and kinds of {@link createChessPiece}. */
export namespace createChessPiece {
  /** The six kinds of piece. */
  export type Kind = "king" | "queen" | "bishop" | "knight" | "rook" | "pawn";

  /** Every kind, tallest first. */
  export const KINDS: readonly Kind[] = [
    "king",
    "queen",
    "bishop",
    "knight",
    "rook",
    "pawn",
  ];

  /** The two sides. */
  export type Side = "white" | "black";

  /** Both sides. */
  export const SIDES: readonly Side[] = ["white", "black"];

  /** The pinch at the head and the base set on a square. */
  export type Affordance = "grip" | "base";

  /** The height, the base diameter and the mass. */
  export type Dimension = "height" | "base" | "mass";

  /** The kind, the side and the scene id. */
  export interface IParams {
    /** Which piece. */
    kind: Kind;

    /** Whose piece; `white` when absent. */
    side?: Side;

    /** The model's id, unique in a scene; `chessPiece` when absent. */
    id?: string;
  }
}
