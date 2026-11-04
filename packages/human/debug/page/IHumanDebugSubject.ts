import type { IAutoMovieModel } from "@automovie/interface";
import type { AutoMovieTextureCache } from "@automovie/viewer";

import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";

/**
 * One loaded subject of the page, the whole figure or one piece, in the form the view draws.
 *
 * Both kinds reach the view the same way: surface parts as an engine model in metres and the
 * generating curves as point lists in metres, so every option applies to both alike.
 */
export interface IHumanDebugSubject {
  /**
   * Person alias, piece name (null for the whole figure) and pose name (null for a piece, which
   * has no pose) the subject was loaded for.
   */
  key: { person: string; piece: string | null; pose: string | null };

  /** Surface parts; construction tubes are not among them. */
  model: IAutoMovieModel;

  /** Generating curves in metres, ids in the `human.construction.` namespace. */
  curves: IHumanDebugDocument.ICurve[];

  /** Texture cache primed with the model's carried images, owned by the subject; null for a piece. */
  textures: AutoMovieTextureCache | null;

  /** Producer facts shown as given. */
  provenance: Record<string, unknown>;

  /** The view comparison's part colours, by part name; absent for any other subject. */
  legend?: { label: string; colour: string }[];

  /** Milliseconds the load took. */
  milliseconds: number;
}
