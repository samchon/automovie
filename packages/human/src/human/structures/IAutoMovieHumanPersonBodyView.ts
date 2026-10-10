import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanPersonGenerationBand } from "./IAutoMovieHumanPersonGenerationBand";

/**
 * The body file of a published person generation: the body partition view of
 * one source generation and the neck band's rows on it, as the offline
 * producer writes them.
 *
 * `body` is an ordinary body basis over the body cells; `band` holds the face
 * rows and continued jaw attachment on the body side of the neck. `id` is the
 * generation id and is the file's first field. The head file of the same
 * generation completes it (`joinHumanPersonGeneration`).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBodyView {
  /** The source generation id; the file's first field. */
  id: string;

  /** The body partition view as a body basis. */
  body: IAutoMovieHumanBodyBasis;

  /** The neck band's rows on the body side. */
  band: IAutoMovieHumanPersonGenerationBand;
}
