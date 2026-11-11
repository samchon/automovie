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

/**
 * Descriptors shared by providers, simulation, audit and inspection.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Descriptors shared by providers, simulation, audit and inspection) and documents 6 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Descriptors shared by providers, simulation, audit and inspection: companion namespace of 6 members (`ITransform`, `ISegment`, `IShape`, `IAxis`, `IJoint`, `IMaterial`); units and frames named in its text: metres, quaternion, world, metre, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMoviePhysicalProfile` in packages/interface/src/physics/IAutoMoviePhysicalProfile.ts; its surface is the 6 members listed and the text shows 166 other files naming it, mostly packages/engine (85), test (56), packages/human (11), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace IAutoMoviePhysicalProfile {
  /**
   * Position and orientation of a bone origin, metres and a unit quaternion.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Position and orientation of a bone origin, metres and a unit quaternion.
   * @evidence contracts/development/design.md#principled-representation Represents Position and orientation of a bone origin, metres and a unit quaternion: interface of 2 members (`position`, `rotation`); units and frames named in its text: world, metre, local. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `ITransform` in packages/interface/src/physics/IAutoMoviePhysicalProfile.ts; its surface is the 2 members listed and the text shows 149 other files naming it, mostly packages/engine (64), packages/human (42), test (36), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface ITransform {
    /** Parent/world metre translation, as the containing field specifies. */
    position: IAutoMovieVector3;
    /** Local-to-parent/world orientation. */
    rotation: IAutoMovieQuaternion;
  }
  /**
   * Principal inertia is positive and obeys the rigid-body triangle inequalities.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Principal inertia is positive and obeys the rigid-body triangle inequalities.
   * @evidence contracts/development/design.md#principled-representation Represents Principal inertia is positive and obeys the rigid-body triangle inequalities: interface of 7 members (`bone`, `neutral`, `mass`, `centerOfMass`, `inertia`, `inertiaRotation`, ...); units and frames named in its text: frame, kilograms, local, metre. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `ISegment` in packages/interface/src/physics/IAutoMoviePhysicalProfile.ts; its surface is the 7 members listed and the text shows 124 other files naming it, mostly packages/engine (54), test (43), packages/human (18), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
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
  /**
   * Shape local placement is relative to its segment's bone origin.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Shape local placement is relative to its segment's bone origin.
   * @evidence contracts/development/design.md#principled-representation Represents Shape local placement is relative to its segment's bone origin: type alias of 0 members (); units and frames named in its text: local, metres. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IShape` in packages/interface/src/physics/IAutoMoviePhysicalProfile.ts; its surface is the 0 members listed and the text shows 65 other files naming it, mostly packages/human (26), packages/engine (22), test (11), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
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
    | {
        /** Solid convex polytope: the convex hull of its points. */ kind: "hull";
        /** At least four shape-local vertices, metres, not all in one plane; every point is a vertex or lies on the hull's surface, never inside it. */ points: IAutoMovieVector3[];
      }
  );
  /**
   * Angular axis is in the parent joint frame; limits are radians.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Angular axis is in the parent joint frame; limits are radians.
   * @evidence contracts/development/design.md#principled-representation Represents Angular axis is in the parent joint frame; limits are radians: interface of 10 members (`axis`, `minimum`, `maximum`, `stiffness`, `damping`, `passiveDamping`, ...); units and frames named in its text: frame, radians. Optional members `passiveDamping`, `coordinateSign`, `sourceDomain` express documented absence, and the ranges its member docs state are left to runtime validation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAxis` in packages/interface/src/physics/IAutoMoviePhysicalProfile.ts; its surface is the 10 members listed and the text shows 70 other files naming it, mostly packages/human (30), packages/engine (21), test (19), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; 3 optional members (`passiveDamping`, `coordinateSign`, `sourceDomain`) are independent fields rather than alternatives of one another as far as their docs state; it duplicates no type that another owner declares as far as a name search shows.
   */
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
  /**
   * A fixed joint has no free axes; otherwise each listed axis is limited.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: A fixed joint has no free axes; otherwise each listed axis is limited.
   * @evidence contracts/development/design.md#principled-representation Represents A fixed joint has no free axes; otherwise each listed axis is limited: interface of 6 members (`id`, `parent`, `child`, `parentFrame`, `childFrame`, `axes`); units and frames named in its text: local, frame. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IJoint` in packages/interface/src/physics/IAutoMoviePhysicalProfile.ts; its surface is the 6 members listed and the text shows 60 other files naming it, mostly packages/engine (31), packages/human (15), test (14), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
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
  /**
   * Material pair response uses mean friction and restitution.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Material pair response uses mean friction and restitution.
   * @evidence contracts/development/design.md#principled-representation Represents Material pair response uses mean friction and restitution: interface of 6 members (`id`, `friction`, `restitution`, `compliance`, `maximumCompression`, `damping`); units and frames named in its text: local, metres, newton, seconds. Optional members `maximumCompression` express documented absence, and the ranges its member docs state are left to runtime validation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IMaterial` in packages/interface/src/physics/IAutoMoviePhysicalProfile.ts; its surface is the 6 members listed and the text shows 8 other files naming it, mostly packages/engine (7), packages/human (1), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
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
