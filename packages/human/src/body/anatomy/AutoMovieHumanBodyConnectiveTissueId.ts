import type { AutoMovieHumanBodySide } from "./AutoMovieHumanBodySide";

/**
 * Named nonmuscular connective tissue with its own material region.
 *
 * Costal cartilage is cartilage, while the ligament, fascial tract and
 * aponeurosis are fibrous tissues. A material label is not a bone ID.
 * @author Samchon
 */
export type AutoMovieHumanBodyConnectiveTissueId =
  `${AutoMovieHumanBodySide}${
    | "CostalCartilages"
    | "SacrotuberousLigament"
    | "IliotibialTract"
    | "ExternalObliqueAponeurosis"}`;
