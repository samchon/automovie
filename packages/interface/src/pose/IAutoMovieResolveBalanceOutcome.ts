import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A body's state at an impulse. The impulse magnitudes at which the outcome
 * changes, N s.
 */
export namespace IAutoMovieResolveBalanceOutcome {
  /** A body's state at an impulse. */
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

    /**
     * The pendulum's length, metres (Hof's leg length,
     * `resolveAutoMovieCenterOfMass.pendulum`).
     */
    length: number;

    /** The support points on the floor, world metres. */
    support: readonly IAutoMovieVector3[];

    /** The longest step from the centre, metres: a leg length. */
    reach: number;

    /**
     * The margin a landed foot catches the extrapolated centre within, metres:
     * half a foot's length.
     */
    margin: number;

    /** A capture step's swing time after the first, seconds. */
    step: number;

    /**
     * The first capture step's landing after the impulse, seconds, the reaction
     * and the weight shift included; `step` when absent.
     */
    first?: number;

    /** Gravitational acceleration, m/s²; standard when absent. */
    gravity?: number;
  }

  /** The impulse magnitudes at which the outcome changes, N s. */
  export interface IBounds {
    /** Past it, the extrapolated centre leaves the base. */
    absorb: number;

    /** Past it, no number of steps catches the body. */
    step: number;
  }

  /** What the impulse does. */
  export interface IOutcome {
    /** Absorbed within the base, caught by steps, or a fall. */
    outcome: "absorb" | "step" | "fall";

    /** The centre's velocity after the impulse, m/s. */
    velocity: IAutoMovieVector3;

    /** The change of angular momentum about the centre, kg m²/s. */
    angular: IAutoMovieVector3;

    /** The extrapolated centre after the impulse, world metres. */
    extrapolated: IAutoMovieVector3;

    /**
     * The capture steps' landing points on the floor, in order; empty for an
     * absorb or a fall.
     */
    steps: IAutoMovieVector3[];

    /** The impulse bounds along the push. */
    bounds: IAutoMovieResolveBalanceOutcome.IBounds;
  }
}
