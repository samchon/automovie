import { AutoMovieWetGrade } from "./AutoMovieWetGrade";

/**
 * One wet or waterproofed region, bound to a logical space of the served environment.
 *
 * A shower room, a plant room with a floor gully, a fountain surround and a roof terrace are the same record at different grades. The point of stating it is that "there is a drain in the render" and "the water has somewhere to go" are different claims: a zone names the membrane that holds the water in, how far it turns up the walls, which way the floor falls, which drains it falls to, and where it hands over to a drier region. Those are the facts a leak is found in, and none of them are visible in a still frame.
 *
 * The zone cites architecture boundaries and service drain nodes by stable id without copying their geometry. `validateWetZones` still checks dangling or foreign citations, duplicate zones and declared obligations; sharing ids does not by itself establish consistency. Slope and upturn are authored scalars, not measurements of a built floor or membrane.
 *
 * @evidence contracts/common.md#principled-implementation Wet-zone admission checks logical-space and boundary references, finite nonnegative upturn/slope, outgoing drainage-system waste ports and thresholds toward drier spaces. Wet/immersed grades additionally require full membrane coverage, a drain and positive declared slope; network admission separately checks drain connectivity.
 * @evidence contracts/common.md#clear-and-simple-design Architecture owns spatial extent and boundaries while the service graph owns drains; the zone adds their coordination obligations without duplicating geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Membrane, slope and sealed sleeves are explicit checked declarations rather than simulated leak proof or a conclusion drawn from tiled appearance.
 * @evidence contracts/common.md#meaningful-documentation Defines environment-space joins, ordinal exposure, membrane and meter upturn, dimensionless fall, drain ownership and drier-boundary thresholds.
 */
export interface IAutoMovieWetZone {
  /** Stable zone identity within the network. */
  id: string;

  /** Id of the logical space of the served environment this zone covers. */
  space: string;

  /** How much water the region is expected to see. */
  grade: AutoMovieWetGrade;

  /**
   * Ids of the boundaries the waterproof membrane covers. A `wet` or `immersed` zone is expected to have every boundary of its space covered; anything left out is a surface the water can reach and the membrane cannot.
   */
  membrane: string[];

  /**
   * Height in metres the membrane turns up beyond the floor plane; a finite number `>= 0`. `0` states a floor-only membrane, which is a decision rather than an omission.
   */
  upturn: number;

  /**
   * Fall of the floor toward the drains as a dimensionless rise-over-run ratio; a finite number `>= 0`. A `wet` or `immersed` zone needs it greater than `0` or the water stands where it lands.
   */
  slope: number;

  /**
   * Ids of the network nodes the floor falls to. Each is expected to carry an outgoing waste-water port and to stand inside {@link space}.
   */
  drains: string[];

  /**
   * Ids of the boundaries where this zone hands over to a drier region: the upstand at a shower door, the step at a terrace threshold. Every boundary joining a `wet` or `immersed` zone to a drier space is expected to appear.
   */
  thresholds: string[];
}
