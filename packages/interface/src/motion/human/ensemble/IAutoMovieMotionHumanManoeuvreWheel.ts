import type { IAutoMovieMotionHumanFormation } from "./IAutoMovieMotionHumanFormation";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Constants and types of {@link manoeuvreWheel}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation ways: Each member's arc about the pivot, world metres, by member order. stations: Each member's slot in the wheeling formation, by member order; null when nothing turns.
 * @evidence contracts/development/design.md#principled-representation ways: Each member's arc about the pivot, world metres, by member order. stations: Each member's slot in the wheeling formation, by member order; null when nothing turns.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/manoeuvreWheel.ts (manoeuvreWheel, return); ensemble/HumanManoeuvre.ts (HumanManoeuvre.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanFormation.IStation identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanManoeuvreWheel {
  /**
   * A wheel's members' ways, and the stations they keep, or null when nothing turns.
   *
   * @evidence contracts/development/common.md#meaningful-documentation ways: Each member's arc about the pivot, world metres, by member order. stations: Each member's slot in the wheeling formation, by member order; null when nothing turns.
   * @evidence contracts/development/design.md#principled-representation ways: Each member's arc about the pivot, world metres, by member order. stations: Each member's slot in the wheeling formation, by member order; null when nothing turns.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/manoeuvreWheel.ts (manoeuvreWheel, return); ensemble/HumanManoeuvre.ts (HumanManoeuvre.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanFormation.IStation identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IWheel {
    /** Each member's arc about the pivot, world metres, by member order. */
    ways: IAutoMovieVector3[][];

    /** Each member's slot in the wheeling formation, by member order; null when nothing turns. */
    stations: IAutoMovieMotionHumanFormation.IStation[] | null;
  }
}
