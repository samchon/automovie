import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanFootArc; runtime evaluation remains
 * in Human.
 */
export namespace IAutoMovieHumanFootArc {
  /** A junction's jet in a section's plane. */
  export interface IJet {
    /** Place, `[across, up]` mm. */
    point: AutoMovieVector2Tuple;

    /** Unit tangent in the sense the ring runs. */
    tangent: AutoMovieVector2Tuple;

    /** Curvature toward the inside, 1/mm. */
    curvature: number;
  }

  /**
   * A body section's piece: its name and the two junctions it runs between, in
   * ring order.
   */
  export interface IPiece<Junction extends string> {
    /** The piece's name. */
    name: string;

    /** The junction it leaves. */
    from: Junction;

    /** The junction it reaches. */
    to: Junction;
  }

  /** A junction of a body section, at its guide. */
  export type BodyJunction =
    | "crest"
    | "lateral"
    | "contactLateral"
    | "contactMedial"
    | "medial";

  /**
   * A junction of a toe's section: the dorsal, lateral side, plantar and medial
   * side points.
   */
  export type ToeJunction = "dorsal" | "lateral" | "plantar" | "medial";
}
