import type { IAutoMovieConstructionProfileGuide } from "./IAutoMovieConstructionProfileGuide";
import type { IAutoMovieConstructionProfileLoop } from "./IAutoMovieConstructionProfileLoop";
import type { IAutoMovieConstructionProfileRegion } from "./IAutoMovieConstructionProfileRegion";

/**
 * Original section family built from oriented curve intervals in one physical
 * frame. Each loop names its own retained station interval and ordered source
 * pieces. A realization matches this declaration to the actual curve and frame
 * functions supplied for the current invocation.
 */
export interface IAutoMovieConstructionProfile {
  /**
   * Stable name of this generating family used to resolve its invocation source
   * and identify its retained surfaces.
   */
  name: string;

  /**
   * Finite increasing physical station interval in metres. Each retained loop
   * must lie inside it.
   */
  domain: [number, number];

  /** Key of the common physical section frame in the invocation source. */
  plane: string;

  /**
   * Ordered original contours and holes, each with its own retained station
   * interval.
   */
  loops: IAutoMovieConstructionProfileLoop[];

  /** Named original piece-clock addresses used to locate station-varying guides. */
  guides: IAutoMovieConstructionProfileGuide[];

  /**
   * Logical selections, material and binding addresses on retained piece
   * charts.
   */
  regions: IAutoMovieConstructionProfileRegion[];

  /**
   * Source-function, constraint and topology revision identities used to
   * distinguish the original dependency set. Author a new identity when the
   * corresponding dependency changes.
   */
  revisions: {
    /** Identity of the original source-function revision. */
    source: string;

    /** Identity of the constraints used to prepare those source functions. */
    constraints: string;

    /** Identity of the retained piece/loop/branch topology. */
    topology: string;
  };
}
