import type { IAutoMoviePhysicalProfile as P } from "./IAutoMoviePhysicalProfile";

/**
 * Collision carriers and observed frames for geometric motion audits, without claiming a connected massive native articulation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Collision carriers and observed frames for geometric motion audits, without claiming a connected massive native articulation) and documents 4 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Collision carriers and observed frames for geometric motion audits, without claiming a connected massive native articulation: interface of 4 members (`segments`, `joints`, `materials`, `witnesses`); units and frames named in its text: frame, local, radians, metres, newton. Optional members `witnesses` express documented absence, and the ranges its member docs state are left to runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMovieMotionGeometry` in packages/interface/src/physics/IAutoMovieMotionGeometry.ts; its surface is the 4 members listed and the text shows 7 other files naming it, mostly packages/engine (4), test (2), packages/interface (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
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
