import type { IAutoMoviePhysicalProfile as P } from "./IAutoMoviePhysicalProfile";

/** Collision carriers and observed frames for geometric motion audits, without claiming a connected massive native articulation. */
export interface IAutoMovieMotionGeometry {
  /** Nonempty uniquely named collision carriers; independent carriers are allowed. */
  segments: {
    /** Unique observed bone frame. */ bone: string;
    /** Finite solid envelopes in that frame. */ shapes: P.IShape[];
  }[];
  /** Only actual declared joints are audited; disconnected geometry needs no invented joints. */
  joints: {
    /** Unique joint identity. */ id: string;
    /** Declared parent collision carrier. */ parent: string;
    /** Distinct declared child collision carrier. */ child: string;
    /** Joint frame in the parent carrier. */ parentFrame: P.ITransform;
    /** Matching joint frame in the child carrier. */ childFrame: P.ITransform;
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
    /** Positive metre depth strictly smaller than the solid core radius/half-extent when compliant. */ maximumCompression?: number;
  }[];
  /** Additional uniquely named observed frames, usable by constraints but carrying no collider or native mass. */
  witnesses?: string[];
}
