import type { AutoMovieVector2Tuple } from "../../../geometry/AutoMovieVector2Tuple";

/** Type contracts exchanged by AutoMovieHumanFootArc; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootArc {
  /** A junction's jet in a section's plane.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A junction's jet in a section's plane.
   * @evidence contracts/development/design.md#principled-representation `point`: Place, `[across, up]` mm. `tangent`: Unit tangent in the sense the ring runs. `curvature`: Curvature toward the inside, 1/mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanFootArc.pieces, AutoMovieHumanFootArc.quintic. Also types AutoMovieHumanFootToeSection.jD, AutoMovieHumanFootToeSection.jR.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `point`, `tangent`, `curvature`; callers supply the complete record.
   */
  export interface IJet {
    /** Place, `[across, up]` mm. */
    point: AutoMovieVector2Tuple;

    /** Unit tangent in the sense the ring runs. */
    tangent: AutoMovieVector2Tuple;

    /** Curvature toward the inside, 1/mm. */
    curvature: number;
  }

  /** A body section's piece: its name and the two junctions it runs between, in ring order.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A body section's piece: its name and the two junctions it runs between, in ring order.
   * @evidence contracts/development/design.md#principled-representation `name`: The piece's name. `from`: The junction it leaves. `to`: The junction it reaches.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanFootArc.pieces. Also types AutoMovieHumanFootArc.BODY, AutoMovieHumanFootArc.TOE.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `from`, `to`; callers supply the complete record.
   */
  export interface IPiece<Junction extends string> {
    /** The piece's name. */
    name: string;

    /** The junction it leaves. */
    from: Junction;

    /** The junction it reaches. */
    to: Junction;
  }

  /** A junction of a body section, at its guide.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A junction of a body section, at its guide.
   * @evidence contracts/development/design.md#principled-representation A junction of a body section, at its guide. The closed alternatives are "crest", "lateral", "contactLateral", "contactMedial", "medial".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanFootArc.BODY.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootArc.BODY for a junction of a body section, at its guide.
   */
  export type BodyJunction =
    | "crest"
    | "lateral"
    | "contactLateral"
    | "contactMedial"
    | "medial";

  /** A junction of a toe's section: the dorsal, lateral side, plantar and medial side points.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A junction of a toe's section: the dorsal, lateral side, plantar and medial side points.
   * @evidence contracts/development/design.md#principled-representation A junction of a toe's section: the dorsal, lateral side, plantar and medial side points. The closed alternatives are "dorsal", "lateral", "plantar", "medial".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanFootArc.TOE.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootArc.TOE for a junction of a toe's section: the dorsal, lateral side, plantar and medial side points.
   */
  export type ToeJunction = "dorsal" | "lateral" | "plantar" | "medial";
}
