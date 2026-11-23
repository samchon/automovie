import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieConicFieldJet } from "./IAutoMovieConicFieldJet";

/** Data and callback contracts shared by the ViewChain operations. */
export namespace IAutoMovieViewChain {
  /** The chain's inputs at one station. */
  export interface IInput {
    /**
     * Control points, chart millimetres about the course point, in strictly
     * increasing phase over less than one turn.
     */
    points: AutoMovieVector2Tuple[];

    /**
     * Tangent direction at each point, oriented toward the next point (any
     * positive length).
     */
    tangents: AutoMovieVector2Tuple[];

    /**
     * Shoulder of each arc from point j to point j + 1 (the last closes to the
     * first), in (0, 1).
     */
    shoulders: number[];
  }

  /** The chain's inputs with their station jets, for the native jets. */
  export interface IFieldInput {
    /** Control points, each coordinate a station jet. */
    points: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet][];

    /** Tangent directions, each component a station jet. */
    tangents: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet][];

    /** Shoulders, station jets. */
    shoulders: IAutoMovieConicFieldJet.IJet[];
  }

  /** One prepared arc. */
  export interface IArc {
    /** Start point, chart millimetres. */
    start: AutoMovieVector2Tuple;

    /** Control point where the two tangent lines meet. */
    control: AutoMovieVector2Tuple;

    /** End point. */
    end: AutoMovieVector2Tuple;

    /** Middle weight, `rho / (1 - rho)`. */
    weight: number;

    /** Start and end phase, radians, the end unwrapped past the start. */
    span: [number, number];

    /**
     * Signed curvature at the start and at the end, per millimetre (positive
     * turning counter-clockwise).
     */
    curvature: [number, number];
  }

  /** The two arcs' curvatures at one shared point. */
  export interface IJoin {
    /** The point's phase, radians. */
    phase: number;

    /** The arc ending there: its end curvature, per millimetre. */
    before: number;

    /** The arc starting there: its start curvature, per millimetre. */
    after: number;
  }

  /** A prepared chain or its fault. */
  export interface ISection {
    /** The inputs. */
    input: IAutoMovieViewChain.IInput;

    /** The arcs, empty on a fault. */
    arcs: IAutoMovieViewChain.IArc[];

    /** The curvature pair at every control point, empty on a fault. */
    joins: IAutoMovieViewChain.IJoin[];

    /** The broken premise, or null. */
    fault: string | null;
  }

  /** Where one phase's ray meets the chain. */
  export interface IRead {
    /** The arc the ray meets. */
    index: number;

    /** Its parameter there, in [0, 1]. */
    t: number;

    /** The arc's point there, chart millimetres. */
    point: AutoMovieVector2Tuple;

    /**
     * The phase is a join's and that join's two curvatures differ: second phase
     * derivatives here are the starting arc's alone.
     */
    sided: boolean;
  }

  /** One phase's native reading. */
  export interface IReading {
    /** The arc's point, chart millimetres; its direction is the ray's. */
    point: AutoMovieVector2Tuple;

    /**
     * `[r, r_s, r_phi, r_ss, r_sphi, r_phiphi]`, millimetres per station
     * millimetre and per radian.
     */
    radial: IAutoMovieConicFieldJet.IJet;

    /** As `IRead.sided`. */
    sided: boolean;
  }
}
