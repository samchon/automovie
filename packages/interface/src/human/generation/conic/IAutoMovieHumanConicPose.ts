import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanConicLoft } from "./IAutoMovieHumanConicLoft";

/**
 * Reference-to-pose course station maps and transported directions, preserving the family's section values.
 *
 * The interface package owns these declarations; AutoMovieHumanConicPose in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Reference-to-pose course station maps and transported directions, preserving the family's section values. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only ICourse, MapResult, TwistCarried, ReposeCarried, IReposeResult declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation ICourse, MapResult, TwistCarried, ReposeCarried, IReposeResult separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanConicPose exchanges the named ICourse, MapResult, TwistCarried, ReposeCarried, IReposeResult contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanConicPose {
  /** A jointed course's runs and turns in arclength, as `AutoMovieViewJointedCourse.prepare` dates them.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A jointed course's runs and turns in arclength, as `AutoMovieViewJointedCourse.prepare` dates them.
   * @evidence contracts/development/design.md#principled-representation `lengths`: Segment lengths between neighbouring centres, mm. `angles`: Each interior centre's turn angle, radians. `halves`: Each turn's half arclength, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanConicPose.course. Read by AutoMovieHumanConicPose.breaks, AutoMovieHumanConicPose.map. Also types AutoMovieHumanConicPose.[from, to].
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `lengths`, `angles`, `halves`, `setbacks`, `starts`, `total`; callers supply the complete record.
   */
  export interface ICourse {
    /** Segment lengths between neighbouring centres, mm. */
    lengths: number[];

    /** Each interior centre's turn angle, radians. */
    angles: number[];

    /** Each turn's half arclength, mm. */
    halves: number[];

    /** Each turn's set-back on both its segments, mm. */
    setbacks: number[];

    /** The station each turn starts at, mm. */
    starts: number[];

    /** The course's arclength from its first centre to its last, mm. */
    total: number;
  }

  /** Result of AutoMovieHumanConicPose.map. The map of stations from a reference course to its posed course, of slope 1 on every run and before the first centre and past the
  last, and linear across each turn's span. A run after a turn ends where the posed course's run ends, at its far centre's set-back,
  and keeps its reference length back from there; the first run starts at the first centre. Each turn's span lies between its
  neighbours' runs, so it takes the turn's own change of arclength and any change of the following segment's length. Null when the
  two courses' breakpoints are the same numbers, where the map is the identity; a span left without length is refused.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The map of stations from a reference course to its posed course, of slope 1 on every run and before the first centre and past the last, and linear across each turn's span.
 * @evidence contracts/development/design.md#principled-representation The map of stations from a reference course to its posed course, of slope 1 on every run and before the first centre and past the last, and linear across each turn's span. Alternatives are ((station: number) => number); null.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanConicPose.MapResult is the canonical exchange used by AutoMovieHumanConicPose.map.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanConicPose.map for the map of stations from a reference course to its posed course, of slope 1 on every run and before the first centre and past the last, and linear across each turn's span.
 */
  export type MapResult = ((station: number) => number) | null;

  /** The carried argument of AutoMovieHumanConicPose.twist. The roll that brings a posed family's chart on each run to where the run's segment carries the reference chart.
  On run `k` the angle is read at the run's middle: from the posed course's own chart `u`, carried from `up` by the turns alone, toward
  `v`, to the reference course's own `u` there, carried likewise, as `carried` maps it into the pose. Each angle is taken on the branch nearest the run
  before it. The roll's knots stand at each run's ends and `ROLL_KNOTS` points between, on the line from the angle of the run before
  (the first run: its own) to the run's own, so it holds across every turn. Absent when no run's angle reaches `NO_TWIST`.
  @param reference The family as stored, in the reference pose.
  @param posed Its centres, halves and `up` at the pose, without a roll.
  @param carried A direction of the reference pose on run `k`, as that run's segment carries it to the pose.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The roll that brings a posed family's chart on each run to where the run's segment carries the reference chart.
 * @evidence contracts/development/design.md#principled-representation The roll that brings a posed family's chart on each run to where the run's segment carries the reference chart. The callable takes run, direction and returns AutoMovieVector3Tuple.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanConicPose.TwistCarried is the canonical exchange used by AutoMovieHumanConicPose.twist.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanConicPose.twist for the roll that brings a posed family's chart on each run to where the run's segment carries the reference chart.
 */
  export type TwistCarried = (
    run: number,
    direction: AutoMovieVector3Tuple,
  ) => AutoMovieVector3Tuple;

  /** The carried argument of AutoMovieHumanConicPose.repose. A family carried to a pose: its centres and `up` as given, its halves keeping every set-back, its stations mapped, and the roll its
  joints' twists ask for. Its section values, layout and relief nets are the family's own arrays; where no station moves, so are its
  `knots`, `tips` and reliefs. `station` maps a station of the reference family to the posed one.
  A family that already rolls its chart (`roll`) keeps that roll on mapped knots; such a family whose joints also twist is refused,
  since one roll would have to carry both.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A family carried to a pose: its centres and `up` as given, its halves keeping every set-back, its stations mapped, and the roll its joints' twists ask for.
 * @evidence contracts/development/design.md#principled-representation A family carried to a pose: its centres and `up` as given, its halves keeping every set-back, its stations mapped, and the roll its joints' twists ask for. The callable takes run, direction and returns AutoMovieVector3Tuple.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanConicPose.ReposeCarried is the canonical exchange used by AutoMovieHumanConicPose.repose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanConicPose.repose for a family carried to a pose: its centres and `up` as given, its halves keeping every set-back, its stations mapped, and the roll its joints' twists ask for.
 */
  export type ReposeCarried = (
    run: number,
    direction: AutoMovieVector3Tuple,
  ) => AutoMovieVector3Tuple;

  /** Result of AutoMovieHumanConicPose.repose. A family carried to a pose: its centres and `up` as given, its halves keeping every set-back, its stations mapped, and the roll its
  joints' twists ask for. Its section values, layout and relief nets are the family's own arrays; where no station moves, so are its
  `knots`, `tips` and reliefs. `station` maps a station of the reference family to the posed one.
  A family that already rolls its chart (`roll`) keeps that roll on mapped knots; such a family whose joints also twist is refused,
  since one roll would have to carry both.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A family carried to a pose: its centres and `up` as given, its halves keeping every set-back, its stations mapped, and the roll its joints' twists ask for.
 * @evidence contracts/development/design.md#principled-representation `family`: Family with the requested segment placement and unchanged section shape fields. `station`: Mapping from original to posed station, or null when the family is moved rigidly and its station coordinate is unchanged.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanConicPose.IReposeResult is the canonical exchange used by AutoMovieHumanConicPose.repose, AutoMovieHumanF1Placement.repose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `family`, `station`; callers supply the complete record.
 */
  export type IReposeResult = {
    /** Family with the requested segment placement and unchanged section shape fields. */
    family: IAutoMovieHumanConicLoft.IFamily;
    /** Mapping from original to posed station, or null when the family is moved rigidly and its station coordinate is unchanged. */
    station: ((station: number) => number) | null;
  };
}
