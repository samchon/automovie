import type { Archetype } from "../core";
import { StorageMechanisms } from "./StorageMechanisms";
import type { createStorage } from "./createStorage";

/**
 * An open bookcase with individually named shelf supports.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {ArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation An open bookcase with individually named shelf supports.
 * @evidence contracts/development/implementation.md#principled-implementation The shelves' placement rectangles stay on the modeled wood surfaces.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The width, depth and height keep the original fixed footprint and model scale.
 * @evidence contracts/development/implementation.md#efficient-algorithms One constant shelf layout.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createBookcase(
  params: createBookcase.IParams = {},
  seed?: number | string,
): Archetype<createBookcase.Affordance, createStorage.Dimension> {
  return StorageMechanisms.bookcase(params, seed);
}

/**
 * The authorable settings and local contact IDs of {@link createBookcase}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createBookcase}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createBookcase {
  /** The contact IDs declared by this producer. */
  export type Affordance = "push" | "top" | `shelf${number}`;

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createStorage.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >;
}
