import type { AutoMovieVector2Tuple } from "../../../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieHumanFootArc } from "./IAutoMovieHumanFootArc";

/** Type contracts exchanged by AutoMovieHumanFootSectionJets; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootSectionJets {
  /** A section's five guide points in its plane, `[across, up]`, mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A section's five guide points in its plane, `[across, up]`, mm.
   * @evidence contracts/development/design.md#principled-representation `crest`: The instep's crest. `lateral`: The lateral border. `contactLateral`: The lateral edge of the plantar contact.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanFootSectionJets.p.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `crest`, `lateral`, `contactLateral`, `contactMedial`, `medial`; callers supply the complete record.
   */
  export interface IPoints {
    /** The instep's crest. */
    crest: AutoMovieVector2Tuple;

    /** The lateral border. */
    lateral: AutoMovieVector2Tuple;

    /** The lateral edge of the plantar contact. */
    contactLateral: AutoMovieVector2Tuple;

    /** The medial edge of the plantar contact. */
    contactMedial: AutoMovieVector2Tuple;

    /** The medial border. */
    medial: AutoMovieVector2Tuple;
  }

  /** What the jets read.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the jets read.
   * @evidence contracts/development/design.md#principled-representation `points`: The five points. `heights`: The lateral and medial contact edges' heights over the floor, mm. `corner`: The heel's posterior corner's height, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanFootSectionJets.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `points`, `heights`, `corner`; callers supply the complete record.
   */
  export interface IInput {
    /** The five points. */
    points: IPoints;

    /** The lateral and medial contact edges' heights over the floor, mm. */
    heights: {
      /** Section phase of the lateral border, radians. */
      lateral: number;
      /** Section phase of the medial border, radians. */
      medial: number;
    };

    /** The heel's posterior corner's height, mm. */
    corner: number;
  }

  /** The five jets.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The five jets.
   * @evidence contracts/development/design.md#principled-representation `crest`: The crest's. `lateral`: The lateral border's. `contactLateral`: The lateral contact edge's.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootSectionJets.of. Also types AutoMovieHumanFootBody.jets.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `crest`, `lateral`, `contactLateral`, `contactMedial`, `medial`; callers supply the complete record.
   */
  export interface IJets {
    /** The crest's. */
    crest: IAutoMovieHumanFootArc.IJet;

    /** The lateral border's. */
    lateral: IAutoMovieHumanFootArc.IJet;

    /** The lateral contact edge's. */
    contactLateral: IAutoMovieHumanFootArc.IJet;

    /** The medial contact edge's. */
    contactMedial: IAutoMovieHumanFootArc.IJet;

    /** The medial border's. */
    medial: IAutoMovieHumanFootArc.IJet;
  }
}
