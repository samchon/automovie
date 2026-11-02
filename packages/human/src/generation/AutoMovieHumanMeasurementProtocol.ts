/**
 * Geometric addresses for Human's canonical relaxed measurement protocol.
 *
 * These are model conventions, not observations of palpable human landmarks.
 * The owning construction places an address before solving its skin. Readers
 * measure the final assembled skin at that address; no target girth, radius,
 * fitted ratio or solved coefficient belongs in this record. Native reference
 * courses retain their original provenance and are not certified equivalent
 * to this protocol or to ISO and ANSUR measurements.
 */
export namespace AutoMovieHumanMeasurementProtocol {
  /** World millimetres, forward +X, up +Y and anatomical left +Z. */
  export type Vec3 = [number, number, number];

  /** Anatomical side in the model's registered frame. */
  export type Side = "left" | "right";

  /** Measurement addresses, closed to the dimensions this protocol owns. */
  export type Key =
    | "chest" | "underbust" | "waist" | "highHip" | "hip" | "neck" | "neckBase"
    | `${Side}.${"upperArm" | "elbow" | "forearm" | "wrist" | "wristTransition" | "thigh" | "knee" | "calf" | "handCircumference"}`;

  /** A geometric owner may publish only the sites it has actually established. */
  export type ISites = Partial<Record<Key, ISite>>;

  /** A tape address and its explicit modelling premise, without its target. */
  export interface ISite {
    /** Construction responsible for the address before the closure solve. */
    owner: "trunk" | "neck" | "head" | "arm" | "leg" | "hand";

    /** This version intentionally makes no clinical landmark-equivalence claim. */
    basis: "model-convention";

    /** Coordinates describe the generated bind; they must not be reused posed. */
    pose: "bind";

    /** Named geometric rule and its remaining limitations. */
    definition: string;

    /** The operation to perform on the independently emitted final skin. */
    geometry: ISection | IMaximum | ICourse | IPlanePath;
  }

  /** A taut tape is the convex-hull perimeter of this skin section. */
  export interface ISection {
    /** One plane, rather than a search for a convenient neighbouring ring. */
    kind: "section";

    /** Interior component-pick point lying on the measurement plane, mm. */
    origin: Vec3;

    /** Plane normal; readers normalize this finite nonzero direction. */
    normal: Vec3;
  }

  /** Maximum section girth over the complete declared anatomical domain. */
  export interface IMaximum {
    /** Every station in this domain is eligible, including both endpoints. */
    kind: "maximum";

    /** Interior axis address of the domain's first section, mm. */
    start: Vec3;

    /** Interior axis address of its last section, mm. */
    end: Vec3;

    /** Common section normal; the domain must advance along this direction. */
    normal: Vec3;
  }

  /** A physical section frame, without girths, reaches or solved radii. */
  export interface IPlaneStation {
    /** Interior component address in millimetres. */
    origin: Vec3;
    /** Finite nonzero section normal, continuous in sign along the path. */
    normal: Vec3;
    /** Anatomical thumb-side direction, projected within this plane by readers. */
    thumbSide: Vec3;
  }

  /** One shared plane family for wrist minimum and thumb-side surface health. */
  export interface IPlanePath {
    /** Origins interpolate linearly, normals by their shortest spherical arc. */
    kind: "plane-path";
    /** Ordered distinct physical stations, including the exact crease section. */
    stations: IPlaneStation[];
    /** Exact owned crease station ordinal; no inferred stylion offset. */
    crease: number;
  }

  /** A non-planar neck-base course constrained by four owned contacts. */
  export interface ICourse {
    /** Surface course length, distinct from a planar convex-hull perimeter. */
    kind: "course";

    /** Interior reference point for the neck's polar frame, mm. */
    origin: Vec3;

    /** Neck axis, not an inferred global-up direction. */
    normal: Vec3;

    /** Forward frame direction; projected normal to the axis before use. */
    front: Vec3;

    /** Front, left, back and right contacts in increasing polar order, mm. */
    contacts: [Vec3, Vec3, Vec3, Vec3];
  }
}
