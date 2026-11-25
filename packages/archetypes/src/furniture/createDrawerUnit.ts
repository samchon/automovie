import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { StorageMechanisms } from "./StorageMechanisms";
import type { createStorage } from "./createStorage";

/**
 * A chest or filing cabinet with individually sliding drawers.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createDrawerUnit(
  params: createDrawerUnit.IParams,
  seed?: number,
): AutoMovieArchetype<createDrawerUnit.Affordance, createDrawerUnit.Dimension> {
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

/** The authorable settings and local contact IDs of {@link createDrawerUnit}. */
export namespace createDrawerUnit {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "travel" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "push" | "top" | `drawer${number}` | `pull${number}`;

  /** The admitted settings and optional model ID. */
  export type IParams = IChestParams | IFilingCabinetParams;

  /** The recorded slide models a chest may carry. */
  export type Slide = "3832-E12" | "3832-E14" | "3832-E16";

  /** The settings both drawer units share. */
  export type IBaseParams = Pick<
    createStorage.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >;

  /** A chest equipped with one of the recorded slides. */
  export interface IChestParams extends IBaseParams {
    /** A chest of drawers. */
    kind: "chest";

    /** The read slide choice, drawn from the seed when absent. */
    model?: Slide;
  }

  /** A full-suspension filing cabinet. */
  export interface IFilingCabinetParams
    extends IBaseParams, Pick<createStorage.IParams, "travel"> {
    /** A filing cabinet. */
    kind: "filingCabinet";
  }

  /** Legacy selectors for this construction, in gallery order. */
  export const KINDS: readonly IParams["kind"][] = ["chest", "filingCabinet"];
}
