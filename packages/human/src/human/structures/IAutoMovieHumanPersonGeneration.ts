import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanPersonChannelAlias } from "./IAutoMovieHumanPersonChannelAlias";
import type { IAutoMovieHumanPersonEndpointDriver } from "./IAutoMovieHumanPersonEndpointDriver";
import type { IAutoMovieHumanPersonGenerationBand } from "./IAutoMovieHumanPersonGenerationBand";
import type { IAutoMovieHumanPersonHeadShapeSource } from "./IAutoMovieHumanPersonHeadShapeSource";
import type { IAutoMovieHumanPersonHeadSkin } from "./IAutoMovieHumanPersonHeadSkin";

/**
 * One source generation read as one connected skin with a head/body
 * partition, the input of the one-skin person evaluator.
 *
 * `face` and `body` are the two partition views of the same compiled skin:
 * their skin surfaces carry `sourcePartition` records of generation `id`
 * whose sample ids address one table, the face's cells label the head and the
 * body's the rest, and the samples present in both are the registered neck
 * boundary. Each view keeps its own published channels, correctives,
 * landmarks and attached parts (the head partition's channels are the face
 * channels; the body partition's are the body channels). `headSkin` is the
 * generation's one weight map on the head partition; the body view's surface
 * `skin` is the same map on the body partition. Nothing is a runtime clip and
 * no person document value is stored here.
 *
 * @evidence contracts/common.md#principled-implementation The partition views are exactly the generation's head and body cells with shared sample identities, so evaluating them together is evaluating one skin; the one weight map is supplied for both.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the face and body basis formats as partition views and adds only the head rows of the weight map.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The views must share one generation and complementary source coverage; the evaluator verifies that instead of trusting the id.
 * @evidence contracts/common.md#meaningful-documentation States what each field is, which partition owns which channels and that the boundary is registered offline.
 * @evidence contracts/modeling.md#shared-boundaries The neck boundary is the set of samples both views share, registered on source triangles when the generation was compiled.
 * @evidence contracts/modeling.md#part-identity-and-grouping The face view's attached parts and the body view's parts keep their published identities; the generation adds no part.
 * @evidence contracts/modeling.md#spatial-conventions Both views use the shared metre, Y-up, +Z-forward frame of their source.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record defines no channel; the views keep their published ones.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not observed on its own.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record adds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is compiled source data, not a caller input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGeneration {
  /** The source generation id both partition views carry. */
  id: string;

  /** The head partition view: the face basis over the head cells. */
  face: IAutoMovieHumanFaceBasis;

  /** The body partition view: the body basis over the remaining cells. */
  body: IAutoMovieHumanBodyBasis;

  /** The generation's one weight map on the head partition. */
  headSkin: IAutoMovieHumanPersonHeadSkin;

  /**
   * The neck band's cross-partition rows, or omitted for a generation whose
   * channels stop at the partition label.
   */
  band?: IAutoMovieHumanPersonGenerationBand;

  /**
   * Face channels the generation defines once through a body channel, or
   * omitted when the face view keeps all of its own. A person document's face
   * subtree may not state an aliased channel, and a linked population derives
   * none of them.
   */
  aliases?: IAutoMovieHumanPersonChannelAlias[];

  /**
   * Face-view driver channels that apply body endpoints' head, part and
   * landmark rows with the body's gain, or omitted when the face view has none.
   */
  drivers?: IAutoMovieHumanPersonEndpointDriver[];

  /** Actual source-owned numerical head traits, or absent when no such source was authored. */
  headShapeSource?: IAutoMovieHumanPersonHeadShapeSource;
}
