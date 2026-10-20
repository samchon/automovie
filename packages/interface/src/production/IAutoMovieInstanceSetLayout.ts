import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieExplicitInstanceTransform } from "./IAutoMovieExplicitInstanceTransform";

/**
 * Compact deterministic placement law for a general instance set.
 *
 * @evidence contracts/common.md#principled-implementation The closed union selects centered columns and ordered rows, uniform-area disk scatter, route arc-length placement, layered lattice or exact authored local transforms; instanceSlot applies the set heading and anchor except for route XZ coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Each layout arm owns only its placement parameters; count, seed, variation and resolved route snapshot remain with the containing design or compiled set.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Capacity and exact explicit entry count are authoring premises. Building admission checks capacity shortfall when the dimension product is a safe integer and requires at least count explicit entries, while world materialization does not enforce those complete premises. Route regeneration requires a matching finite positive-total-length route and finite sampled positions rather than substituting the set anchor; degenerate sampled segments can still refuse.
 * @evidence contracts/common.md#meaningful-documentation Defines layout axes, meter dimensions, capacity, route reference and jitter, and stable explicit slot ordering; local layouts are turned about the set anchor.
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
    }
  | {
      /** Seeded placement along one named world route. */
      kind: "along-route";

      /** Existing route id. */
      route: string;

      /** Finite non-negative maximum lateral offset from the route centerline in meters. */
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
      /** Source-authored local transform block, placed under the set heading and anchor. */
      kind: "explicit";

      /** One exact entry per declared slot, in stable slot order. */
      transforms: IAutoMovieExplicitInstanceTransform[];
    };
