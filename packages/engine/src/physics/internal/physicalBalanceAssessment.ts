import type {
  IAutoMoviePhysicalBalance,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * One capture-point assessment's shared state
 * (`AutoMovieEnginePhysicalBalance.assess`): the readings it was asked about, the
 * capture point and its rate, the support's centroid and the capture point's
 * direction from it, and the swing's timing; with the support outline, timing
 * and convergence rules its steps share.
 */
export namespace physicalBalanceAssessment {
  /** The assessment's shared state. */
  export interface IAssessment {
    /** The readings and limits assessed. */
    input: IAutoMoviePhysicalBalance.IAssessInput;

    /** The pendulum's rate, per second. */
    omega: number;

    /** The capture point, on the floor. */
    capturePoint: IAutoMovieVector3;

    /** The margin the stance holds its centre of pressure inside, metres. */
    inset: number;

    /** The assessment before any step is chosen. */
    result: IAutoMoviePhysicalBalance.IResult;

    /** The supports' centroid. */
    centroid: IAutoMovieVector3;

    /** The capture point's horizontal offset from the centroid. */
    direction: IAutoMovieVector3;

    /** The offset's squared length. */
    denominator: number;

    /** The swing's timing, when its bounds are valid. */
    timing: IAutoMoviePhysicalBalance.IAssessInput["swing"];

    /** What a swing under way has spent, seconds. */
    spent: number;
  }

  /*
   * The most passes the step's place and time take to agree.
   */
  export const PASSES: number = 20;

  /*
   * The step target's change, metres, below which its place and time agree.
   */
  export const SETTLED: number = 1e-4;

}
