import type { IAutoMovieHeightRule } from "../geometry/IAutoMovieHeightRule";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieExplicitInstanceTransform } from "./IAutoMovieExplicitInstanceTransform";

/** Compact deterministic placement law for a general instance set. */
export type IAutoMovieInstanceSetLayout =
  | {
      /** Rectangular grid. */
      kind: "grid";

      /** Positive integer rows. */
      rows: number;

      /** Positive integer columns; rows times columns must cover count. */
      columns: number;

      /** Positive center-to-center spacing in meters. */
      spacing: {
        /** Distance between adjacent local-X columns. */
        x: number;

        /** Distance between adjacent local-Z rows. */
        z: number;
      };
    }
  | {
      /** Uniform seeded disk scatter. */
      kind: "scatter";

      /** Positive disk radius in meters. */
      radius: number;

      /**
       * Optional world Y law for a terrain disk. Scatter reads this law at the
       * resolved XZ, then adds the anchor Y as an offset. Omission preserves
       * the level disk at the anchor height. World authors admit the complete
       * disk against holes and exclusions before supplying this rule.
       */
      ground?: IAutoMovieHeightRule;
    }
  | {
      /** Seeded placement along one named world route. */
      kind: "along-route";

      /** Existing route id. */
      route: string;

      /**
       * Finite non-negative maximum lateral offset from the route centerline in
       * meters.
       */
      lateralJitter: number;
    }
  | {
      /** Three-dimensional rectangular lattice. */
      kind: "lattice";

      /** Positive integer rows along local Z. */
      rows: number;

      /** Positive integer columns along local X. */
      columns: number;

      /** Positive integer layers along local Y. */
      layers: number;

      /** Positive center-to-center spacing in meters. */
      spacing: IAutoMovieVector3;
    }
  | {
      /**
       * Source-authored local transform block, placed under the set heading and
       * anchor.
       */
      kind: "explicit";

      /** One exact entry per declared slot, in stable slot order. */
      transforms: IAutoMovieExplicitInstanceTransform[];
    };
