/**
 * The trunk's form coefficients: every number that shapes the trunk's level sections beyond the identity's measurements and the skeleton, in one record so they are fitted together and cited together.
 *
 * A level section is two superellipse halves, front and back, joined at the widest point of the section. At each key level the section is placed by how far its back lies behind the vertebral column and where its widest point lies, both as shares of the level's depth, and squared by its exponents. Shares of depth or breadth "toward" a neighbour interpolate linearly between the two measured levels, 0 at the first and 1 at the second.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanTrunkForm {
  /** At the buttock level, where buttock depth, hip breadth and buttock circumference are measured. */
  buttock: IAutoMovieHumanTrunkForm.IMeasured;

  /** Top of the hips, where the hip breadth starts to narrow toward the iliac crest. */
  hip: IAutoMovieHumanTrunkForm.IHip;

  /** At the iliac crest, between the buttock and waist measurements. */
  crest: IAutoMovieHumanTrunkForm.IDerived;

  /** At the natural waist, where waist depth, breadth and circumference are measured. */
  waist: IAutoMovieHumanTrunkForm.IMeasured;

  /** At the costal arch, the underbust level, between the waist and chest measurements, whose girth is the underbust circumference. */
  underbust: IAutoMovieHumanTrunkForm.IUnderbust;

  /** At the chest point, where chest depth, breadth and circumference are measured. */
  chest: IAutoMovieHumanTrunkForm.IMeasured;

  /** At the axilla, from the chest measurements. */
  axilla: IAutoMovieHumanTrunkForm.IDerived;

  /** At the gluteal furrow, below the buttock level, where the trunk divides into the thighs. */
  gluteal: IAutoMovieHumanTrunkForm.IGluteal;
}
export namespace IAutoMovieHumanTrunkForm {
  /**
   * Placement of a level section.
   *
   * @author Samchon
   */
  export interface IPlacement {
    /** Distance of the back's midline behind the vertebral column, as a share of the level's depth, at 15% body fat. */
    behind: number;

    /** Change of `behind` per percentage point of body fat above 15%: the subcutaneous fat over the buttocks and the breasts carries the section's depth behind or ahead of the skeleton. */
    fat: number;

    /** Share of the depth from the back to the front where the section is widest. */
    widest: number;
  }

  /**
   * A level where depth, breadth and circumference are measured: the circumference sets the squareness, so the section's perimeter is the measured girth.
   *
   * @author Samchon
   */
  export interface IMeasured extends IPlacement {
    /** Natural logarithm of the front exponent over the back one; their geometric mean is solved from the girth. */
    skew: number;
  }

  /**
   * A level whose depth and breadth derive from measured neighbours and whose squareness is given.
   *
   * @author Samchon
   */
  export interface IDerived extends IPlacement {
    /** Depth: at the crest a share toward the waist's from the buttock's; at the axilla a ratio to the chest's. */
    depth: number;

    /** Breadth, in the same sense as `depth`. */
    breadth: number;

    /** Exponent of the front half; 2 is an ellipse. */
    front: number;

    /** Exponent of the back half. */
    back: number;
  }

  /**
   * The underbust level: depth and breadth as shares toward the chest's from the waist's, squareness from the underbust circumference.
   *
   * @author Samchon
   */
  export interface IUnderbust extends IMeasured {
    /** Depth as a share toward the chest's from the waist's. */
    depth: number;

    /** Breadth as a share toward the chest's from the waist's. */
    breadth: number;
  }

  /**
   * The top of the hips.
   *
   * @author Samchon
   */
  export interface IHip {
    /** Height as a share of the way from the buttock level to the iliac crest. */
    level: number;

    /** Breadth as a ratio to the hip breadth. */
    breadth: number;
  }

  /**
   * The gluteal furrow's midline, as shares of the buttock depth forward of the buttock level's back.
   *
   * @author Samchon
   */
  export interface IGluteal {
    /** The front of the midline. */
    front: number;

    /** The back of the midline. */
    back: number;
  }
}
