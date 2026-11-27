import type { IAutoMoviePhysicalJoint } from "./IAutoMoviePhysicalJoint";
import type { IAutoMoviePhysicalMaterial } from "./IAutoMoviePhysicalMaterial";
import type { IAutoMoviePhysicalSegment } from "./IAutoMoviePhysicalSegment";

/** All masses are kg and density is kg/m³. */
export namespace IAutoMovieDerivePhysicalProfile {
  /** All masses are kg and density is kg/m³. */
  export interface IOptions {
    /** Default declared density, not inferred from names. */ density: number;
    /** Per-optical-material density overrides. */ densities: Record<
      string,
      number
    >;
    /** Physical material applied to derived colliders. */ material: string;
    /** Physical contact materials. */ materials: IAutoMoviePhysicalMaterial[];
    /** Explicit solver-neutral frames and angular limits replace rig derivation. */ joints?: IAutoMoviePhysicalJoint[];
    /**
     * Required when deriving joints from the model's canonical clinical axes
     * and ROM.
     */
    actuator?: IOptionsActuator;
    /** Complete per-bone replacements, including imported collision proxies. */ overrides?: Record<
      string,
      IAutoMoviePhysicalSegment
    >;
    /** Source and uncertainty of density, collision proxies and joint data. */ provenance: string;
  }

  /** The actuator object of {@link IOptions}. */
  export type IOptionsActuator = {
    /** Radians per second. */ frequency: number;
    /** Critical-damping ratio. */ dampingRatio: number;
    /** N m per kg of downstream segments. */ torquePerKg: number;
    /** Passive angular decay rate, 1/s; zero by default. */ passiveRate?: number;
  };
}
