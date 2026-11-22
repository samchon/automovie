import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A salto: a jump whose flight turns the whole body head over heels about
 * its centre of mass, forward or backward, a whole number of times, and
 * lands on the feet (#3377: the salti of floor gymnastics, a diver's and a
 * free-runner's flip).
 *
 * A row of `jump` (#3428): the jump asked for `turns` somersaults its way,
 * so the performance's flight pass (`HumanPerformanceFlight`) turns the
 * composed body by the angular momentum that lands them, a tuck laid over
 * the flight turning it faster. A request the take-off cannot meet is the
 * pass's refusal.
 *
 * Events: the jump's (`takeoff`, `apex`, `touchdown`, `settled`).
 *
 * The take-off's largest momentum is the flight pass's physical ceiling,
 * and the search must meet its turns within that ceiling. `RATE`, the
 * provisional rate other gymnastics laws still read, is not read here.
 *
 * @evidence contracts/development/common.md#meaningful-documentation to: The floor point to land on, world metres. apex: Apex height of the flight above take-off, metres; `APEX` of the stature when absent. way: Which way the body turns; `forward` when absent.
 * @evidence contracts/development/design.md#principled-representation to: The floor point to land on, world metres. apex: Apex height of the flight above take-off, metres; `APEX` of the stature when absent. way: Which way the body turns; `forward` when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/salto.ts (salto.plan, context); sport/salto.ts (salto.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanSalto {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The landing place, the apex, the way and the turns.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The way is a closed union and the turns are whole.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The floor point to land on, world metres. */
    to: IAutoMovieVector3;

    /** Apex height of the flight above take-off, metres; 0.3 of the stature when absent (`salto.APEX`, provisional), about 0.53 m at a 1.75 m stature. Gravity decides the flight time as for a jump: `sqrt(8 apex / g)` at a level landing, g 9.80665 m/s2, 0.66 m there; the somersault must fit it, or the take-off cannot meet it and the request is refused. */
    apex?: number;

    /** Which way the body turns; `forward` when absent. */
    way?: "forward" | "backward";

    /** Whole turns; 1 when absent.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    turns?: number;
  }
}
