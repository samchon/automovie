import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * An authored environmental interruption of a walk: a swinging toe meets a
 * named fixed object, or a bearing sole exceeds the friction of its staged
 * surface. The walk is cut at that instant and continues into a capture
 * step, a braced rail catch or the ordinary fall, on the same clock.
 * Register `HumanEnvironmentRecovery.environmentalRecovery` to use it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the entering gait, the two causes, the outcomes and the registered law.
 * @evidence contracts/development/design.md#principled-representation The cause is a measured obstruction or a friction coefficient; the outcome selects an existing support or reaction law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the contacted geometry and the chosen compatible resolution, as planEnvironmentRecovery reads them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No hazard is inferred from a name alone: the law measures the cue before it publishes a support loss.
 */
export namespace IAutoMovieMotionHumanEnvironmentRecovery {
  /**
   * A fixed bar that receives the actor's hand as support.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the placed rail, its bar and the receiving hand.
   * @evidence contracts/development/design.md#principled-representation The bar affordance supplies the axis and length in world metres; the hand is the anatomical side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three names the rail catch reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The author supplies no fitted pose or second shape; an unreachable bar is refused at runtime.
   */
  export interface IRail {
    /** Subject of the fixed rail prop. */
    prop: string;

    /** Id of its `bar` affordance. */
    point: string;

    /** The hand that braces on the bar. */
    hand: AutoMovieHumanSide;
  }

  /**
   * The filmed resolution of the lost support: `auto` lets the perturbation
   * law choose, `step` and `fall` require that response, and `rail` braces a
   * hand on the named bar.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each outcome selects.
   * @evidence contracts/development/design.md#principled-representation A closed set; each member maps to one existing law.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the outcomes this action can plan are exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The law still refuses an outcome the perturbation cannot produce, and a rail without the rail outcome.
   */
  export type Outcome = "auto" | "step" | "fall" | "rail";

  /**
   * A swinging toe stopped by a fixed shaped obstruction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the obstruction, the swinging foot, the outcome and the optional rail.
   * @evidence contracts/development/design.md#principled-representation The obstruction's collision shapes decide the contact against the displayed toe.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the trip admission and the chosen response read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No force is typed: the swing velocity at the cut sets it.
   */
  export interface ITrip {
    /** Discriminant: an obstructed swing. */
    kind: "trip";

    /** Subject of the fixed prop whose shapes obstruct the toe. */
    obstacle: string;

    /** The swinging foot that is obstructed. */
    foot: AutoMovieHumanSide;

    /** The resolution; `auto` when absent. */
    outcome?: Outcome;

    /** The bar of the `rail` outcome; required by it and refused otherwise. */
    rail?: IRail;
  }

  /**
   * A bearing foot losing grip on its current support.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the slipping foot, the static friction coefficient, the support, the outcome and the optional rail.
   * @evidence contracts/development/design.md#principled-representation The coefficient is dimensionless static friction; the support is the prop the foot bears on or the floor.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the slip admission and the chosen response read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The required friction is measured from the entering motion, never authored.
   */
  export interface ISlip {
    /** Discriminant: a slipping stance foot. */
    kind: "slip";

    /** The bearing foot that slips. */
    foot: AutoMovieHumanSide;

    /** Static friction coefficient of the staged surface, dimensionless and non-negative. */
    coefficient: number;

    /** Subject of the prop the foot bears on; the floor when absent. */
    support?: string;

    /** The resolution; `auto` when absent. */
    outcome?: Outcome;

    /** The bar of the `rail` outcome; required by it and refused otherwise. */
    rail?: IRail;
  }

  /**
   * Parameters: a trip or a slip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two variants.
   * @evidence contracts/development/design.md#principled-representation A closed discriminated union on kind.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two causes the law admits.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Alternatives are separated by kind rather than optional fields.
   */
  export type IParams = ITrip | ISlip;
}
