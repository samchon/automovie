import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Solver-neutral articulated body in SI units, with +Y up. Segment transforms
 * place bone origins in the neutral body frame; inertia and collision geometry
 * use each bone's local frame. Equipment is an additional shape with its own
 * mass, rather than a second overlapping articulated body. Providers own data
 * provenance; Engine admits and consumes the same description for every body.
 */
export interface IAutoMoviePhysicalProfile {
  /** Stable provider/content identity, never used to select physical behavior. */
  id: string;
  /** Total kilograms, including equipment; must equal segment masses. */
  mass: number;
  /** Neutral body-frame centre, metres; checked against the segment sum. */
  centerOfMass: IAutoMovieVector3;
  /** Nonempty unique bones, in any order; joints define a connected tree. */
  segments: IAutoMoviePhysicalProfile.ISegment[];
  /** Exactly one parent for every nonroot segment. */
  joints: IAutoMoviePhysicalProfile.IJoint[];
  /** Explicit overlapping pivot neighbours; other self collisions remain enabled. */
  collisionExclusions?: {
    /** First segment. */ a: string;
    /** Second segment. */ b: string;
    /** Geometric reason for this exclusion. */ reason: string;
  }[];
  /** Contact parameters addressed by shapes, independently of optical materials. */
  materials: IAutoMoviePhysicalProfile.IMaterial[];
  /** Provider's source, population limits and approximation uncertainty. */
  provenance: string;
}

/** Descriptors shared by providers, simulation, audit and inspection. */
export namespace IAutoMoviePhysicalProfile {
  /** Position and orientation of a bone origin, metres and a unit quaternion. */
  export interface ITransform {
    /** Parent/world metre translation, as the containing field specifies. */
    position: IAutoMovieVector3;
    /** Local-to-parent/world orientation. */
    rotation: IAutoMovieQuaternion;
  }
  /** Principal inertia is positive and obeys the rigid-body triangle inequalities. */
  export interface ISegment {
    /** Arbitrary skeleton bone id, not a humanoid vocabulary. */
    bone: string;
    /** Neutral bone origin in the body frame. */
    neutral: ITransform;
    /** Kilograms including all attached equipment. */
    mass: number;
    /** Bone-local metre centre, including equipment. */
    centerOfMass: IAutoMovieVector3;
    /** Principal moments, kg m², about centerOfMass. */
    inertia: IAutoMovieVector3;
    /** Principal-inertia axes in the bone-local frame. */
    inertiaRotation: IAutoMovieQuaternion;
    /** At least one finite solid collider, including optional equipment shapes. */
    shapes: IShape[];
  }
  /** Shape local placement is relative to its segment's bone origin. */
  export type IShape = {
    /** Unique within its segment. */
    id: string;
    /** Reference into the owning profile's materials. */
    material: string;
    /** Bone-local placement. */
    transform: ITransform;
  } & (
    | {
        /** Solid sphere. */ kind: "sphere";
        /** Positive metres. */ radius: number;
      }
    | {
        /** Capsule along local Y. */ kind: "capsule";
        /** Positive metres. */ radius: number;
        /** Nonnegative cylindrical half-length, metres. */ halfLength: number;
      }
    | {
        /** Solid oriented box. */ kind: "box";
        /** Positive local half-extents, metres. */ halfExtents: IAutoMovieVector3;
      }
  );
  /** Angular axis is in the parent joint frame; limits are radians. */
  export interface IAxis {
    /** Unique angular coordinate in the joint frame. */
    axis: "x" | "y" | "z";
    /** Inclusive lower radians, at least -pi. */
    minimum: number;
    /** Inclusive upper radians, at most pi. */
    maximum: number;
    /** PD stiffness in N m/rad. */
    stiffness: number;
    /** PD damping in N m s/rad. */
    damping: number;
    /** Passive joint friction, N m s/rad, retained at zero tracking strength; defaults to zero. */
    passiveDamping?: number;
    /** Positive maximum motor torque, N m. */
    maximumTorque: number;
    /** Provider's authoring coordinate, for honest ROM correspondence. */
    channel: string;
    /** Clinical/source coordinate sign relative to this physical axis; defaults to +1. */
    coordinateSign?: 1 | -1;
    /** Source authoring domain in radians before coordinateSign; physical limits must lie inside it. */
    sourceDomain?: {
      /** Lower source radians. */ minimum: number;
      /** Upper source radians. */ maximum: number;
    };
  }
  /** A fixed joint has no free axes; otherwise each listed axis is limited. */
  export interface IJoint {
    /** Unique profile-local id. */
    id: string;
    /** Parent segment bone. */
    parent: string;
    /** Child segment bone. */
    child: string;
    /** Joint frame in the parent bone's local frame. */
    parentFrame: ITransform;
    /** Same joint frame in the child bone's local frame. */
    childFrame: ITransform;
    /** Distinct free angular axes; all translations and unlisted axes are locked. */
    axes: IAxis[];
  }
  /** Material pair response uses mean friction and restitution. */
  export interface IMaterial {
    /** Nonblank profile-local id. */
    id: string;
    /** Coulomb coefficient in [0,1]. */
    friction: number;
    /** Restitution in [0,1]. */
    restitution: number;
    /** Nonnegative contact compliance, metres per newton; zero is rigid. */
    compliance: number;
    /** Positive soft-layer depth in metres when compliance is nonzero; a rigid core limits compression. */
    maximumCompression?: number;
    /** Nonnegative dissipative contact time constant, seconds. */
    damping: number;
  }
}
