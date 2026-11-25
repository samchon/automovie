import type { IAutoMovieShotContract } from "../production/IAutoMovieShotContract";

/**
 * The shot contract as a registration embeds it, without identity or source
 * pointer.
 *
 * Id and source are removed because the registration owns identity and the
 * compiler owns the pointer: compileDefinedShot restores them as the
 * registration id and a synthetic `<defineShot:id>` module with the same id as
 * export before measuring.
 */
export type IAutoMovieDefinedShotContract = Omit<
  IAutoMovieShotContract,
  "id" | "source"
>;
