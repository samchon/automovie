import { IAutoMovieShotContract } from "../production/IAutoMovieShotContract";

/**
 * The shot contract as a registration embeds it, without identity or source
 * pointer.
 *
 * `id` and `source` are removed because the registration owns identity and the
 * compiler owns the pointer: `compileDefinedShot` restores them as the
 * registration id and a synthetic `<defineShot:id>` module before measuring.
 *
 * @evidence contracts/common.md#principled-implementation Derives the type with `Omit` over `IAutoMovieShotContract`, so every other contract field keeps its single definition and documentation, and a field added to the contract reaches registrations without a second edit.
 * @evidence contracts/common.md#clear-and-simple-design A type alias rather than a copied interface, because the registration differs from the full contract only by the two fields another owner supplies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The removed fields are restored from the registration at compile time rather than defaulted, so a registration cannot claim another shot's identity or source module.
 * @evidence contracts/common.md#meaningful-documentation States which two fields are removed, who owns each instead, and the exact values `compileDefinedShot` restores before measurement.
 * @author Samchon
 */
export type IAutoMovieDefinedShotContract = Omit<
  IAutoMovieShotContract,
  "id" | "source"
>;
