import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Type contracts exchanged by AutoMovieHumanCanonicalSolids; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanCanonicalSolids {
  /** One drawn joint at the canonical rest. */
  export interface IJoint {
    /** Parent Human joint, or null at the root. */
    parent: string | null;

    /** The rig bone that carries this joint rigidly. */
    carrier: AutoMovieHumanoidBone;

    /** Rest joint centre, canonical metres. */
    position: IAutoMovieVector3;

    /** Rest tip of a leaf segment, canonical metres. */
    tip: IAutoMovieVector3 | null;

    /** Girth radius, metres. */
    radius: number;
  }

  /** One convex solid of the body. */
  export interface ISolid {
    /** Unique shape id: the module's joint, numbered when the module is cut. */
    id: string;

    /** The rig bone that carries the solid. */
    carrier: AutoMovieHumanoidBone;

    /** The solid's centroid, canonical metres. */
    centre: IAutoMovieVector3;

    /** The hull's points about the centroid, canonical axes, metres. */
    points: IAutoMovieVector3[];

    /** Volume, cubic metres. */
    volume: number;

    /** Principal moments of the uniform solid per unit mass, square metres. */
    inertia: IAutoMovieVector3;

    /** Rotation from the principal frame to the canonical axes. */
    inertiaRotation: IAutoMovieQuaternion;
  }
}
