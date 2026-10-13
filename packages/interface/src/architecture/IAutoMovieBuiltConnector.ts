import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieSurface } from "../scene/IAutoMovieSurface";
import { IAutoMovieConnectorLanding } from "./IAutoMovieConnectorLanding";
import { IAutoMovieConnectorOperation } from "./IAutoMovieConnectorOperation";
import { IAutoMovieConnectorSection } from "./IAutoMovieConnectorSection";
import { IAutoMovieConnectorSteps } from "./IAutoMovieConnectorSteps";

/**
 * A navigable relation between logical spaces, and the shape it has.
 *
 * The record is the traversal geometry a later analysis reads, not a verdict
 * about that analysis: whether a person can pass, how they would route, and how
 * a building evacuates are separate work. It states where the route runs, which
 * way each station faces, how wide and how clear it is there, how steeply it
 * climbs, what one step is, which further spaces it stops at, and where its car
 * stands, so later work reads exact values instead of re-deriving them from
 * modelled geometry.
 *
 * @evidence contracts/common.md#principled-implementation Route geometry checked by `validateBuiltEnvironment`: distinct resolving endpoints, at least two finite stations more than `1e-9` m apart, unit facings per station, exactly one width spelling, a stated slope equal to `atan2(|rise|, horizontal run)` within `1e-6` rad, and step totals within `1e-3` m of the route's climb and run.
 * @evidence contracts/common.md#clear-and-simple-design One record per run with optional facets (landings, orientations, sections, slope, steps, operation) that each default to the plain two-ended static route when absent, so a simple passage states only kind, endpoints, route, width, clearance and elements.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Slope and steps are claims the route must confirm rather than overrides, a width stated twice or not at all is refused, and an unlisted traversal family is `other` rather than relabelled as a neighbouring kind.
 * @evidence contracts/common.md#meaningful-documentation States each member's unit, ordering, tolerance and exclusivity rule, the meaning of every optional member when absent, the one-way stop order, and the slope formula and range.
 * @author Samchon
 */
export interface IAutoMovieBuiltConnector {
  /** Stable connector identity. */
  id: string;

  /**
   * Computational traversal family.
   *
   * `escalator` and `moving-walk` are named because a powered run has a
   * direction of drive and a running state a stair does not have, and
   * {@link operation} is where it states them. A family the set does not cover
   * is `other` plus the visible elements, never a mislabelled neighbour.
   */
  kind:
    | "passage"
    | "stair"
    | "ramp"
    | "lift"
    | "escalator"
    | "moving-walk"
    | "ladder"
    | "bridge"
    | "other";

  /** Logical space at the start of the route. */
  from: string;

  /** Logical space at the end of the route; never the same as {@link from}. */
  to: string;

  /**
   * Whether traversal is permitted in both directions.
   *
   * It also orders what the run reaches: a one-way run reaches from each stop
   * only the stops after it, and it may not declare a state driven in reverse.
   */
  bidirectional: boolean;

  /**
   * Further spaces this one run serves between its two endpoints.
   *
   * A lift passing five floors is one shaft, not five relations, and a stair
   * with a half-landing stops somewhere its two ends do not name. Adjacency and
   * connector queries answer with these stops, so the floors a run reaches stay
   * in the space graph.
   *
   * Absent, the run serves only its two endpoints. Each landing names a
   * resolving space other than either endpoint, appears once, and lies at a
   * route fraction within `(0, 1)`, strictly increasing in
   * {@link IAutoMovieConnectorLanding.at}.
   */
  landings?: IAutoMovieConnectorLanding[];

  /**
   * World-space center route, including both endpoints: at least two finite
   * points, consecutive ones more than `1e-9` metres apart.
   */
  route: IAutoMovieVector3[];

  /**
   * Per-station facing, one unit quaternion per {@link route} point.
   *
   * Absent, the route is a bare position polyline. A spiral stair needs it: its
   * centre route is nearly a vertical line, so consecutive treads differ only
   * by the turn between them. The facing is a full quaternion rather than a
   * heading because a tread is also pitched and a helical ramp is also banked.
   */
  orientations?: IAutoMovieQuaternion[];

  /**
   * Constant usable width in metres.
   *
   * State the constant pair ({@link width} and {@link clearHeight}, both
   * positive) or the varying {@link sections}, never both and never neither,
   * as {@link IAutoMovieSurface} refuses a height rule stated twice.
   */
  width?: number;

  /** Constant vertical clearance in metres; see {@link width} for the rule. */
  clearHeight?: number;

  /**
   * Usable section sampled along the route, for a passage that changes shape.
   *
   * At least two entries ordered by strictly increasing
   * {@link IAutoMovieConnectorSection.at}, the first at `0` and the last at `1`,
   * so every point of the route has a section on both sides of it.
   */
  sections?: IAutoMovieConnectorSection[];

  /**
   * Slope of the travelled surface in radians, measured from horizontal.
   *
   * It is the climb taken against the horizontal length of the route, not of
   * the straight line between its endpoints, so a switchback's slope is the
   * gradient actually walked.
   *
   * The route already implies it, so a stated slope is a claim the engine
   * checks: the implied value is `atan2(|last.y - first.y|, horizontal route
   * length)`, the net climb averaged over the whole route rather than its
   * steepest segment, and a stated slope must lie within `[0, PI / 2]` and agree
   * with it to `1e-6` radians. Absent, nothing is checked.
   */
  slope?: number;

  /**
   * The repeated step of a stepped run, or absent for a smooth one. Step count
   * times rise must match the route's net climb, and count times run its
   * horizontal length, each within one millimetre.
   */
  steps?: IAutoMovieConnectorSteps;

  /**
   * Travelling cars and the named states they stand in, or absent for a run
   * that never moves.
   *
   * A stair is the whole of itself at all times; a lift, escalator, moving
   * walk, or turning gate is not. Absent, the connector is static and lowers
   * with no carriage or state.
   */
  operation?: IAutoMovieConnectorOperation;

  /**
   * Visible elements realizing the connector, such as steps or a lift car;
   * each resolves and is listed once, and the list may not be empty when an
   * {@link operation} is stated.
   */
  elements: string[];
}
