import type { IAutoMovieShotDefinition } from "./IAutoMovieShotDefinition";

/**
 * One source-level shot registration, as `defineShot` returns it.
 *
 * Id, staged scene, measurable contract and builder travel together, so the
 * source boundary can bind module path, export name and artifact identity.
 * compileDefinedShot turns a blank id, scene or contract beat into a
 * registration-invalid diagnostic without invoking the builder.
 */
export interface IAutoMovieDefinedShot<
  Context = undefined,
> extends IAutoMovieShotDefinition<Context> {
  /**
   * Non-blank stable shot id; the compiled shot and its contract receive this
   * exact identity.
   */
  id: string;
}
