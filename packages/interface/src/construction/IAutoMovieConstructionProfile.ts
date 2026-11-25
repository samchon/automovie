import type { IAutoMovieConstructionProfileGuide } from "./IAutoMovieConstructionProfileGuide";
import type { IAutoMovieConstructionProfileLoop } from "./IAutoMovieConstructionProfileLoop";
import type { IAutoMovieConstructionProfileRegion } from "./IAutoMovieConstructionProfileRegion";

/**
 * An original section family assembled from oriented curve pieces in one
 * physical plane.
 *
 * This declaration references actual functions in an invocation-owned engine
 * source. Loops are closed contours; their pieces can be open intervals and may
 * be nonconvex. Hole orientation and branch identities remain explicit. The
 * record alone certifies neither simple loops nor regularity, continuity or
 * successful skin generation.
 */
export interface IAutoMovieConstructionProfile {
  /** Stable generating-family identity, independent of logical anatomical names. */
  name: string;

  /** Actual retained physical station interval, metres, finite and increasing. */
  domain: [number, number];

  /** Common physical plane/frame owner key in the runtime source. */
  plane: string;

  /**
   * Closed components or holes, each valid on its own physical station
   * interval.
   */
  loops: IAutoMovieConstructionProfileLoop[];

  /** Original guides at explicit curve clocks, never observed display polylines. */
  guides: IAutoMovieConstructionProfileGuide[];

  /** Logical selections and material/binding addresses of actual source pieces. */
  regions: IAutoMovieConstructionProfileRegion[];

  /** Actual dependency identities; an edit supplies a new source instance. */
  revisions: {
    /** Identity of the original source-function revision. */
    source: string;

    /** Identity of the constraints used to prepare those source functions. */
    constraints: string;

    /** Identity of the retained piece/loop/branch topology. */
    topology: string;
  };
}
