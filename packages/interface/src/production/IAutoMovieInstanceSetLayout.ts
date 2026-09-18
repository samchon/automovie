import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieExplicitInstanceTransform } from "./IAutoMovieExplicitInstanceTransform";

/**
 * Compact deterministic placement algorithm for a general instance set.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieInstanceSetLayout` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieInstanceSetLayout` for the narrative intent story design ownership system contract.
 */
export type IAutoMovieInstanceSetLayout =
  | {
      /** Rectangular grid. */
      kind: "grid";

      /** Positive integer rows. */
      rows: number;

      /** Positive integer columns; rows times columns must cover count. */
      columns: number;

      /** Positive center-to-center spacing in meters. */
      spacing: { x: number; z: number };
    }
  | {
      /** Uniform seeded disk scatter. */
      kind: "scatter";

      /** Positive disk radius in meters. */
      radius: number;
    }
  | {
      /** Seeded placement along one named world route. */
      kind: "along-route";

      /** Existing route id. */
      route: string;

      /** Maximum lateral offset from the route centerline in meters. */
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
      /** Source-authored exact transform block. */
      kind: "explicit";

      /** One exact entry per declared slot, in stable slot order. */
      transforms: IAutoMovieExplicitInstanceTransform[];
    };
