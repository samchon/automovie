/**
 * Character age or a person's known age at the time of observation.
 *
 * Age is context for model admission and tissue maturation, not a geometric morph weight. Chronological age alone cannot determine muscle mass, fat distribution, breast support or a skin fold for an individual. A model may use it only inside a validated age domain and report its prediction error.
 *
 * @evidence contracts/common.md#principled-implementation Age uses target/observed discrimination with years as context rather than a direct geometric morph parameter.
 * @evidence contracts/common.md#clear-and-simple-design Both age branches share a scalar meaning while preserving fictional versus observed provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Chronological age alone cannot supply individual muscle, adipose, breast-support or skin-fold geometry.
 * @evidence contracts/common.md#meaningful-documentation Comments identify year units, supported runtime range and the need for a validated prediction domain.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Age vocabulary executes no maturation model or population-estimation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Age typing holds no inferred anatomical result requiring cross-request equivalence or invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An age record retains only scalar context, without model state or acquisition resources.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAge =
  | {
      /** Distinguishes fictional age from chronological observation. */
      readonly kind: "target";

      /** Age in years; runtime admission enforces its supported range. */
      readonly years: number;
    }
  | {
      /** Distinguishes fictional age from chronological observation. */
      readonly kind: "observed";

      /** Age in years; runtime admission enforces its supported range. */
      readonly years: number;
    };
