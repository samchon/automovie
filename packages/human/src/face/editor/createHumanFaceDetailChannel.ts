import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

/**
 * Construct one independently documented scalar channel without admitting geometry.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Keeps numerical authoring channels tied to their anatomical profile and units.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Supplies scalar editing envelopes while leaving coupled geometry admission to the component.
 */
export const createHumanFaceDetailChannel = (
  region: Exclude<
    IAutoMovieHumanFaceDetailChannel["region"],
    "hairLayers" | "skinColour"
  >,
  path: string,
  meaning: string,
  unit: string,
  minimum: number,
  maximum: number,
  step: number,
  effect: string,
): IAutoMovieHumanFaceDetailChannel => ({
  id: `${region}.${path}`,
  region,
  path: path.split("."),
  meaning,
  unit,
  minimum,
  maximum,
  step,
  neutral: "basis",
  effect,
  paired: region === "eye" || region === "cheek" || region === "ear",
  attachment: {
    skin: "live bilateral eye/brow and oral attachments on the shared skin",
    hair: "authored scalp-root guides in head millimetres",
    frame:
      "basis.host: nasion, gonial, gnathion, pogonion, frontal and temporal supports; basis.bindings.eyes: bilateral brow foundation",
    eye: "basis.bindings.eyes: shared skin margin and identity optical centre",
    nose: "basis.bindings.nose: exterior support and shared cavity rims",
    mouth: "basis.bindings.mouth: common vermilion and oral margins",
    tongue:
      "basis.bindings.mouth.lower and jawHinge: observed oral frame with posterior anchoring",
    cheek: "basis.bindings.cheeks: malar, medial, buccal and modiolus anchors",
    cranium:
      "basis.host facial oval: shared forehead, temple and mandibular boundary",
    ear: "resolved temporal skin: embedded pinna root",
    neck: "cranial collar: continuous cervical sections",
    dentition: "basis.bindings.dentition: fixed maxillary frame",
    lowerDentition:
      "basis.bindings.mouth.lower and jawHinge: observed mandibular frame",
    orbits: "recipe.orbits: retained superior-orbit anchors",
    relief: "named supplemental skin supports",
    curves: "named supplemental anatomical curves",
  }[region],
});
