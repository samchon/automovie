import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMoviePhysicalShape } from "./IAutoMoviePhysicalShape";

/**
 * Collision carriers and observed frames for geometric motion audits.
 *
 * AdmitMotionGeometry checks unique carriers, finite solid shapes, material
 * references, unit rotations and declared joint limits. Independent carriers
 * are permitted: this record supplies neither mass nor a connected
 * articulation. An empty joints list therefore has no joint-limit claims.
 * Omitted witnesses means no extra frames; supplied witness names must be
 * unique and distinct from collider carriers. Geometry uses metres and angular
 * limits use radians.
 */
export interface IAutoMovieMotionGeometry {
  /**
   * Nonempty uniquely named collision carriers; independent carriers are
   * allowed.
   */
  segments: {
    /** Unique observed bone frame. */ bone: string;
    /** Finite solid envelopes in that frame. */ shapes: IAutoMoviePhysicalShape[];
  }[];
  /**
   * Only actual declared joints are audited; disconnected geometry needs no
   * invented joints.
   */
  joints: {
    /** Unique joint identity. */ id: string;
    /** Declared parent collision carrier. */ parent: string;
    /** Distinct declared child collision carrier. */ child: string;
    /** Joint frame in the parent carrier. */ parentFrame: IAutoMovieRigidTransform;
    /** Matching joint frame in the child carrier. */ childFrame: IAutoMovieRigidTransform;
    /** Distinct free angular coordinates; omitted coordinates are locked. */ axes: {
      /** Joint-local angular axis. */ axis: "x" | "y" | "z";
      /** Inclusive lower radians, at least -pi. */ minimum: number;
      /** Inclusive upper radians, at most pi. */ maximum: number;
    }[];
  }[];
  /** Compression allowances addressed by the collision shapes. */
  materials: {
    /** Unique material identity referenced by shapes. */ id: string;
    /** Nonnegative metres per newton; zero is rigid. */ compliance: number;
    /**
     * Positive metre depth strictly smaller than the solid core
     * radius/half-extent when compliant.
     */ maximumCompression?: number;
  }[];
  /**
   * Additional uniquely named observed frames, usable by constraints but
   * carrying no collider or native mass.
   */
  witnesses?: string[];
}
