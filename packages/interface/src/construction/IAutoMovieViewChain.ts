import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieConicFieldJet } from "./IAutoMovieConicFieldJet";

/** Data and callback contracts shared by the ViewChain operations. */
export namespace IAutoMovieViewChain {
  /**
     * The chain's inputs at one station.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States units, ordering, orientation and the arc each entry belongs to.
     * @evidence contracts/development/design.md#principled-representation The section's own points and tangent directions, and one shoulder per arc from a point to the next.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `of`.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Lengths, order and orientation are checked by `of`, not assumed.
     */
    export interface IInput {
      /** Control points, chart millimetres about the course point, in strictly increasing phase over less than one turn. */
      points: AutoMovieVector2Tuple[];
  
      /** Tangent direction at each point, oriented toward the next point (any positive length). */
      tangents: AutoMovieVector2Tuple[];
  
      /** Shoulder of each arc from point j to point j + 1 (the last closes to the first), in (0, 1). */
      shoulders: number[];
    }

  /**
     * The chain's inputs with their station jets, for the native jets.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States that each entry carries its physical station partials and no phase partials.
     * @evidence contracts/development/design.md#principled-representation The same inputs as `IInput`, each scalar a `[value, s, 0, ss, 0, 0]` jet.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `primal` and `jets`.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Unavailable station jets are the caller's failure, never zeros supplied here.
     */
    export interface IFieldInput {
      /** Control points, each coordinate a station jet. */
      points: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet][];
  
      /** Tangent directions, each component a station jet. */
      tangents: [IAutoMovieConicFieldJet.IJet, IAutoMovieConicFieldJet.IJet][];
  
      /** Shoulders, station jets. */
      shoulders: IAutoMovieConicFieldJet.IJet[];
    }

  /**
     * One prepared arc.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the control points, weight, phase interval and end curvatures.
     * @evidence contracts/development/design.md#principled-representation The rational quadratic's three control points and middle weight, with its phase span and signed end curvatures.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `read`, `jets`, the join report and the tests.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Only admitted arcs are prepared.
     */
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
  
      /** Signed curvature at the start and at the end, per millimetre (positive turning counter-clockwise). */
      curvature: [number, number];
    }

  /**
     * The two arcs' curvatures at one shared point.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States which arcs meet and the units.
     * @evidence contracts/development/design.md#principled-representation The incoming arc's end curvature and the outgoing arc's start curvature at a control point.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `read` for the sided flag and by the trace's receipt.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Reported, never equalized here.
     */
    export interface IJoin {
      /** The point's phase, radians. */
      phase: number;
  
      /** The arc ending there: its end curvature, per millimetre. */
      before: number;
  
      /** The arc starting there: its start curvature, per millimetre. */
      after: number;
    }

  /**
     * A prepared chain or its fault.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the fault's meaning.
     * @evidence contracts/development/design.md#principled-representation The inputs, their arcs and joins, and a named fault that empties both.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `read`, `jets`, the native reader and the trace.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts A faulted chain has no arcs to read.
     */
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

  /**
     * Where one phase's ray meets the chain.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the members' meaning and units and the sided rule.
     * @evidence contracts/development/design.md#principled-representation The arc, its parameter and its exact point, with whether the phase sits on a join whose two curvatures differ.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `jets`, the native reader's Point0 and value, and `radius`.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Only a met ray yields a reading.
     */
    export interface IRead {
      /** The arc the ray meets. */
      index: number;
  
      /** Its parameter there, in [0, 1]. */
      t: number;
  
      /** The arc's point there, chart millimetres. */
      point: AutoMovieVector2Tuple;
  
      /** The phase is a join's and that join's two curvatures differ: second phase derivatives here are the starting arc's alone. */
      sided: boolean;
    }

  /**
     * One phase's native reading.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the output order and units and the sided rule.
     * @evidence contracts/development/design.md#principled-representation The ray reading's point and sided flag with the radius Hessian at that same arc parameter.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the native reader's phase and jet capabilities.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts A vanishing phase speed or unmet ray yields no reading rather than substituted values.
     */
    export interface IReading {
      /** The arc's point, chart millimetres; its direction is the ray's. */
      point: AutoMovieVector2Tuple;
  
      /** `[r, r_s, r_phi, r_ss, r_sphi, r_phiphi]`, millimetres per station millimetre and per radian. */
      radial: IAutoMovieConicFieldJet.IJet;
  
      /** As `IRead.sided`. */
      sided: boolean;
    }
}
