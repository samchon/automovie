import type { IHumanBodyLayerExterior } from "./IHumanBodyLayerExterior";
import type { IAutoMovieHumanBodyLayerThicknessField } from "./IAutoMovieHumanBodyLayerThicknessField";

/**
 * One evaluated body skin and the thickness field that layers it.
 *
 * Positions are the skin's native vertices as the body builder evaluated
 * them, shaped or not, so the same field layers any state of the same skin.
 *
 * @author Samchon
 */
export interface IHumanBodyLayerSurfacesInput {
  /** Evaluated native skin positions, three metre-valued coordinates per vertex. */
  positions: readonly number[];

  /** The skin's triangles over those vertices. */
  indices: readonly number[];

  /** Thickness field addressed by the same vertex ordinals. */
  field: IAutoMovieHumanBodyLayerThicknessField;

  /**
   * Actual continued exterior and native-origin incidence, when the consumer
   * forms a whole person. Omission reads the standalone body's own skin.
   * Its origin coordinates must equal the native positions supplied here.
   */
  exterior?: IHumanBodyLayerExterior;
}
