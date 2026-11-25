import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * An authored environmental interruption of a walk: a swinging toe meets a
 * named fixed object, or a bearing sole exceeds the friction of its staged
 * surface. The walk is cut at that instant and continues into a capture step, a
 * braced rail catch or the ordinary fall, on the same clock. Register
 * `HumanEnvironmentRecovery.environmentalRecovery` to use it.
 */
export namespace IAutoMovieMotionHumanEnvironmentRecovery {
  /** A fixed bar that receives the actor's hand as support. */
  export interface IRail {
    /** Subject of the fixed rail prop. */
    prop: string;

    /** Id of its `bar` affordance. */
    point: string;

    /** The hand that braces on the bar. */
    hand: AutoMovieHumanSide;
  }

  /**
   * The filmed resolution of the lost support: `auto` lets the perturbation law
   * choose, `step` and `fall` require that response, and `rail` braces a hand
   * on the named bar.
   */
  export type Outcome = "auto" | "step" | "fall" | "rail";

  /** A swinging toe stopped by a fixed shaped obstruction. */
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

  /** A bearing foot losing grip on its current support. */
  export interface ISlip {
    /** Discriminant: a slipping stance foot. */
    kind: "slip";

    /** The bearing foot that slips. */
    foot: AutoMovieHumanSide;

    /**
     * Static friction coefficient of the staged surface, dimensionless and
     * non-negative.
     */
    coefficient: number;

    /** Subject of the prop the foot bears on; the floor when absent. */
    support?: string;

    /** The resolution; `auto` when absent. */
    outcome?: Outcome;

    /** The bar of the `rail` outcome; required by it and refused otherwise. */
    rail?: IRail;
  }

  /** Parameters: a trip or a slip. */
  export type IParams = ITrip | ISlip;
}
