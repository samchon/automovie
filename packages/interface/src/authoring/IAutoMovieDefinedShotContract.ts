import { IAutoMovieShotContract } from "../production/IAutoMovieShotContract";

/**
 * Contract fields embedded in a shot registration rather than its source
 * pointer.
 *
 * `id` and `source` are removed because the registration owns identity and the
 * compiler owns the pointer: `compileDefinedShot` restores them as the
 * registration id and a synthetic `<defineShot:id>` module before measuring.
 *
 * @author Samchon
 */
export type IAutoMovieDefinedShotContract = Omit<
  IAutoMovieShotContract,
  "id" | "source"
>;
