import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A body's state at an impulse. The impulse magnitudes at which the outcome changes, N s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States world impulse/COM data, capture-step timing and optional application point/gravity defaults. Identifies the push magnitudes separating absorption from stepping and recoverability from falling.
 * @evidence contracts/development/design.md#principled-representation Metres, kg, m/s and N s form an inverted-pendulum capture request; length/reach/margin and second-based step timing require admissible scalar values. Both thresholds are N s along the supplied push direction, rather than positions or elapsed time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieBalanceOutcome uses the shared centre-of-mass and capture-step mathematics; the caller owns the body's measured support points. resolveAutoMovieBalanceOutcome returns these bounds with its capture prediction for impact and motion consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The model predicts absorb/step/fall under its pendulum assumptions, not a solved physical landing; missing at places the impulse at COM. The thresholds belong to the stated support/capture model and cannot certify a native simulation outcome.
 */
export namespace IAutoMovieResolveBalanceOutcome {
  /**
   * A body's state at an impulse.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world impulse/COM data, capture-step timing and optional application point/gravity defaults.
   * @evidence contracts/development/design.md#principled-representation Metres, kg, m/s and N s form an inverted-pendulum capture request; length/reach/margin and second-based step timing require admissible scalar values.
   * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieBalanceOutcome uses the shared centre-of-mass and capture-step mathematics; the caller owns the body's measured support points.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The model predicts absorb/step/fall under its pendulum assumptions, not a solved physical landing; missing at places the impulse at COM.
   */
  export interface IProps {
    /** The centre of mass, world metres. */
    centre: IAutoMovieVector3;

    /** Its velocity before the impulse, m/s. */
    velocity: IAutoMovieVector3;

    /** The body's mass, kilograms. */
    mass: number;

    /** The impulse, world N s. */
    impulse: IAutoMovieVector3;

    /** Where the impulse acts, world metres; the centre when absent. */
    at?: IAutoMovieVector3;

    /** The pendulum's length, metres (Hof's leg length, `resolveAutoMovieCenterOfMass.pendulum`). */
    length: number;

    /** The support points on the floor, world metres. */
    support: readonly IAutoMovieVector3[];

    /** The longest step from the centre, metres: a leg length. */
    reach: number;

    /** The margin a landed foot catches the extrapolated centre within, metres: half a foot's length. */
    margin: number;

    /** A capture step's swing time after the first, seconds. */
    step: number;

    /** The first capture step's landing after the impulse, seconds, the reaction and the weight shift included; `step` when absent. */
    first?: number;

    /** Gravitational acceleration, m/s²; standard when absent. */
    gravity?: number;
  }

  /**
   * The impulse magnitudes at which the outcome changes, N s.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the push magnitudes separating absorption from stepping and recoverability from falling.
   * @evidence contracts/development/design.md#principled-representation Both thresholds are N s along the supplied push direction, rather than positions or elapsed time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieBalanceOutcome returns these bounds with its capture prediction for impact and motion consumers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The thresholds belong to the stated support/capture model and cannot certify a native simulation outcome.
   */
  export interface IBounds {
    /** Past it, the extrapolated centre leaves the base. */
    absorb: number;

    /** Past it, no number of steps catches the body. */
    step: number;
  }

  /**
   * What the impulse does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Separates predicted outcome, post-impulse momentum and proposed landing positions.
   * @evidence contracts/development/design.md#principled-representation The literal outcome accompanies world m/s velocity, kg m²/s angular change, world-metre extrapolated COM and ordered capture steps.
   * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieBalanceOutcome allocates the prediction for callers that author or inspect an impact response.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Steps are empty for absorb/fall by producer convention; the interface permits ordinary mutable arrays and does not encode successful measured landings.
   */
  export interface IOutcome {
    /** Absorbed within the base, caught by steps, or a fall. */
    outcome: "absorb" | "step" | "fall";

    /** The centre's velocity after the impulse, m/s. */
    velocity: IAutoMovieVector3;

    /** The change of angular momentum about the centre, kg m²/s. */
    angular: IAutoMovieVector3;

    /** The extrapolated centre after the impulse, world metres. */
    extrapolated: IAutoMovieVector3;

    /** The capture steps' landing points on the floor, in order; empty for an absorb or a fall. */
    steps: IAutoMovieVector3[];

    /** The impulse bounds along the push. */
    bounds: IAutoMovieResolveBalanceOutcome.IBounds;
  }
}
