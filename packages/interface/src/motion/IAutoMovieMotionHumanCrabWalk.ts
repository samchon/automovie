import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A supine quadrupedal crawl, the crab walk of horror films: from sitting, the
 * hands plant behind the hips and the pelvis lifts, and the body travels on its
 * hands and feet with the chest up, feet first or head first. The full backbend
 * variant arches the spine over so the head hangs reversed, and is refused for
 * a body whose spine cannot bend that far.
 *
 * The hands and the feet are the only floor contacts, and they step in the
 * diagonal sequence of a quadrupedal walk: a hand and the opposite foot swing
 * together while the other pair bears.
 */
export namespace IAutoMovieMotionHumanCrabWalk {
  /** Which end of the body leads the travel. */
  export type Lead = "feet" | "head";

  /** Parameters. */
  export interface IParams {
    /**
     * Where the root travels, metres in the performer's frame at the start:
     * `+z` ahead of the body as it sat.
     */
    to: IAutoMovieVector3;

    /** Which end leads; `feet` when absent. */
    lead?: Lead;

    /**
     * Whether the spine arches into a full backbend with the head reversed;
     * false when absent.
     */
    backbend?: boolean;

    /** The pelvis's height above the floor, in statures; 0.22 when absent. */
    height?: number;
  }
}
