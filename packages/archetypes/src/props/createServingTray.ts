import type { AutoMovieArchetype } from "../core";
import { TrayConstruction } from "./TrayConstruction";
import type { createTray } from "./createTray";

/**
 * A low serving tray with a real floor and side grips at its short ends,
 * a flat-hand hold under its centre and a glass socket on its floor.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A low serving tray with a real floor and side grips at its short ends.
 * @evidence contracts/development/implementation.md#principled-implementation The grips close over the two short side rims. The inside surface is measured up from the bottom box.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Width, depth and height belong to the selected recorded model.
 * @evidence contracts/development/implementation.md#efficient-algorithms Five boxes and five contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createServingTray(
  params: createServingTray.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createServingTray.Affordance,
  createServingTray.Dimension
> {
  return TrayConstruction.servingTray(params, seed);
}

/**
 * The authorable settings and local contact IDs of {@link createServingTray}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createServingTray}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createServingTray {
  /** The `model` choices this producer admits. */
  export type Model = "smorling" | "grilltider" | "smula";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance =
    | "inside"
    | "leftHandle"
    | "rightHandle"
    | "palm"
    | "rest";

  /** The admitted settings and optional model ID. */
  export interface IParams extends Pick<createTray.IParams, "id" | "mass"> {
    /** The recorded serving tray model. The seed selects it when omitted. */
    model?: Model;
  }
}
