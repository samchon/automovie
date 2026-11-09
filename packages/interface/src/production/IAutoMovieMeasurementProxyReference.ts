import { IAutoMovieGeneratedMeasurementProxy } from "./IAutoMovieGeneratedMeasurementProxy";

/**
 * An explicitly selected projection envelope from registered JSON bytes or a closed generated recipe.
 *
 * @evidence contracts/development/design.md#principled-representation Asset selection declares a JSON path and generated selection carries envelope dimensions inline. The production asset/radius resolver is retired; current bytes, positive dimensions and any derived radius must be established by an explicit host rather than this reference.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The kind union distinguishes external byte ownership from inline builder parameters without duplicating the measurement recipe union.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing bytes and invalid dimensions have no automatic admission or repair through this type. The metadata supplies no appearance-mesh inference, skeletal reach or actor-root distance measurement.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the two ownership paths, exact typed JSON asset reference and generated recipe selection.
 */
export type IAutoMovieMeasurementProxyReference =
  | {
      /** Manifest-owned proxy bytes. */
      kind: "asset";

      /** Exact path of a typed JSON proxy asset in this manifest. */
      asset: string;
    }
  | ({
      /** Compiler-owned deterministic proxy recipe. */
      kind: "generated";
    } & IAutoMovieGeneratedMeasurementProxy);
