import type { IAutoMoviePhysicalJoint } from "./IAutoMoviePhysicalJoint";
import type { IAutoMoviePhysicalMaterial } from "./IAutoMoviePhysicalMaterial";
import type { IAutoMoviePhysicalSegment } from "./IAutoMoviePhysicalSegment";

/**
 * All masses are kg and density is kg/m³.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains density overrides, physical materials, explicit joint replacement, actuator assumptions and provenance.
 * @evidence contracts/development/design.md#principled-representation Densities use kg/m³; actuator frequency is rad/s and torque scaling N m/kg. Overrides retain canonical segment and joint records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface derivePhysicalProfile uses these provider policies to turn model geometry into the shared physical profile; material ownership remains with the profile.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Explicit joints bypass rig derivation; otherwise actuator policy is required at runtime. Densities and replacement completeness are not inferred from names.
 */
export namespace IAutoMovieDerivePhysicalProfile {
  /**
   * All masses are kg and density is kg/m³.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains density overrides, physical materials, explicit joint replacement, actuator assumptions and provenance.
   * @evidence contracts/development/design.md#principled-representation Densities use kg/m³; actuator frequency is rad/s and torque scaling N m/kg. Overrides retain canonical segment and joint records.
   * @evidence contracts/development/design.md#minimal-and-owned-surface derivePhysicalProfile uses these provider policies to turn model geometry into the shared physical profile; material ownership remains with the profile.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Explicit joints bypass rig derivation; otherwise actuator policy is required at runtime. Densities and replacement completeness are not inferred from names.
   */
  export interface IOptions {
    /** Default declared density, not inferred from names. */ density: number;
    /** Per-optical-material density overrides. */ densities: Record<
      string,
      number
    >;
    /** Physical material applied to derived colliders. */ material: string;
    /** Physical contact materials. */ materials: IAutoMoviePhysicalMaterial[];
    /** Explicit solver-neutral frames and angular limits replace rig derivation. */ joints?: IAutoMoviePhysicalJoint[];
    /** Required when deriving joints from the model's canonical clinical axes and ROM. */
    actuator?: {
      /** Radians per second. */ frequency: number;
      /** Critical-damping ratio. */ dampingRatio: number;
      /** N m per kg of downstream segments. */ torquePerKg: number;
      /** Passive angular decay rate, 1/s; zero by default. */ passiveRate?: number;
    };
    /** Complete per-bone replacements, including imported collision proxies. */ overrides?: Record<
      string,
      IAutoMoviePhysicalSegment
    >;
    /** Source and uncertainty of density, collision proxies and joint data. */ provenance: string;
  }
}
