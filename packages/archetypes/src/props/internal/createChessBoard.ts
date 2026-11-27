import type { AutoMovieArchetypeChessBoard } from "../AutoMovieArchetypeChessBoard";
import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core/index";

/**
 * A chessboard lying flat with a socket on every named square.
 *
 * The board lies in the `XZ` plane, its origin the centre of its underside. The
 * files `a` to `h` run along `+X` and the ranks `1` to `8` along `+Z`, so White
 * sits at `-Z`. Each square's socket is at the centre of its face, upright,
 * where a piece's `base` is set; `top` is the board's playing surface.
 *
 * @param params The optional scene id.
 * @returns The inert board and its contact frames, metres.
 */
export function createChessBoard(
  params: AutoMovieArchetypeChessBoard.IParams = {},
): AutoMovieArchetype<AutoMovieArchetypeChessBoard.Affordance, AutoMovieArchetypeChessBoard.Dimension> {
  const v: typeof Vector3.create = Vector3.create;
  const side: number = 8 * BOARD.square + 2 * BOARD.border;
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeChessBoard.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "chessBoard",
      { square: "m", side: "m", mass: "kg" },
      undefined,
    );
  draw.derive("square", BOARD.square);
  draw.derive("side", side);
  draw.derive("mass", BOARD.mass);
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeChessBoard.Affordance,
    AutoMovieArchetypeChessBoard.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id ?? "chessBoard",
    name: "chessboard",
    material: "wood",
    draw,
  });
  builder.box(
    "board",
    v(side, BOARD.thickness, side),
    v(0, BOARD.thickness / 2, 0),
    { color: "#b58b5a" },
  );
  builder.affordance({
    id: "top",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.upright(v(0, BOARD.thickness, 0)),
    extent: null,
  });
  FILES.forEach((file: AutoMovieArchetypeChessBoard.File, i: number): void =>
    RANKS.forEach((rank: AutoMovieArchetypeChessBoard.Rank, j: number): void => {
      builder.affordance({
        id: `${file}${rank}`,
        kind: "socket",
        frame: AutoMovieArchetypeFrame.upright(
          v(
            (i - 3.5) * BOARD.square,
            BOARD.thickness,
            (j - 3.5) * BOARD.square,
          ),
        ),
        extent: null,
      });
    }),
  );
  return builder.build(BOARD.mass);
}

/**
 * FIDE's Standards of Chess Equipment, section 3.3: "The side of the square
 * should measure 5-6 cm. Four pawns should fit on one square"
 * (handbook.fide.com, version effective until 28 February 2026, read
 * 2026-11-21). The board's border, thickness and mass are not read, so they are
 * provisional estimates.
 */
const BOARD: Readonly<AutoMovieArchetypeChessBoard.IBoard> = {
  square: 0.055,
  border: 0.02,
  thickness: 0.015,
  mass: 1.2,
};

/** The files from White's left, along `+X`. */
const FILES: readonly AutoMovieArchetypeChessBoard.File[] = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
];

/** The ranks from White's side, along `+Z`. */
const RANKS: readonly AutoMovieArchetypeChessBoard.Rank[] = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
];
