import type { IAutoMovieHumanBodyCompleteAnatomicalMeasurements } from "./IAutoMovieHumanBodyCompleteAnatomicalMeasurements";
import type { IAutoMovieHumanBodySimpleAnatomicalTargets } from "./IAutoMovieHumanBodySimpleAnatomicalTargets";

/**
 * Two closed authoring tiers of a parametric body, with no mesh-level input.
 *
 * The simple tier uses a short set of physical targets; a validated estimator
 * can expand it into the detailed tier. The detailed tier can additionally
 * hold side-specific bones, muscles, fat compartments and actual observations.
 * The tiers are alternatives, so a target cannot silently conflict with a
 * separately supplied override of a differently defined girth. Expansion is
 * not yet implemented by the legacy MPFB connected-skin builder.
 * @author Samchon
 */
export type IAutoMovieHumanBodyParametricParameters =
  | {
      readonly tier: "simple";
      readonly targets: IAutoMovieHumanBodySimpleAnatomicalTargets;
    }
  | {
      readonly tier: "detailed";
      readonly targets: IAutoMovieHumanBodyCompleteAnatomicalMeasurements;
    };
