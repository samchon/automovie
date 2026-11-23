import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/** A body's mass model. One segment's mass point. */
export namespace IAutoMovieResolveCenterOfMass {
  /** A body's mass model. */
  export interface IModel {
    /** Total mass, kilograms. */
    mass: number;

    /** Every segment's mass point. */
    segments: IAutoMovieResolveCenterOfMass.ISegment[];
  }

  /** One segment's mass point. */
  export interface ISegment {
    /** The bone it rides. */
    bone: AutoMovieHumanoidBone;

    /** Kilograms. */
    mass: number;

    /** Centre of mass relative to the bone's joint, in its rest frame, metres. */
    point: IAutoMovieVector3;

    /** Principal moments about the segment's centre, kg m², the profile's own. */
    inertia: IAutoMovieVector3;

    /**
     * The rotation from the principal axes to the bone's rest frame, so a posed
     * segment's axes are its bone's world rotation times this
     * (`resolveAutoMovieMomentum.inertia`).
     */
    axes: IAutoMovieQuaternion;
  }
}
