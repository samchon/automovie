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
 * The record is deliberately the traversal geometry a later analysis reads, not
 * a verdict about that analysis: whether a person can actually pass, how they
 * would route, and how a building evacuates are separate work. What lives here
 * is the measurable shape — where the route runs, which way each station faces,
 * how wide and how clear it is there, how steeply it climbs, what one step is,
 * which further spaces it stops at, and where its car stands — so that later
 * work has something exact to read instead of re-deriving it from whatever
 * happened to be modelled.
 *
 * @evidence contracts/common.md#principled-implementation Traversal shape is a world polyline with optional per-station quaternions and either a constant or a sampled section; validation derives net climb and horizontal run from the route and refuses a stated slope off by more than 1e-6 rad or a step total off by more than 1 mm.
 * @evidence contracts/common.md#clear-and-simple-design Slope and step totals are optional claims checked against the route rather than second truths, and width takes exactly one of two spellings; the route-metrics arithmetic itself is written twice, in `validateBuiltEnvironment` and in `builtConnectorGeometry`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unlisted traversal type is `other` rather than a near kind, and slope uses the route's horizontal length rather than the endpoint chord; because it is the net average, a route that rises and then falls reads shallower than its steepest leg.
 * @evidence contracts/common.md#meaningful-documentation States the section spelling rule, how slope is measured and checked, step agreement, landing order, the orientation count, one-way drive limits and what each omitted field means.
 */
export interface IAutoMovieBuiltConnector {
  /** Stable connector identity. */
  id: string;

  /**
   * Computational traversal family.
   *
   * `escalator` and `moving-walk` are named because a powered run is not a
   * stair with a different label: it has a direction of drive and a running
   * state a stair does not have, and {@link operation} is where it states them.
   * Anything the set does not cover is `other` plus the visible elements, never
   * a mislabelled neighbour.
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
   * It also orders what the run reaches: a one-way run carries somebody only to
   * the stops ahead of where they boarded, and it may not declare a state
   * driven against its own direction.
   */
  bidirectional: boolean;

  /**
   * Further spaces this one run serves between its two endpoints.
   *
   * A lift passing five floors is one shaft, not five relations, and a stair
   * with a half-landing stops somewhere its two ends do not name. Stating those
   * stops here is what keeps them in the graph: an adjacency or connector query
   * answers with them, so the floors a run reaches cannot quietly become floors
   * only its geometry knows about.
   *
   * Omitting the field leaves the run the two-ended relation it has always
   * been. Landings are ordered by strictly increasing
   * {@link IAutoMovieConnectorLanding.at}, and neither endpoint is restated as
   * one, because a stop stated twice is two stops that can disagree.
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
   * Omitting it leaves the route the bare position polyline it has always been.
   * Stating it is what makes a spiral stair expressible at all: its centre
   * route is nearly a vertical line, so consecutive treads differ only by the
   * turn between them, and a position sequence cannot tell them apart. The
   * facing is a full quaternion rather than a heading because a tread is also
   * pitched and a helical ramp is also banked.
   */
  orientations?: IAutoMovieQuaternion[];

  /**
   * Constant usable width in metres.
   *
   * State the constant pair ({@link width} and {@link clearHeight}) or the
   * varying {@link sections}, never both and never neither. This mirrors how
   * {@link IAutoMovieSurface} refuses a height rule stated twice: two spellings
   * of one fact are two facts that can disagree.
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
   * It is the climb taken against the horizontal length **of the route**, not
   * of the straight line between its endpoints, so a switchback's stated slope
   * is the gradient actually walked rather than a chord that never existed.
   *
   * The route already implies it, so stating it is a claim the engine checks
   * rather than a second source of truth: a declared slope that disagrees with
   * the route is refused instead of quietly winning.
   *
   * The implied value is `atan2(|last.y - first.y|, horizontal route length)`,
   * the net climb averaged over the whole route rather than its steepest
   * segment, and a stated slope must lie within `[0, PI / 2]` and agree with it
   * to `1e-6` radians.
   */
  slope?: number;

  /**
   * The repeated step of a stepped run, or nothing for a smooth one. Step count
   * times rise must match the route's net climb, and count times run its
   * horizontal length, each within one millimetre.
   */
  steps?: IAutoMovieConnectorSteps;

  /**
   * Travelling cars and the named states they stand in, or nothing for a run
   * that never moves.
   *
   * A stair is the whole of itself at all times; a lift, escalator, moving
   * walk, or turning gate is not. Omitting the field keeps the static record a
   * stair, ramp, bridge, or ladder has always been, so an environment written
   * before this field lowers and validates byte-for-byte as it did.
   */
  operation?: IAutoMovieConnectorOperation;

  /**
   * Visible elements realizing the connector, such as steps or a lift car;
   * each resolves and is listed once, and the list may not be empty when an
   * {@link operation} is stated.
   */
  elements: string[];
}
