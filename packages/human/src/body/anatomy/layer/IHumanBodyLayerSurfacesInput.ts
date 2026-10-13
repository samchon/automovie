import type { IHumanBodyLayerExterior } from "./IHumanBodyLayerExterior";
import type { IAutoMovieHumanBodyLayerThicknessField } from "./IAutoMovieHumanBodyLayerThicknessField";

/**
 * One evaluated body skin and the thickness field that layers it.
 *
 * Positions are the skin's native vertices as the body builder evaluated them, shaped or not, so the same field layers any state of the same skin.
 *
 * @evidence contracts/common.md#principled-implementation Evaluated native metre triples, matching triangles and source-ordinal thickness fields define the same skin whose optional continued exterior supplies exact native origins.
 * @evidence contracts/common.md#clear-and-simple-design The input joins one skin/field while whole-person continuation stays an optional consumer-owned reference.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Continued origin coordinates must equal actual native samples, without independent skin fitting or positional exclusion bands.
 * @evidence contracts/common.md#meaningful-documentation Members explain native coordinates, triangle/field addressing and standalone-versus-person exterior omission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Layer inputs select no normal, offset or ray-casting algorithm themselves.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Matching native order supplies correspondence without completed layer-evaluation caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed skin/field/exterior arrays acquire no ray instrument or construction task.
 * @author Samchon
 */
export interface IHumanBodyLayerSurfacesInput {
  /** Evaluated native skin positions, three metre-valued coordinates per vertex. */
  positions: readonly number[];

  /** The skin's triangles over those vertices. */
  indices: readonly number[];

  /** Thickness field addressed by the same vertex ordinals. */
  field: IAutoMovieHumanBodyLayerThicknessField;

  /** Actual continued exterior and native-origin incidence, when the consumer forms a whole person. Omission reads the standalone body's own skin. Its origin coordinates must equal the native positions supplied here. */
  exterior?: IHumanBodyLayerExterior;
}
