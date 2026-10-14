import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

/**
 * Construct one independently documented scalar channel without admitting geometry.
 * The catalogue supplies valid metadata and a dot-separated profile path.
 * Bounds/step describe an editing envelope; paired ownership is eye/ear/cheek.
 *
 * @evidence contracts/common.md#principled-implementation Current catalogue builders supply scalar region/path/units/envelope metadata; dot splitting gives the same profile path consumed by readers/writers, and the explicit region table names its actual source attachment. This factory does not admit metadata or geometry independently.
 * @evidence contracts/common.md#clear-and-simple-design One row constructor centralizes channel identity, pairing and attachment description while individual profile catalogues own scientific meaning and ranges.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neutral basis and paired eye/ear/cheek are declared inheritance/ownership rules, not guessed defaults. Metadata descriptions and scalar bounds are not proof of coupled component validity or anatomical support.
 * @evidence contracts/common.md#meaningful-documentation Prose gives catalogue prerequisite, dot path, editing-versus-geometry scope and pairing; fields carry explicit meaning/unit/effect/attachment rather than an undocumented slider.
 * @evidence contracts/performance.md#efficient-algorithms Path splitting follows its L characters and produces D segments; remaining row/table work is fixed by the current region vocabulary.
 * @evidence contracts/performance.md#reuse-equivalent-work Catalogue definitions use one identity/ownership constructor; each distinct row is built once at catalogue initialization and no geometry/result cache is implemented here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The fresh row/path array transfers to the static catalogue; borrowed strings retain only actual metadata and no renderer/resource/task is acquired.
 */
export const createHumanFaceDetailChannel: (region: Exclude<IAutoMovieHumanFaceDetailChannel["region"], "hairLayers" | "skinColour">, path: string, meaning: string, unit: string, minimum: number, maximum: number, step: number, effect: string) => IAutoMovieHumanFaceDetailChannel = (
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
  }[region],
});
