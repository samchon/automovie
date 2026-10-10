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
