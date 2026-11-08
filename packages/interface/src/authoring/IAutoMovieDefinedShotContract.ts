import { IAutoMovieShotContract } from "../production/IAutoMovieShotContract";

/**
 * The shot contract as a registration embeds it, without identity or source pointer.
 *
 * id and source are removed because the registration owns identity and the compiler owns the pointer: compileDefinedShot restores them as the registration id and a synthetic `<defineShot:id>` module with the same id as export before measuring.
 *
 * @evidence contracts/development/design.md#principled-representation Derives the type with `Omit` over `IAutoMovieShotContract`, so every other contract field keeps its single definition and documentation, and a field added to the contract reaches registrations without a second edit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A type alias rather than a copied interface, because the registration differs from the full contract only by the two fields another owner supplies.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The removed fields are restored from the registration at compile time rather than defaulted, so a registration cannot claim another shot's identity or source module.
 * @evidence contracts/development/common.md#meaningful-documentation States which two fields are removed, who owns each instead, and the exact values `compileDefinedShot` restores before measurement.
 */
export type IAutoMovieDefinedShotContract = Omit<
  IAutoMovieShotContract,
  "id" | "source"
>;
