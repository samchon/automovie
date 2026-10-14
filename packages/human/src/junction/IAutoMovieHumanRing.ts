import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanJunctionSite } from "./AutoMovieHumanJunctionSite";
import { AutoMovieHumanSide } from "./AutoMovieHumanSide";

/**
 * One opening of a cage: a closed loop of boundary vertices where the part meets a neighbour.
 *
 * Both parts at a junction site build their ring from one shared definition: the site's frame from the skeleton, the vertex count of the site, the orientation and the start mark below. That shared definition is what lets the junction join them without either part adapting to the other, and what keeps a part swappable for another with the same ring. When two rings at a site differ in count, the junction owns the transition patch.
 *
 * Orientation: the vertices run counterclockwise about `frame.normal` by the right-hand rule. The normal points out of the part, so the two rings of one site run in opposite senses about a common axis, and the junction reverses one of them to pair vertices.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanRing {
  /** Where the ring opens. */
  site: AutoMovieHumanJunctionSite;

  /** The side of a bilateral site, or null for the neck sites. */
  side: AutoMovieHumanSide | null;

  /**
   * Cage vertex indices in ring order, closed implicitly from the last to the first; every consecutive pair is a boundary edge of the cage.
   */
  vertices: number[];

  /**
   * Anatomical direction of the first vertex from the ring's centre, the start mark that aligns the two rings of a site.
   */
  start: "anterior" | "posterior" | "medial" | "lateral" | "superior" | "inferior";

  /** The ring's frame, taken from the skeleton. */
  frame: IAutoMovieHumanRing.IFrame;
}
export namespace IAutoMovieHumanRing {
  /**
   * Position and orientation of a ring, in the model frame and millimetres of the cage.
   *
   * @author Samchon
   */
  export interface IFrame {
    /** Centre of the cut, on the bone axis that crosses it. */
    origin: IAutoMovieVector3;

    /** Unit normal of the cut plane, pointing out of the part through the opening. */
    normal: IAutoMovieVector3;

    /** Unit vector in the cut plane toward the start mark. */
    reference: IAutoMovieVector3;
  }
}
