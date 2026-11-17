import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/** Data and callback contracts shared by the DerivePhysicalProfile operations. */
export namespace IAutoMovieDerivePhysicalProfile {
  /** All masses are kg and density is kg/m³. */
    export interface IOptions {
      /** Default declared density, not inferred from names. */ density: number;
      /** Per-optical-material density overrides. */ densities: Record<
        string,
        number
      >;
      /** Physical material applied to derived colliders. */ material: string;
      /** Physical contact materials. */ materials: IAutoMoviePhysicalProfile.IMaterial[];
      /** Explicit solver-neutral frames and angular limits replace rig derivation. */ joints?: IAutoMoviePhysicalProfile.IJoint[];
      /** Required when deriving joints from the model's canonical clinical axes and ROM. */
      actuator?: {
        /** Radians per second. */ frequency: number;
        /** Critical-damping ratio. */ dampingRatio: number;
        /** N m per kg of downstream segments. */ torquePerKg: number;
        /** Passive angular decay rate, 1/s; zero by default. */ passiveRate?: number;
      };
      /** Complete per-bone replacements, including imported collision proxies. */ overrides?: Record<
        string,
        IAutoMoviePhysicalProfile.ISegment
      >;
      /** Source and uncertainty of density, collision proxies and joint data. */ provenance: string;
    }
}
