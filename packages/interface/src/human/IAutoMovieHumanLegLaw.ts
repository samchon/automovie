import type { IAutoMovieNaturalCubicSpline } from "../construction/IAutoMovieNaturalCubicSpline";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLegConstruction } from "./IAutoMovieHumanLegConstruction";

/**
 * Fitted leg spline channels and bare canonical section samples before end
 * residuals. Runtime construction and admission remain with
 * AutoMovieHumanLegLaw in Human.
 */
export namespace IAutoMovieHumanLegLaw {
  /** The fitted law's channels with one person's keys. */
  export interface IFamily {
    /** Station of the ankle ring. */
    bottom: number;

    /** Distance between the rings. */
    length: number;

    /** Ankle ring centre in the canonical plane, millimetres. */
    ankle: ICanonicalPlanePoint;

    /** The ankle ring in the canonical frame, world. */
    ankleWorld: AutoMovieVector3Tuple[];

    /** The ring's height off its plane at each phase. */
    ankleLift: number[];

    /** Offset of the law's last centre from the crotch ring's, millimetres. */
    crotchOffset: ICanonicalPlaneOffset;

    /** Centre the crotch ring is read about in the canonical plane. */
    crotchCentre: ICanonicalPlanePoint;

    /** The tape and control inputs. */
    inputs: IAutoMovieHumanLegConstruction.IInputs;

    /** Log-radius profile along the leg. */
    profile: IAutoMovieNaturalCubicSpline;

    /** Forward place of the centre along the leg. */
    forward: IAutoMovieNaturalCubicSpline;

    /** The axis's lateral curves. */
    axis: IAutoMovieNaturalCubicSpline[];

    /** The shape's Fourier channels. */
    shape: IAutoMovieNaturalCubicSpline[];

    /** The radius correction through the ankle and the three tapes. */
    correction: IAutoMovieNaturalCubicSpline;

    /** The ankle ring's radius less the law's, at each phase. */
    ankleResidual: number[];
  }

  /** A point in the canonical X/Z plane: forward X and lateral Z, millimetres. */
  export interface ICanonicalPlanePoint {
    forward: number;
    lateral: number;
  }

  /** A displacement in the canonical X/Z plane, millimetres. */
  export interface ICanonicalPlaneOffset {
    forward: number;
    lateral: number;
  }

  /** Section of the law before any end residual. */
  export interface IBare {
    /** Centre in the canonical plane, `[x, z]`. */
    centre: [number, number];

    /** Radii at the leg's phases. */
    radii: number[];
  }
}
