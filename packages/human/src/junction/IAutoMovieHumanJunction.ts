import { AutoMovieHumanJunctionSite } from "./AutoMovieHumanJunctionSite";
import { AutoMovieHumanSide } from "./AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "./IAutoMovieHumanCage";

/**
 * Joins two cages through the rings they open at one junction site.
 *
 * Joining happens on control cages, before the single subdivision of the whole person, so continuity across the seam comes from the subdivision itself. The junction pairs the two rings by their shared start mark and orientation; where their vertex counts differ it owns the transition patch, placing its extraordinary vertices deliberately away from broad lit areas, and neither part adapts to the other. A species profile can supply another junction for the same contract.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanJunction {
  /**
   * Join two cages at one site.
   *
   * @param props Site, side and the two cages, each opening one ring there
   * @returns One cage holding both inputs and the patch between them, with the two rings consumed and every other ring kept open
   */
  join(props: IAutoMovieHumanJunction.IProps): IAutoMovieHumanCage;
}
export namespace IAutoMovieHumanJunction {
  /**
   * What one join reads. The inputs are not mutated.
   *
   * @author Samchon
   */
  export interface IProps {
    /** The site to join. */
    site: AutoMovieHumanJunctionSite;

    /** The side of a bilateral site, or null for the neck sites. */
    side: AutoMovieHumanSide | null;

    /** The cage on the trunk side of the site, possibly already joined with others. */
    proximal: IAutoMovieHumanCage;

    /** The cage on the far side of the site. */
    distal: IAutoMovieHumanCage;
  }
}
