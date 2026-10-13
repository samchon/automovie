import { IAutoMovieShotDefinition } from "./IAutoMovieShotDefinition";

/**
 * One source-level shot registration, as `defineShot` returns it.
 *
 * The export is the artifact: id, staged scene, measurable contract and
 * deterministic builder travel together, so a repository builder binds module
 * path, export name and artifact identity without a second manifest claiming
 * what the source contains. `compileDefinedShot` validates it and turns a
 * blank id, scene or contract beat into a `registration-invalid` diagnostic.
 *
 * @evidence contracts/common.md#principled-implementation Identity is the registration id: `compileDefinedShot` refuses a blank id, scene or contract beat, publishes the shot under this id, and restores the contract's `id` and synthetic `<defineShot:id>` source from it before measuring, while the production source build requires the export's id and canonical contract bytes to equal the design's.
 * @evidence contracts/common.md#clear-and-simple-design Extends `IAutoMovieShotDefinition` with only `id`, the field `defineShot` adds, so scene, contract and builder are declared once and the registration is exactly the definition plus its address.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The id is never derived from the export name or module path, and a mismatch with the design contract is a diagnostic rather than a silent rename.
 * @evidence contracts/common.md#meaningful-documentation States what travels together and why, which function produces and which validates it, the diagnostic for blank identity, and that the compiled artifact takes this exact id.
 * @author Samchon
 */
export interface IAutoMovieDefinedShot<Context = undefined>
  extends IAutoMovieShotDefinition<Context> {
  /**
   * Non-blank stable shot id; the compiled shot and its contract receive this
   * exact identity.
   */
  id: string;
}
