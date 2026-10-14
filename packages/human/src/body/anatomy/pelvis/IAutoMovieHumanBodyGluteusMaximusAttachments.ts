import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

type GluteusMaximusOrigin<Side extends AutoMovieHumanBodySide> =
  | {
      /** Anatomical owner of this origin or insertion, retaining the record's side. */
      structure: `${Side}CoxalBone`;

      /** Named attachment region on that resolved owner. */
      site: "posteriorIlium";
    }
  | {
      /** Anatomical owner of this origin or insertion, retaining the record's side. */
      structure: "sacrum";

      /** Named attachment region on that resolved owner. */
      site: "dorsalSurface";
    }
  | {
      /** Anatomical owner of this origin or insertion, retaining the record's side. */
      structure: `${Side}SacrotuberousLigament`;

      /** Named attachment region on that resolved owner. */
      site: "pelvicAttachment";
    };

type GluteusMaximusInsertion<Side extends AutoMovieHumanBodySide> =
  | {
      /** Anatomical owner of this origin or insertion, retaining the record's side. */
      structure: `${Side}Femur`;

      /** Named attachment region on that resolved owner. */
      site: "glutealTuberosity";
    }
  | {
      /** Anatomical owner of this origin or insertion, retaining the record's side. */
      structure: `${Side}IliotibialTract`;

      /** Named attachment region on that resolved owner. */
      site: "proximalTract";
    };

/** One anatomical side's whole record: its origins and insertions never name the other side. */
interface IAutoMovieHumanBodyGluteusMaximusAttachmentsRecord<
  Side extends AutoMovieHumanBodySide,
> {
  /** At least one named pelvic origin in the same anatomical side. */
  readonly origins: readonly [
    GluteusMaximusOrigin<Side>,
    ...GluteusMaximusOrigin<Side>[],
  ];

  /** At least one femoral or iliotibial insertion on that side. */
  readonly insertions: readonly [
    GluteusMaximusInsertion<Side>,
    ...GluteusMaximusInsertion<Side>[],
  ];
}

/**
 * Same-side anatomical origins and insertions of a generated gluteus maximus.
 *
 * Named sites are output relations among the resolved coxal bone, sacrum, femur and fascia. They are never user-supplied XYZ positions. A nearest segmented bone voxel alone cannot identify a tendon attachment.
 *
 * The type distributes over `Side`: a record is wholly one side's, so a union `Side` admits either side's record and never a record that mixes the two.
 *
 * @evidence contracts/common.md#principled-implementation A distributive side conditional produces wholly left or right nonempty attachment records, preventing mixed-side relation combinations.
 * @evidence contracts/common.md#clear-and-simple-design Origin and insertion unions own named structure/site pairs; one record keeps the complete muscle relation on a single side.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named sites are output relations, never user-authored XYZ or automatically inferred tendon footprints from nearby voxels.
 * @evidence contracts/common.md#meaningful-documentation Comments explain side distribution, nonempty relations and named attachment ownership across bone, ligament and fascia.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Maximus attachment typing performs no tendon-footprint detection or nearest-bone search.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The relation schema shares no resolved attachment-position computations between sides.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Attachment references retain only structure/site names, without bone buffers or registration resources.
 * @author Samchon
 */
export type IAutoMovieHumanBodyGluteusMaximusAttachments<
  Side extends AutoMovieHumanBodySide,
> = Side extends AutoMovieHumanBodySide
  ? IAutoMovieHumanBodyGluteusMaximusAttachmentsRecord<Side>
  : never;
