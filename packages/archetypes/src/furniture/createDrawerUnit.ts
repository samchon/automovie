import { type Archetype, ArchetypeDraw } from "../core";
import { StorageMechanisms } from "./StorageMechanisms";
import type { createStorage } from "./createStorage";

/**
 * A chest or filing cabinet with individually sliding drawers.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {ArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A chest or filing cabinet with individually sliding drawers.
 * @evidence contracts/development/implementation.md#principled-implementation Each drawer advances along the cabinet's +Z axis. The chest supplies carried pull grips.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The chest's selected slide owns its travel. The filing cabinet uses its read travel in metres.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three or four drawer assemblies.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createDrawerUnit(
  params: createDrawerUnit.IParams,
  seed?: number | string,
): Archetype<createDrawerUnit.Affordance, createStorage.Dimension> {
  return StorageMechanisms.sliding(
    ArchetypeDraw.choice(
      "storage",
      "kind",
      params.kind,
      createDrawerUnit.KINDS,
    ),
    params,
    seed,
  );
}

/**
 * The authorable settings and local contact IDs of {@link createDrawerUnit}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createDrawerUnit}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createDrawerUnit {
  /** The contact IDs declared by this producer. */
  export type Affordance = "push" | "top" | `drawer${number}` | `pull${number}`;

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createStorage.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  > &
    (
      | {
          /** A chest equipped with one of the recorded slides. */
          kind: "chest";

          /** The read slide choice, drawn from the seed when absent. */
          model?: "3832-E12" | "3832-E14" | "3832-E16";
        }
      | (Pick<createStorage.IParams, "travel"> & {
          /** A full-suspension filing cabinet. */
          kind: "filingCabinet";
        })
    );

  /** Legacy selectors for this construction, in gallery order. */
  export const KINDS: readonly IParams["kind"][] = ["chest", "filingCabinet"];
}
