/**
 * Normalized intensity of one independently selected skin appearance layer.
 * Skin detail, tone and veins each carry their own record; sharing this value
 * shape couples neither their values nor their layer-specific calculations.
 *
 * @evidence contracts/common.md#principled-implementation One scalar selects a layer's normalized appearance intensity within the documented unit interval.
 * @evidence contracts/common.md#clear-and-simple-design Detail, tone and veins reuse the value shape while retaining independent records and calculations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared structure does not couple layer values or replace their separate calculations.
 * @evidence contracts/common.md#meaningful-documentation The prose states dimensionless range and independent layer ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The skin appearance intensity definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The skin appearance intensity type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The skin appearance intensity declaration does not acquire or retain runtime resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinLayerStrength {
  /** Independent selected-layer intensity, dimensionless in [0,1]. */
  strength: number;
}
