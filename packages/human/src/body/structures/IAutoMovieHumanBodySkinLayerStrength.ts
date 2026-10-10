/**
 * Normalized intensity of one independently selected skin appearance layer.
 * Skin detail, tone and veins each carry their own record; sharing this value
 * shape couples neither their values nor their layer-specific calculations.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinLayerStrength {
  /** Independent selected-layer intensity, dimensionless in [0,1]. */
  strength: number;
}
