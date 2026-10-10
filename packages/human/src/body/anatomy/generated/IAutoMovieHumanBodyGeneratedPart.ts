import type { AutoMovieHumanBodyBoneId } from "../identity/AutoMovieHumanBodyBoneId";
import type { AutoMovieHumanBodyConnectiveTissueId } from "../identity/AutoMovieHumanBodyConnectiveTissueId";
import type { AutoMovieHumanBodyMuscleId } from "../identity/AutoMovieHumanBodyMuscleId";
import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";
import type { IAutoMovieHumanBodyGeneratedMaterialPart } from "./IAutoMovieHumanBodyGeneratedMaterialPart";

type GeneratedMaterialPart<
  Id extends string,
  Tissue extends string,
> = Id extends string
  ? IAutoMovieHumanBodyGeneratedMaterialPart<Id, Tissue>
  : never;

/**
 * A resolved internal anatomical part with material and closed identity.
 *
 * Each bone or muscle has one owner and its own volumetric interior. Multiple
 * connected solids may represent a regional cartilage group or separated
 * visceral adipose islands; they are not silently welded across empty space.
 * Connective tissue is not mislabeled bone or muscle. A continuous outer
 * subcutaneous depot is one material region; breast and abdominal readings
 * constrain subregions without double-counting them as duplicate solids.
 * Each breast's fibroglandular region is a separate tissue owner, excluding
 * its adipose subregion and underlying pectoralis muscle.
 * The shared exterior skin is a separate connected output, not an input mesh.
 * @author Samchon
 */
export type IAutoMovieHumanBodyGeneratedPart =
  | GeneratedMaterialPart<AutoMovieHumanBodyBoneId, "bone">
  | GeneratedMaterialPart<AutoMovieHumanBodyMuscleId, "skeletal-muscle">
  | GeneratedMaterialPart<
      Exclude<
        AutoMovieHumanBodyConnectiveTissueId,
        `${string}CostalCartilages`
      >,
      "fibrous-connective"
    >
  | GeneratedMaterialPart<
      Extract<
        AutoMovieHumanBodyConnectiveTissueId,
        `${string}CostalCartilages`
      >,
      "cartilage"
    >
  | GeneratedMaterialPart<
      `${AutoMovieHumanBodySide}BreastFibroglandular`,
      "fibroglandular"
    >
  | GeneratedMaterialPart<
      "subcutaneousAdipose" | "abdominalVisceralAdipose",
      "adipose"
    >;
