import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyUnderwearParts } from "../../body/structures/IAutoMovieHumanBodyUnderwearParts";

/**
 * Body source parts retained until Person's final shared-skin material split.
 * The internal recipe stays outside the public serializable Body build record.
 * @author Samchon
 */
export interface IHumanPersonDressedBody {
  /** Body record with its original source geometry and registered fabric material. */
  body: IAutoMovieHumanBodyBuild;

  /** Rest-material garment recipe; absent when the document wears none. */
  garment?: IAutoMovieHumanBodyUnderwearParts;
}
