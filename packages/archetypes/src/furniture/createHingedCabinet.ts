import { type Archetype, ArchetypeDraw } from "../core";
import { StorageMechanisms } from "./StorageMechanisms";
import type { createStorage } from "./createStorage";

/**
 * A wardrobe with movable leaves or a locker with a resting hinge frame.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {ArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Wardrobe leaves have admitted travel and carry their pulls. The locker has a hinge frame with no admitted travel.
 * @evidence contracts/development/implementation.md#principled-implementation The wardrobe carries its pulls through the admitted angle of each leaf. The locker supplies its resting hinge and interior shelf.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Wardrobe dimensions and hinge options belong to the wardrobe. The locker model owns its footprint.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of panels and handles.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createHingedCabinet(
  params: createHingedCabinet.IParams,
  seed?: number | string,
): Archetype<createHingedCabinet.Affordance, createHingedCabinet.Dimension> {
  return StorageMechanisms.hinged(
    ArchetypeDraw.choice(
      "storage",
      "kind",
      params.kind,
      createHingedCabinet.KINDS,
    ),
    params,
    seed,
  );
}

/**
 * The authorable settings and local contact IDs of {@link createHingedCabinet}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createHingedCabinet}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createHingedCabinet {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension =
    | "depth"
    | "height"
    | "legs"
    | "mass"
    | "pullHeight"
    | "swing"
    | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance =
    | "door"
    | "leftDoor"
    | "leftPull"
    | "push"
    | "rightDoor"
    | "rightPull"
    | "shelf1"
    | "top";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<createStorage.IParams, "id" | "height" | "mass"> &
    (
      | (Pick<createStorage.IParams, "width" | "depth" | "pullHeight"> & {
          /** A wardrobe with its choice of hinge. */
          kind: "wardrobe";

          /** The read hinge angle, drawn from the seed when absent. */
          model?: "CLIP top 95" | "CLIP top 110";
        })
      | (Pick<createStorage.IParams, "legs"> & {
          /** A steel locker with its choice of body size. */
          kind: "locker";

          /** The read width by depth designation in inches, drawn when absent. */
          model?: "12x12" | "12x15" | "12x18" | "15x18" | "18x18" | "18x21";
        })
    );

  /** Legacy selectors for this construction, in gallery order. */
  export const KINDS: readonly IParams["kind"][] = ["wardrobe", "locker"];
}
