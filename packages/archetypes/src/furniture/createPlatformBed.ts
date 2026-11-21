import { type Archetype, ArchetypeDraw } from "../core";
import { BedConstruction } from "./BedConstruction";
import type { createBed } from "./createBed";

/**
 * A single or double household bed with a lying surface and opposed side seats.
 *
 * @param params The optional identifier, the admitted settings and any fixed dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {ArchetypeRefusal} For a setting this producer cannot admit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A single or double household bed with a lying surface and opposed side seats.
 * @evidence contracts/development/implementation.md#principled-implementation The mattress is supported by a base at the admitted height, with a headboard at negative Z.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Call the corresponding geometry owner with this producer's parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both sizes preserve their measured UK footprints and admit height in metres.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three boxes and three contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The legacy selector calls the same geometry owner and keeps its original draw namespace.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createPlatformBed(
  params: createPlatformBed.IParams,
  seed?: number | string,
): Archetype<createPlatformBed.Affordance, createPlatformBed.Dimension> {
  return BedConstruction.platform(
    ArchetypeDraw.choice("bed", "kind", params.kind, createPlatformBed.KINDS),
    params,
    seed,
  );
}

/**
 * The authorable settings and local contact IDs of {@link createPlatformBed}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The authorable settings and local contact IDs of {@link createPlatformBed}.
 * @evidence contracts/development/design.md#principled-representation The ID union lists this construction's contacts. Dimensions use the inherited units and are checked at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer selects one object or a related set and exposes its own settings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The parameters admit only fields used by a member of this group.
 */
export namespace createPlatformBed {
  /** The `kind` choices this producer admits. */
  export type Kind = "single" | "double";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "height" | "length" | "mass" | "thickness" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "leftSide" | "rightSide" | "surface";

  /** The admitted settings and optional model ID. */
  export interface IParams extends Pick<
    createBed.IParams,
    "id" | "width" | "length" | "height" | "thickness" | "mass"
  > {
    /** The household bed size. */
    kind: Kind;
  }

  /** Legacy selectors for this construction, in gallery order. */
  export const KINDS: readonly IParams["kind"][] = ["single", "double"];
}
