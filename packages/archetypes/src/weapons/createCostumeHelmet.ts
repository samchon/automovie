import { type Archetype, ArchetypeDraw } from "../core";
import { ArmourHelmet } from "./ArmourHelmet";
import { CostumeConstruction } from "./CostumeConstruction";
import type { createArmour } from "./createArmour";

/**
 * Worn helmet costume.
 *
 * The piece keeps its existing open, closed or brimmed helmet cavity and is fixed at its wear frame on the head.
 *
 * @param params The scene id and optional measurements and model choice of this costume.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {ArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names this independent costume form and what supports it.
 * @evidence contracts/development/implementation.md#principled-implementation Separates this costume cell generator from the common museum record and optional body fit.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolves the sourced dimensions and invokes the owning hollow-form builder.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createCostumeHelmet(
  params: createCostumeHelmet.IParams,
  seed?: number | string,
): Archetype<createCostumeHelmet.Affordance, createCostumeHelmet.Dimension> {
  const kind: createCostumeHelmet.Kind = ArchetypeDraw.choice(
    "armour",
    "kind",
    params.kind,
    createCostumeHelmet.KINDS,
  );
  return CostumeConstruction(kind, params, seed, ArmourHelmet);
}

/**
 * Authoring options for {@link createCostumeHelmet}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form and names only the profiles sharing its contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createCostumeHelmet {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension =
    | "depth"
    | "height"
    | "mass"
    | "pad"
    | "thickness"
    | "width";

  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "wear";

  /** Accepted profiles sharing this producer's geometry and actor contacts. */
  export const KINDS = ["openHelmet", "closedHelmet", "brimmedHelmet"] as const;

  /** The selected profile within this form. */
  export type Kind = (typeof KINDS)[number];

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createArmour.IParams,
    "id" | "pad" | "thickness" | "measure"
  > {
    /** The profile with the required outline. */
    kind: Kind;
    /** A model from this form's catalogue. */
    model?:
      | "met26453"
      | "met25388"
      | "met23232"
      | "met26508"
      | "met26512"
      | "met21972";
  }
}
