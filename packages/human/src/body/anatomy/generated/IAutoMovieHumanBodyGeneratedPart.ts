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
 * @evidence contracts/common.md#principled-implementation Distributing one named record over each id binds id and tissue at the type level.
 * @evidence contracts/common.md#clear-and-simple-design One record type distributed over the six tissue families, including the paired breast glandular owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Connective tissue cannot be labelled bone or muscle.
 * @evidence contracts/common.md#meaningful-documentation States solids, groups and the separate skin.
 * @evidence contracts/modeling.md#part-identity-and-grouping Every named part has one owner and one tissue; groups are not duplicate solids.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The solid type owns geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The solid type owns the frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The skin is a separate output.
 * @evidenceExclude contracts/modeling.md#rendered-observation Consumers display it.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is generated output, not an authoring input.
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
