import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieConicFieldJet } from "./IAutoMovieConicFieldJet";

/** Data and callback contracts shared by the ViewChain operations. */
export namespace IAutoMovieViewChain {
  /**
   * Closed conic profile at one station. Provide at least three chart points in
   * increasing polar phase within one turn, one forward tangent at each point
   * and one dimensionless shoulder in (0, 1) for each following arc.
   */
  export interface IInput {
    /**
     * Local [u, v] points in chart millimetres around the axis origin, ordered
     * by increasing polar phase over less than one turn.
     */
    points: AutoMovieVector2Tuple[];

    /**
     * Nonzero tangent directions in point order, oriented toward the following
     * point. Their positive scale is arbitrary.
     */
    tangents: AutoMovieVector2Tuple[];

    /**
     * Dimensionless shoulder shares in (0, 1), indexed by arc start. The last
     * arc returns to the first point.
     */
    shoulders: number[];
  }

  /**
   * Point, tangent and shoulder controls of a conic chain with their actual
   * station derivatives. Keep the three arrays aligned to the original point
   * and arc order.
   */
  export interface IFieldInput {
    /**
     * Two station-dependent coordinates [u, v] for each control point, with
     * position in chart millimetres.
     */
    points: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet][];

    /** Two station-dependent forward tangent components at each point. */
    tangents: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet][];

    /**
     * Station-dependent dimensionless shoulder share for the arc starting at
     * each point.
     */
    shoulders: IAutoMovieConicFieldJet.IJet[];
  }

  /**
   * One prepared rational quadratic arc. Start, tangent intersection and end
   * are in chart millimetres. Its weight and unwrapped phase span define the
   * point reader; endpoint curvatures describe its signed bend.
   */
  export interface IArc {
    /** Arc start point in chart millimetres, in the original point array. */
    start: AutoMovieVector2Tuple;

    /**
     * Middle rational control point in chart millimetres, at the two endpoint
     * tangent lines' intersection.
     */
    control: AutoMovieVector2Tuple;

    /**
     * Arc end point in chart millimetres. The closing arc ends at the first
     * input point.
     */
    end: AutoMovieVector2Tuple;

    /** Dimensionless middle weight ρ/(1 − ρ) for the authored shoulder ρ. */
    weight: number;

    /**
     * Start and end polar phases in radians, unwrapped so the end follows the
     * start.
     */
    span: [number, number];

    /**
     * Signed geometric curvatures at start and end, in inverse millimetres.
     * Positive values turn counterclockwise.
     */
    curvature: [number, number];
  }

  /**
   * Curvatures of the incoming and outgoing arcs at their shared point. An
   * exact angular query uses the outgoing arc's derivatives when the curvatures
   * differ.
   */
  export interface IJoin {
    /**
     * Polar angle of the shared point in radians using the chain's unwrapped
     * turn.
     */
    phase: number;

    /** Incoming arc's end curvature in inverse millimetres. */
    before: number;

    /** Outgoing arc's start curvature in inverse millimetres. */
    after: number;
  }

  /**
   * Preparation of the original closed conic chain. The result retains its
   * inputs. On success it contains one arc and join per point. On refusal the
   * arrays are empty and fault records the violated premise.
   */
  export interface ISection {
    /**
     * Original point, tangent and shoulder controls kept by the prepared chain.
     * Preserve them during reads.
     */
    input: IAutoMovieViewChain.IInput;

    /** Prepared arcs in cyclic input point order, or an empty array on refusal. */
    arcs: IAutoMovieViewChain.IArc[];

    /**
     * Curvature pairs in cyclic input point order, or an empty array on
     * refusal.
     */
    joins: IAutoMovieViewChain.IJoin[];

    /** Violated source premise, or null for a successfully prepared chain. */
    fault: string | null;
  }

  /**
   * Point returned by intersecting one polar ray with the actual chain. The
   * result names the arc, its native unit parameter and whether its phase lies
   * on a sided join.
   */
  export interface IRead {
    /** Index of the selected arc in prepared chain order. */
    index: number;

    /** Selected rational arc parameter in [0, 1]. */
    t: number;

    /** Local [u, v] point in chart millimetres on the requested ray. */
    point: AutoMovieVector2Tuple;

    /**
     * True at an exact join where the recorded incoming and outgoing curvatures
     * differ. The query reads second phase derivatives on the outgoing arc.
     */
    sided: boolean;
  }

  /**
   * Actual point and corresponding radial derivatives at one native chain
   * phase. Derivative order is value, station, phase, second station, mixed and
   * second phase. Station is in millimetres and polar phase in radians.
   */
  export interface IReading {
    /** Local [u, v] point in chart millimetres returned by the native ray query. */
    point: AutoMovieVector2Tuple;

    /**
     * Radius and partials [r, r_s, r_φ, r_ss, r_sφ, r_φφ], with station in
     * millimetres and phase in radians.
     */
    radial: IAutoMovieConicFieldJet.IJet;

    /**
     * Whether the selected phase is a join with differing incoming and outgoing
     * curvature, as in the primal read.
     */
    sided: boolean;
  }
}
