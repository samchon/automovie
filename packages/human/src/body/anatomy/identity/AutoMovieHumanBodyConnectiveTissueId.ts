import type { AutoMovieHumanBodySide } from "./AutoMovieHumanBodySide";

/**
 * Named nonmuscular connective tissue with its own material region.
 *
 * Costal cartilage is cartilage, while the ligament, fascial tract and aponeurosis are fibrous tissues. A material label is not a bone ID.
 *
 * @evidence contracts/common.md#principled-implementation Side-qualified costal cartilage, ligament, fascial tract and aponeurosis IDs retain their nonmuscular anatomical ownership.
 * @evidence contracts/common.md#clear-and-simple-design One closed connective vocabulary supplies catalogue tissue pairing without becoming bone identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cartilage and fibrous tissues remain distinct material families rather than mislabeled bone or muscle.
 * @evidence contracts/common.md#meaningful-documentation The prose explains connective material distinctions and independent anatomical identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Connective identity literals choose no tissue boundary or material algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Side-qualified names coordinate no repeated connective-part generation work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The naming union acquires no ligament surface, fascial field or task.
 * @author Samchon
 */
export type AutoMovieHumanBodyConnectiveTissueId = `${AutoMovieHumanBodySide}${
  | "CostalCartilages"
  | "SacrotuberousLigament"
  | "IliotibialTract"
  | "ExternalObliqueAponeurosis"}`;
