import { type AutoMovieArchetype } from "../core/index";
import { createChessPiece as createChessPieceImplementation } from "./internal/createChessPiece";

/** Constructs an upright chess piece with a base socket and precision pinch. */
export namespace AutoMovieArchetypeChessPiece {
  /**
   * Build a wooden chess piece standing on its base at Y zero.
   *
   * Each kind uses the fixed profile at its recorded height. Side selects
   * a pale or dark finish for the same sized piece. Set `base` on a board
   * square and grasp `grip` near the head.
   *
   * @param params Required piece kind, optional side and scene ID. The
   *   defaults are `white` and `chessPiece`.
   * @returns The scaled piece with its upward pinch and base socket.
   * @throws {AutoMovieArchetypeRefusal} If the kind or side is inadmissible.
   */
  export function create(params: AutoMovieArchetypeChessPiece.IParams): AutoMovieArchetype<AutoMovieArchetypeChessPiece.Affordance, AutoMovieArchetypeChessPiece.Dimension> {
    return createChessPieceImplementation(params);
  }

  /** Selects the king, queen, bishop, knight, rook or pawn size. */
  export type Kind = "king" | "queen" | "bishop" | "knight" | "rook" | "pawn";

  /** The six admitted piece kinds in descending model height. */
  export const KINDS: readonly Kind[] = [
    "king",
    "queen",
    "bishop",
    "knight",
    "rook",
    "pawn",
  ];

  /** Selects the light `white` or dark `black` render finish. */
  export type Side = "white" | "black";

  /** The two accepted side labels, with `white` as the default. */
  export const SIDES: readonly Side[] = ["white", "black"];

  /** Upper precision `grip` and upright `base` at the bottom centre. */
  export type Affordance = "grip" | "base";

  /**
   * Piece height and base diameter in metres, and estimated mass in kilograms.
   */
  export type Dimension = "height" | "base" | "mass";

  /** Required piece kind and optional render side and scene ID. */
  export interface IParams {
    /** Selects one of six fixed piece heights. */
    kind: Kind;

    /**
     * Tints the same piece geometry for `white` or `black`. Defaults to `white`.
     */
    side?: Side;

    /** Scene object ID, defaulting to `chessPiece`. */
    id?: string;
  }}
