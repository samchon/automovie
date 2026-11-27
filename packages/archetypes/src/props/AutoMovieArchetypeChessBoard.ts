import { type AutoMovieArchetype } from "../core/index";
import { createChessBoard as createChessBoardImplementation } from "./internal/createChessBoard";

/** Public operations for Auto Movie Archetype Chess Board. */
export namespace AutoMovieArchetypeChessBoard {
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
  export function create(params?: AutoMovieArchetypeChessBoard.IParams): AutoMovieArchetype<AutoMovieArchetypeChessBoard.Affordance, AutoMovieArchetypeChessBoard.Dimension> {
    return createChessBoardImplementation(params);
  }

  /** A file, from White's left. */
  export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";

  /** A rank, from White's side. */
  export type Rank = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

  /** A square's name, its file then its rank, such as `e4`. */
  export type Square = `${File}${Rank}`;

  /** The playing surface and the squares. */
  export type Affordance = "top" | Square;

  /** The square's side, the board's side and its mass. */
  export type Dimension = "square" | "side" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `chessBoard` when absent. */
    id?: string;
  }

  /** The board's size, metres and kilograms. */
  export interface IBoard {
    /** A square's side, within FIDE's 5 to 6 cm. */
    square: number;

    /** The border round the squares, estimated. */
    border: number;

    /** The slab's thickness, estimated. */
    thickness: number;

    /** The board's mass, estimated. */
    mass: number;
  }}
