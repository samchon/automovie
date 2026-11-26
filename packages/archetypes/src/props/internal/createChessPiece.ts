import { AutoMovieArchetypeChessPiece } from "../AutoMovieArchetypeChessPiece";
import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core/index";

/**
 * FIDE's Standards of Chess Equipment, section 2.3: "King – 9.5 cm", "Queen –
 * 8.5 cm", "Bishop – 7 cm", "Knight – 6 cm", "Rook – 5.5 cm", "Pawn – 5 cm";
 * section 2.4: "The diameter of a piece's base should measure 40-50% of its
 * height" (handbook.fide.com, version effective until 28 February 2026, read
 * 2026-11-21). The base is taken at 45 percent. The profile's proportions and
 * the weighted mass are provisional estimates.
 */
const HEIGHTS: Readonly<Record<AutoMovieArchetypeChessPiece.Kind, number>> = {
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
  params: AutoMovieArchetypeChessPiece.IParams,
): AutoMovieArchetype<AutoMovieArchetypeChessPiece.Affordance, AutoMovieArchetypeChessPiece.Dimension> {
  const kind: AutoMovieArchetypeChessPiece.Kind = ArchetypeDraw.choice(
    "chessPiece",
    "kind",
    params.kind,
    AutoMovieArchetypeChessPiece.KINDS,
  );
  const side: AutoMovieArchetypeChessPiece.Side = ArchetypeDraw.choice(
    "chessPiece",
    "side",
    params.side ?? "white",
    AutoMovieArchetypeChessPiece.SIDES,
  );
  const v: typeof Vector3.create = Vector3.create;
  const height: number = HEIGHTS[kind];
  const base: number = BASE * height;
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeChessPiece.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "chessPiece",
      { height: "m", base: "m", mass: "kg" },
      undefined,
    );
  draw.derive("height", height);
  draw.derive("base", base);
  draw.derive("mass", MASS_PER_HEIGHT * height);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeChessPiece.Affordance,
    AutoMovieArchetypeChessPiece.Dimension
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
