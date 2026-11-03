import type { IAutoMovieHumanBindingLimb } from "./IAutoMovieHumanBindingLimb";
import type { IAutoMovieHumanBindingPlane } from "./IAutoMovieHumanBindingPlane";
import type { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * One region of the binding: the bone it owns, and the rules by which that
 * bone's limb is built where they differ from a plain hinge.
 *
 * A region declares only what is its own: its capsule, the end of its
 * segment, the normal and width of its cut, and what else its limb needs once
 * it exists. Every member left out takes the hinge's rule
 * ({@link AutoMovieHumanHingeBinding}), so a region file states its anatomy and
 * nothing it shares. The tree builds each limb from the region that names its
 * bone and knows no region itself.
 *
 * @evidence contracts/common.md#meaningful-documentation States what each member decides and which default it replaces.
 */
export interface IAutoMovieHumanBindingRegion {
  /** The region's name, such as `knee`. */
  name: string;

  /** The Human joints the region owns, by name. */
  bones: RegExp;

  /** Whether the region's limb is a digit told from its neighbours at the knuckle by capsule. */
  digit?: boolean;

  /** The capsule radii of the region's limb; the default is the joint's girth. */
  radii?: (
    input: IAutoMovieHumanBindingRegion.IRadiiInput,
  ) => IAutoMovieHumanBindingRegion.IRadii;

  /** The end of the region's segment, metres; the default is the joint's tip or its child. */
  end?: (
    input: IAutoMovieHumanBindingRegion.IEndInput,
  ) => Math3D.Vector;

  /** The cut's unit normal toward the child; the default is the hinge's. */
  normal?: (
    parent: Math3D.Vector,
    child: Math3D.Vector,
    side: number,
  ) => Math3D.Vector;

  /** The cut before its sectors are read, or null for none; the default is the hinge's. */
  plane?: (
    at: Math3D.Vector,
    normal: Math3D.Vector,
    reach: number,
  ) => IAutoMovieHumanBindingPlane | null;

  /** What else the region's limb needs once it has its parent and cut. */
  attach?: (
    limb: IAutoMovieHumanBindingLimb,
    direction: Math3D.Vector,
    reach: number,
  ) => void;

  /** The limbs a digit of this region is told from beyond its siblings. */
  rivals?: (
    hand: IAutoMovieHumanBindingLimb,
  ) => IAutoMovieHumanBindingLimb[];
}

export namespace IAutoMovieHumanBindingRegion {
  /** What a region reads to set its capsule. */
  export interface IRadiiInput {
    /** The joint's girth radius, metres, at least the least capsule radius. */
    girth: number;

    /** Start of the segment, metres. */
    from: Math3D.Vector;

    /** End of the segment, metres. */
    to: Math3D.Vector;

    /** Skin samples, metres, three numbers each. */
    skin: Float64Array;

    /** Metres per calibration millimetre. */
    scale: number;
  }

  /** A region's capsule. */
  export interface IRadii {
    /** The radius the cut is sized by, metres. */
    radius: number;

    /** Capsule radius at the start, metres. */
    near: number;

    /** Capsule radius at the end, metres. */
    far: number;
  }

  /** What a region reads to place the end of its segment. */
  export interface IEndInput {
    /** The joint's own end: its tip or its child's centre, metres. */
    own: Math3D.Vector;

    /** A joint's centre by name, metres. */
    at: (bone: string) => Math3D.Vector;
  }
}
