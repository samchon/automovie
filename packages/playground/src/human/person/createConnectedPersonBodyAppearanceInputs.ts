import type { IConnectedPersonInputDescriptor } from "./IConnectedPersonInputDescriptor";

/**
 * List the body's three independent skin appearance intensities through the
 * same person transaction as the numerical catalogue. Their dimensionless
 * interval is the body document's existing renderer contract, not a measured
 * tissue concentration or an anatomical normal range. Source material, UV
 * and vein-layer availability remain the body builder's admission decisions.
 * Removing a value removes its empty record and restores the owner's omitted
 * appearance; no default intensity is invented for an absent layer.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Offers each existing body skin-layer intensity as a person input rather than requiring document JSON editing.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Carries the independent skin layer paths and their documented dimensionless interval through the catalogue transaction.
 * @author Samchon
 */
export function createConnectedPersonBodyAppearanceInputs(): IConnectedPersonInputDescriptor[] {
  return (["skinDetail", "skinTone", "skinVeins"] as const).map((layer) => ({
    path: ["body", layer, "strength"],
    group: "Body skin appearance",
    label: layer.replace(/([a-z])([A-Z])/gu, "$1 $2").toLowerCase() + " intensity",
    unit: "dimensionless intensity",
    minimum: 0,
    maximum: 1,
    step: null,
    ownerDefault: null,
    seed: null,
    omission: "the body owner's unmodified appearance for this layer",
    removable: true,
    qualification: "IAutoMovieHumanBodySkinLayerStrength defines [0,1] as renderer intensity. Source material, UV and layer availability are admitted by the body builder; this is not a physiological measurement.",
  }));
}
