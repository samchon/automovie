import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

/**
 * The explicit, minimal input of the Human physical mapping: one fixed
 * person's neutral physical segments, the girth, solid and angular
 * coordinates each one carries. A prepared Human skeleton supplies it through
 * `AutoMovieHumanPhysicalSource`; the mapping itself reads nothing else, so it
 * is a pure function of these values and the caller's actuator assumptions.
 */
export interface IAutoMovieHumanPhysicalSource {
  /** Selects the de Leva reference population of the mass and gyration table. */
  sex: "male" | "female";

  /** Physical segments, every parent before its children; `hips` is the root. */
  segments: IAutoMovieHumanPhysicalSource.ISegment[];
}
export namespace IAutoMovieHumanPhysicalSource {
  /** One rigid physical segment at the person's neutral pose. */
  export interface ISegment {
    /** Canonical Human bone id, such as `leftUpperArm`. */
    bone: string;

    /** Nearest physical ancestor, skipping skeletal carriers without a segment; null only for the root. */
    parent: string | null;

    /** World neutral FK placement of the bone's joint, metres. */
    neutral: P.ITransform;

    /** Skin girth radius of the segment leaving the joint, metres; positive. */
    radius: number;

    /** The declared collision solid the segment's mass and inertia are distributed over. */
    solid: ICapsule | IBox;

    /** The joint's authored angular coordinates, at most three; empty for the root. */
    coordinates: ICoordinate[];
  }

  /** A capsule of the segment's girth from its joint to the effective segment end. */
  export interface ICapsule {
    /** Discriminator. */
    kind: "capsule";

    /** World end of the segment's effective axis at neutral, metres. */
    end: IAutoMovieVector3;
  }

  /** A declared rigid box envelope, such as a foot part, in world terms at neutral. */
  export interface IBox {
    /** Discriminator. */
    kind: "box";

    /** World centre, metres. */
    center: IAutoMovieVector3;

    /** World orientation of the box axes. */
    rotation: IAutoMovieQuaternion;

    /** Positive half extents along the box axes, metres. */
    halfExtents: IAutoMovieVector3;
  }

  /** One authored rotational coordinate of a joint. */
  export interface ICoordinate {
    /** Human pose channel path that authors this coordinate. */
    channel: string;

    /** Unit rotation axis of a positive channel value, in the child's neutral parent-relative frame. */
    direction: IAutoMovieVector3;

    /** Clinical range minimum, degrees. */
    minimum: number;

    /** Clinical range maximum, degrees. */
    maximum: number;
  }
}
