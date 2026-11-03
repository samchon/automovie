import type { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";
import type { IAutoMovieHumanWebColumn } from "./IAutoMovieHumanWebColumn";

type Vec3 = AutoMovieHumanHandVector.Vec3;

/** A column away from the pinches. */
type Plain = Extract<IAutoMovieHumanWebColumn, { kind: "plain" }>;

/** A web's column down one child: from the crest to the child's section along the web's own separatrix. */
export interface IAutoMovieHumanWebChild {
  /** Phase where it meets the child's section. */
  phi: number;

  /** The point where it meets the child's section, mm. */
  q: Vec3;

  /** The child's inward direction there. */
  d: Vec3;

  /** Unit from the crest toward the child, across the web, along its own column. */
  eta: Vec3;

  /** Unit along the margin from the first pinch toward the second, square to `eta`. */
  xi: Vec3;

  /** Depth of its arrival past the crest, mm. */
  depth: number;

  /** Its point at a depth past the crest, mm. */
  own: (depth: number) => Vec3;

  /** Its vertices from the crest to the section. */
  rows: number[];

  /** The column law beside the web on each side the child has there. */
  beside: IAutoMovieHumanWebChild.IBeside[];
}

export namespace IAutoMovieHumanWebChild {
  /** The column law beside a web on one side of the child. */
  export interface IBeside {
    /** Which side of the web, -1 at the first pinch's side. */
    side: number;

    /** The plain column at a chart distance from the pinch, margin radii. */
    law: (y: number) => Plain;

    /** The greatest chart distance the law serves before the next web's columns, margin radii. */
    reach: number;
  }
}
