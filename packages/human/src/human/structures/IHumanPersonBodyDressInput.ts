import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import type { IHumanBodyPreparedBuild } from "../../body/structures/IHumanBodyPreparedBuild";

/**
 * Prepared garment authority and unchanged body before final Person placement.
 * @author Samchon
 */
export interface IHumanPersonBodyDressInput {
  /** The admitted document's compiled rest coverage authority. */
  prepared: IHumanBodyPreparedBuild;

  /** Completed Body whose original source parts still await Person placement. */
  body: IAutoMovieHumanBodyBuild;
}
