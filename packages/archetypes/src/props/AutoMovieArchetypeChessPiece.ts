import { type AutoMovieArchetype } from "../core/index";
import { createChessPiece as createChessPieceImplementation } from "./internal/createChessPiece";

/** Public operations for Auto Movie Archetype Chess Piece. */
export namespace AutoMovieArchetypeChessPiece {
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
  export function create(params: AutoMovieArchetypeChessPiece.IParams): AutoMovieArchetype<AutoMovieArchetypeChessPiece.Affordance, AutoMovieArchetypeChessPiece.Dimension> {
    return createChessPieceImplementation(params);
  }

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
  }}
