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
 * Each bone or muscle has one owner and its own volumetric interior. Multiple connected solids may represent a regional cartilage group or separated visceral adipose islands; they are not silently welded across empty space. Connective tissue is not mislabeled bone or muscle. A continuous outer subcutaneous depot is one material region; breast and abdominal readings constrain subregions without double-counting them as duplicate solids. Each breast's fibroglandular region is a separate tissue owner, excluding its adipose subregion and underlying pectoralis muscle. The shared exterior skin is a separate connected output, not an input mesh.
 *
 * @evidence contracts/common.md#principled-implementation Distributed catalogue branches bind bones/muscles/connective/cartilage/fibroglandular/adipose identities to their correct tissue families.
 * @evidence contracts/common.md#clear-and-simple-design One maintained union derives valid part/material pairs while connected skin remains a separate output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Connective tissue cannot answer as bone/muscle, and adipose subregions are not duplicate solids.
 * @evidence contracts/common.md#meaningful-documentation The prose defines separate interiors, disconnected islands and breast/adipose ownership exclusions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Tissue-correlated type branches perform no volumetric meshing or contact computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The generated catalogue union stores no completed part solve or shared request.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Anatomical identity alternatives allocate no tissue mesh or retained generator.
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
