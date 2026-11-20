import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
} from "../core";
import { STORAGE_MODELS } from "./STORAGE_MODELS";
import { StorageConstruction } from "./StorageConstruction";
import { createStorage } from "./createStorage";

/** The name each kind's model carries. */
const NAMES: Readonly<Record<createStorage.Kind, string>> = {
  wardrobe: "wardrobe",
  chest: "chest of drawers",
  filingCabinet: "filing cabinet",
  locker: "locker",
  bookcase: "bookcase",
};

/** The model-space construction for the selected contact IDs. */
type Builder<Id extends createStorage.Affordance> = ArchetypeBuilder<
  Id,
  createStorage.Dimension
>;

/** Model dimensions in the legacy family's recorded units. */
type Dimensions = Partial<Record<createStorage.Dimension, number>>;

/** Pick the recorded hinge or slide model and use its figures in the saved dimension stream. */
function draw<Id extends createStorage.Affordance>(
  kind: createStorage.Kind,
  params: Omit<createStorage.IParams, "kind">,
  seed?: number | string,
): { builder: Builder<Id>; d: Dimensions } {
  const session: ArchetypeDrawSession<createStorage.Dimension> =
    new ArchetypeDrawSession<createStorage.Dimension>(
      "storage",
      createStorage.UNITS,
      seed,
      params,
    );
  const model: Readonly<Partial<Record<createStorage.Dimension, number>>> =
    session.model<createStorage.Model>(
      "model",
      params.model,
      STORAGE_MODELS[kind],
    ).figures;
  const d: Partial<Record<createStorage.Dimension, number>> = {
    ...session.dimensions(createStorage.BANDS[kind], createStorage.BANDS),
    ...model,
  };
  const builder: Builder<Id> = new ArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: NAMES[kind],
    draw: session,
  });
  return { builder, d };
}

/**
 * Furniture construction selections with hinged, sliding and open storage mechanisms.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Furniture construction selections with hinged, sliding and open storage mechanisms.
 * @evidence contracts/development/design.md#principled-representation Each construction applies the selected variant's coordinate frame and dimensions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Used by the named producers and the legacy selector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shape dispatch is shared between unrelated mechanisms.
 */
export namespace StorageMechanisms {
  /**
   * Build a hinged wardrobe or locker with the matching supported travel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a hinged wardrobe or locker with the matching supported travel.
   * @evidence contracts/development/implementation.md#principled-implementation Draw the stored hinge or cabinet dimensions, then build the appropriate rotating panels with their carried grips.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original wardrobe motions and friction of the steel locker remain associated with their own models.
   * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of frame, shelf and panel parts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function hinged(
    kind: "wardrobe" | "locker",
    params: Omit<createStorage.IParams, "kind">,
    seed?: number | string,
  ): Archetype<
    | "push"
    | "top"
    | `shelf${number}`
    | "leftDoor"
    | "rightDoor"
    | "leftPull"
    | "rightPull"
    | "door",
    createStorage.Dimension
  > {
    const {
      builder,
      d,
    }: ReturnType<
      typeof draw<
        | "push"
        | "top"
        | `shelf${number}`
        | "leftDoor"
        | "rightDoor"
        | "leftPull"
        | "rightPull"
        | "door"
      >
    > = draw<
      | "push"
      | "top"
      | `shelf${number}`
      | "leftDoor"
      | "rightDoor"
      | "leftPull"
      | "rightPull"
      | "door"
    >(kind, params, seed);
    StorageConstruction[kind](builder, d);
    return builder.build(d.mass!, kind === "locker" ? { rests: "steel" } : {});
  }

  /**
   * Build a unit with drawers and carried pull grips.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a unit with drawers and carried pull grips.
   * @evidence contracts/development/implementation.md#principled-implementation Apply the corresponding lengthwise slide to each drawer and its handle together.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the original read chest slide or filing cabinet dimensions and travels in metres.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work is proportional to the three or four drawers.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function sliding(
    kind: "chest" | "filingCabinet",
    params: Omit<createStorage.IParams, "kind">,
    seed?: number | string,
  ): Archetype<
    "push" | "top" | `drawer${number}` | `pull${number}`,
    createStorage.Dimension
  > {
    const {
      builder,
      d,
    }: ReturnType<
      typeof draw<"push" | "top" | `drawer${number}` | `pull${number}`>
    > = draw<"push" | "top" | `drawer${number}` | `pull${number}`>(
      kind,
      params,
      seed,
    );
    StorageConstruction.drawers(builder, d, StorageConstruction.DRAWERS[kind]);
    return builder.build(d.mass!);
  }

  /**
   * Build a bookcase with open, visible shelf supports.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build a bookcase with open, visible shelf supports.
   * @evidence contracts/development/implementation.md#principled-implementation Place each interior support on the visible shelf and keep the external push surface.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the saved dimensions and build the parts before returning the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original open construction and sheet dimensions.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work follows the number of shelves.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The named producer and the historical selector share this construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
   */
  export function bookcase(
    params: Omit<createStorage.IParams, "kind">,
    seed?: number | string,
  ): Archetype<"push" | "top" | `shelf${number}`, createStorage.Dimension> {
    const {
      builder,
      d,
    }: ReturnType<typeof draw<"push" | "top" | `shelf${number}`>> = draw<
      "push" | "top" | `shelf${number}`
    >("bookcase", params, seed);
    StorageConstruction.bookcase(builder, d);
    return builder.build(d.mass!);
  }
}
