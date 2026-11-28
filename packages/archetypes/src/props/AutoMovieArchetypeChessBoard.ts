import { type AutoMovieArchetype } from "../core/index";
import { createChessBoard as createChessBoardImplementation } from "./internal/createChessBoard";

/**
 * Constructs a wooden chessboard with a printable top and named square sockets.
 */
export namespace AutoMovieArchetypeChessBoard {
  /**
   * Build a 0.48 metre square wooden board with its lower centre at the origin.
   *
   * Its 0.055 metre squares run from `a` to `h` along `+X` and rank `1`
   * to `8` along `+Z`. The upright square sockets and `top` surface
   * are at Y 0.015 metres. Scene graphics can print on the plain slab.
   *
   * @param params Optional scene ID, defaulting to `chessBoard`.
   * @returns The fixed board with 64 placement sockets and the material-owned top.
   */
  export function create(params?: AutoMovieArchetypeChessBoard.IParams): AutoMovieArchetype<AutoMovieArchetypeChessBoard.Affordance, AutoMovieArchetypeChessBoard.Dimension> {
    return createChessBoardImplementation(params);
  }

  /** Column coordinate `a` through `h` in order of increasing model X. */
  export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";

  /** Row coordinate `1` through `8` in order of increasing model Z. */
  export type Rank = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

  /** Square ID formed by its file then rank, such as `e4`. */
  export type Square = `${File}${Rank}`;

  /**
   * Printable `top` on the wooden slab and 64 named piece placement sockets.
   */
  export type Affordance = "top" | Square;

  /**
   * Square side and whole board side in metres, and board mass in kilograms.
   */
  export type Dimension = "square" | "side" | "mass";

  /** Optional scene ID for the fixed-size board. */
  export interface IParams {
    /** Scene object ID, defaulting to `chessBoard`. */
    id?: string;
  }

  /** Record of square size, uniform border, slab thickness and mass. */
  export interface IBoard {
    /** Fixed 0.055 metre side length of each square. */
    square: number;

    /** Estimated border outside the eight squares, 0.02 metres on each side. */
    border: number;

    /** Estimated 0.015 metre slab thickness and playing surface height. */
    thickness: number;

    /** Estimated whole-board mass, 1.2 kilograms. */
    mass: number;
  }}
