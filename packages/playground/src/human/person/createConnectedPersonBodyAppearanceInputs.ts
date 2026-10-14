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
 * @evidence contracts/common.md#principled-implementation The three existing body layer strength fields use their dimensionless renderer domain and ordinary complete-person transaction, with source layer support admitted by the body owner.
 * @evidence contracts/common.md#clear-and-simple-design This catalogue producer carries scalar appearance metadata while body material/UV/layer validation and person history remain downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Renderer intensity is not tissue concentration or a clinical range, and omission does not invent a default for an unavailable source layer.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies independent layer intensities, renderer-only units/bounds, omission and source support authority.
 * @evidence contracts/performance.md#efficient-algorithms A fixed three-entry map creates three small descriptors and paths; no source material, UV or geometry traversal occurs here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Cheap mutable descriptor records are returned fresh for the current catalogue rather than retained in a cache; shared numerical layer work belongs to the body builder.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No result or native resource is retained by the producer; ordinary descriptors live with the mounted catalogue and leave when its rows/catalogue are replaced or released.
 *
 * @author Samchon
 */
export function createConnectedPersonBodyAppearanceInputs(): IConnectedPersonInputDescriptor[] {
  return (["skinDetail", "skinTone", "skinVeins"] as const).map(
    (
      layer: "skinDetail" | "skinTone" | "skinVeins",
    ): IConnectedPersonInputDescriptor => ({
      path: ["body", layer, "strength"],
      group: "Body skin appearance",
      label:
        layer.replace(/([a-z])([A-Z])/gu, "$1 $2").toLowerCase() + " intensity",
      unit: "dimensionless intensity",
      minimum: 0,
      maximum: 1,
      step: null,
      ownerDefault: null,
      seed: null,
      omission: "the body owner's unmodified appearance for this layer",
      removable: true,
      qualification:
        "IAutoMovieHumanBodySkinLayerStrength defines [0,1] as renderer intensity. Source material, UV and layer availability are admitted by the body builder; this is not a physiological measurement.",
    }),
  );
}
