import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A solver-neutral articulated body in SI units, with +Y up.
 *
 * Segment neutral transforms place bone origins in the body frame; inertia and colliders use bone-local frames. Equipment contributes shapes and mass to a segment. validatePhysicalProfile checks finite native-representable physical quantities, unit rotations, positive principal moments satisfying the triangle inequalities, total mass/centre consistency, known materials and a connected acyclic joint tree. It returns diagnostic paths without repairing the input. Providers own the mutable data and its provenance; simulation admission consumes the same description for every body.
 *
 * @evidence contracts/development/design.md#principled-representation Mass, centre of mass, principal inertia and explicit joint/collider frames specify a rigid articulation in kilograms, metres, seconds and radians; the validator checks numerical and cross-record invariants.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Providers, physical simulation and auditing share this canonical description; optical materials and authored anatomical degrees remain separate contracts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Bone names are unrestricted identities rather than a humanoid catalogue, and equipment changes physical mass instead of adding a second overlapping body.
 * @evidence contracts/development/common.md#meaningful-documentation Defines frame ownership, SI units, provider provenance and the validation path and its refusal-only behavior.
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
 * Rigid placement, segment, collider, joint and material contracts of a body profile.
 *
 * @evidence contracts/development/design.md#principled-representation The members retain separate body, bone, joint and shape frames with SI mass, inertia, angle and contact-response units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Providers, physical admission and simulation share these descriptors under their profile owner; geometry-only auditing reuses the relevant shape/frame members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Type-only grouping carries no runtime state or concrete native solver dependency and imposes no humanoid bone vocabulary.
 * @evidence contracts/development/common.md#meaningful-documentation Member comments identify frames, units, validation and optional defaults for each part of the articulated body.
 */
export namespace IAutoMoviePhysicalProfile {
  /**
   * A rigid placement: metre translation and unit-quaternion orientation.
   *
   * The containing field names the reference frame: neutral body, parent bone, child bone or collider carrier. There is no scale or shear. validatePhysicalProfile checks finite native-representable translation and quaternion norm within 1e-6; numerical readers do not normalize the record automatically.
   *
   * @evidence contracts/development/design.md#principled-representation Translation and a unit quaternion represent a rigid transform, with reference frame supplied by its owning field.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Segment, joint and shape placements share this representation without introducing scale that rigid-body consumers cannot use.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A frame mismatch is not repaired by this record, and a non-unit rotation is refused rather than silently normalized.
   * @evidence contracts/development/common.md#meaningful-documentation States metre translation, quaternion premise, field-owned frame and absence of scale.
   */
  export interface ITransform {
    /** Parent/world metre translation, as the containing field specifies. */
    position: IAutoMovieVector3;
    /** Local-to-parent/world orientation. */
    rotation: IAutoMovieQuaternion;
  }
  /**
   * One massive rigid segment and its attached collision geometry.
   *
   * The neutral transform places its bone origin in the body frame. Principal moments about the bone-local centre of mass use kg m²; inertiaRotation places their axes in the bone frame. validatePhysicalProfile requires positive mass and moments, triangle inequalities and at least one admitted shape. Equipment is already included in all segment totals.
   *
   * @evidence contracts/development/design.md#principled-representation A centre of mass, diagonal principal moments and a principal-axis rotation describe arbitrary rigid inertia without assuming the bone axes diagonalize it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Native articulation construction and body-centre calculations read these fields; collider mass is incorporated in the segment rather than counted independently.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The segment uses arbitrary bone identity and explicit measured or derived inertia, without choosing a shape or mass from an anatomical name.
   * @evidence contracts/development/common.md#meaningful-documentation Defines neutral and inertia frames, kilograms, metre centre, kg m² moments and nonempty shapes.
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
   * A finite solid collider placed in its segment's bone frame.
   *
   * A kind discriminator chooses sphere, local-Y capsule, oriented box or convex hull dimensions. The hull is the convex hull of its supplied shape-local points; interior points are refused by physical admission. Every shape references a profile material and has an identity unique within its segment. Dimensions are metres; soft-layer depth must leave a positive solid core.
   *
   * @evidence contracts/development/design.md#principled-representation The closed kind union admits only dimensions needed by each solid while sharing local rigid placement, identity and physical material.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Profile validation, native collider creation and geometric audits consume the same four solid descriptions.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No renderer mesh or arbitrary nonconvex triangle soup is presented as a supported physical solid; hull admission verifies a three-dimensional boundary.
   * @evidence contracts/development/common.md#meaningful-documentation Specifies shape-local coordinates, metre extents, capsule direction, material identity and solid-core obligations.
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
   * One limited angular coordinate in a joint's parent frame.
   *
   * The parent-frame axis is unique within the joint. Physical limits are ordered radians within [-pi, pi]. Motor stiffness and damping are nonnegative, maximum torque positive. Runtime readers use zero passiveDamping and +1 coordinateSign when absent. A supplied sourceDomain describes the provider's pre-sign authoring interval; physical limits must lie inside it after applying the sign. validatePhysicalProfile checks these relationships.
   *
   * @evidence contracts/development/design.md#principled-representation Physical angular limits and torque-control coefficients retain their SI units while channel and coordinateSign link them to a provider's authored coordinate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Motor tracking, passive damping and range auditing share one axis record; optional sourceDomain records only an available provider interval.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A named channel does not invent a range or axis, and omitted sourceDomain makes no claim that the physical limits cover an external clinical range.
   * @evidence contracts/development/common.md#meaningful-documentation Defines frame, radian limits, PD units, optional defaults and source-to-physical sign correspondence.
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
   * A fixed or angularly limited connection between two rigid segments.
   *
   * Parent and child frames describe the same neutral anchor in their respective bone frames. validatePhysicalProfile checks that anchors coincide within 1e-8 metres and that joints form one connected acyclic tree with one parent per nonroot segment. An empty axes list is fixed; translations and all unlisted angular axes are locked.
   *
   * @evidence contracts/development/design.md#principled-representation Explicit frames preserve a common anchor while a list of unique angular axes identifies the only permitted relative freedoms.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Articulation creation and joint-limit audits share the frame pair and axis list without a separate fixed-joint schema.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The joint graph does not infer parentage from names, and an empty axis list never means unconstrained motion.
   * @evidence contracts/development/common.md#meaningful-documentation Defines anchor frames, graph constraints, metre tolerance and locked-axis/empty-list semantics.
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
   * Physical surface response addressed by profile collision shapes.
   *
   * Friction and restitution are unitless coefficients in [0, 1]; the pair response uses their arithmetic means. Compliance is nonnegative metres per newton and damping a nonnegative dissipative time constant in seconds. Nonzero compliance requires a positive maximumCompression smaller than each referencing shape's solid core extent; a rigid material needs no soft depth. validatePhysicalProfile checks numeric ranges and shape-specific core clearance.
   *
   * @evidence contracts/development/design.md#principled-representation Separate compliance, depth and damping distinguish deformable contact response from a rigid collider's geometric extent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contact and native collider creation reference one profile-local material identity independently of optical rendering materials.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A material name never chooses response coefficients; compliance cannot remove the solid core or imply unbounded penetration.
   * @evidence contracts/development/common.md#meaningful-documentation Defines coefficient units, pair combination, required compliant depth and rigid-material omission.
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
