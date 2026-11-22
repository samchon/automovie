import type { IAutoMovieMotionHumanHandspring } from "./IAutoMovieMotionHumanHandspring";

/**
 * A handspring vault (#3377): a front handspring whose hands land on a
 * prop's top, a vaulting table, a box or a plyometric box, and fly from
 * it to a chosen mat or the floor beyond.
 *
 * The motion is the handspring's (`handspring.over`) with the hands bearing
 * on the prop's `surface` affordance, read where the prop stands as the
 * action starts. The hands come down where the lunge brings them, so a
 * surface that is not there is refused: the hands' middle must lie inside
 * the top's declared `width` and `depth`; a top that declares neither is
 * taken as wide as it needs to be. The higher hands give the flight a
 * longer fall, so the rate that lands it is lower than on the floor.
 *
 * First pass: no run-up, hurdle, springboard or flight onto the table;
 * the body is entered standing before the prop and lunges onto it, and
 * whether the legs clear the prop's edge is not checked.
 *
 * @evidence contracts/development/common.md#meaningful-documentation on: The prop vaulted over, its subject id; its `surface` is where the hands land.
 * @evidence contracts/development/design.md#principled-representation on: The prop vaulted over, its subject id; its `surface` is where the hands land.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/vault.ts (vault.plan, context).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in vault.plan.
 */
export namespace IAutoMovieMotionHumanVault {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The prop's subject id and the leading leg.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A subject id, resolved through the prop's own affordance.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams extends IAutoMovieMotionHumanHandspring.IParams {
    /** The prop vaulted over, its subject id; its `surface` is where the hands land. */
    on: string;

    /** Optional landing mat subject. Its `surface` sets foot contact, touchdown time and the landing support. */
    landOn?: string;
  }
}
