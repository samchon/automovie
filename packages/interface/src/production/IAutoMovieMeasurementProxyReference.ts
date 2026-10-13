import { IAutoMovieGeneratedMeasurementProxy } from "./IAutoMovieGeneratedMeasurementProxy";

/**
 * An explicitly selected projection envelope from registered JSON bytes or a closed generated recipe.
 *
 * @evidence contracts/common.md#principled-implementation Asset selection resolves a typed current JSON proxy through provenance and byte identity, while generated selection carries the same admitted positive envelope parameters inline; productionProjectionRadii derives the population radius from either form.
 * @evidence contracts/common.md#clear-and-simple-design The kind union distinguishes external byte ownership from inline builder parameters without duplicating the measurement recipe union.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or malformed proxy assets and non-positive parameters refuse rather than inferring an envelope from appearance geometry; this contract supplies projection dimensions, not skeletal reach or actor-root distance.
 * @evidence contracts/common.md#meaningful-documentation Defines the two ownership paths, exact typed JSON asset reference and generated recipe selection.
 * @author Samchon
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
