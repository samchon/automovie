import { type AutoMovieArchetype } from "../core/index";
import { createPalette as createPaletteImplementation } from "./internal/createPalette";

/** Public operations for Auto Movie Archetype Palette. */
export namespace AutoMovieArchetypePalette {
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
  export function create(params: AutoMovieArchetypePalette.IParams): AutoMovieArchetype<AutoMovieArchetypePalette.Affordance, AutoMovieArchetypePalette.Dimension> {
    return createPaletteImplementation(params);
  }

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
  }}
