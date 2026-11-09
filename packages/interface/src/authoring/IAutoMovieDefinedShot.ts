import { IAutoMovieShotDefinition } from "./IAutoMovieShotDefinition";

/**
 * One source-level shot registration, as `defineShot` returns it.
 *
 * Id, staged scene, measurable contract and builder travel together, so the source boundary can bind module path, export name and artifact identity. compileDefinedShot turns a blank id, scene or contract beat into a registration-invalid diagnostic without invoking the builder.
 *
 * @evidence contracts/development/design.md#principled-representation Identity is the registration id: `compileDefinedShot` refuses a blank id, scene or contract beat, publishes the shot under this id, and restores the contract's `id` and synthetic `<defineShot:id>` source from it before measuring, while the production source build requires the export's id and canonical contract bytes to equal the design's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Extends `IAutoMovieShotDefinition` with only `id`, the field `defineShot` adds, so scene, contract and builder are declared once and the registration is exactly the definition plus its address.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The id is never derived from the export name or module path, and a mismatch with the design contract is a diagnostic rather than a silent rename.
 * @evidence contracts/development/common.md#meaningful-documentation States what travels together and why, which function produces and which validates it, the diagnostic for blank identity, and that the compiled artifact takes this exact id.
 */
export interface IAutoMovieDefinedShot<
  Context = undefined,
> extends IAutoMovieShotDefinition<Context> {
  /**
   * Non-blank stable shot id; the compiled shot and its contract receive this exact identity.
   */
  id: string;
}
