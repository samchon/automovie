import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySmallBoneMeasurements } from "../measurements/IAutoMovieHumanBodySmallBoneMeasurements";

/**
 * One second-through-fifth toe ray with observed phalangeal variation.
 *
 * The enclosing foot supplies toe number and side; the bones are distinct instances even if a generator shares a code path. Fifth-toe biphalangism is a common normal variant in adult radiographs (Ceynowa et al. 2018, doi:10.1007/s00276-018-2027-z); a two-phalange ray cannot also claim a separate middle bone. Missing pattern is unknown, not automatically triphalangeal. Skin toe length cannot independently determine the joint surfaces or phalangeal volumes.
 *
 * @evidence contracts/common.md#principled-implementation The intersected nonempty union excludes a separate middle bone for explicitly biphalangeal lesser toes.
 * @evidence contracts/common.md#clear-and-simple-design Number and side belong to the enclosing foot; each ray keeps independently named bones.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted toe pattern remains unknown and cannot default into a claimed triphalangeal anatomy.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish lesser-toe variants and middle-bone exclusion; the cited adult radiograph study documents biphalangism.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Toe variant typing computes no phalanx segmentation, toe axes or surface reconstruction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The ray union does not coordinate repeated toe-geometry work across sides.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Lesser-toe records acquire no bone meshes, imaging storage or editor tasks.
 * @author Samchon
 */
export type IAutoMovieHumanBodyToeMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Imaging-observed or desired two-/three-phalange arrangement. */
    phalangealPattern?: "biphalangeal" | "triphalangeal";

    /** Same-number metatarsal. */
    metatarsal?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Proximal toe phalanx. */
    proximalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Intermediate lesser-toe phalanx, excluded by a biphalangeal pattern. */
    middlePhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Distal phalanx supporting the nail bed. */
    distalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
  }> &
    (
      | {
          /** Explicit two-phalange lesser-toe arrangement. */
          readonly phalangealPattern: "biphalangeal";

          /** Two-phalange arrangement forbids a separate middle bone. */
          readonly middlePhalanx?: never;
        }
      | {
          /** Three-phalange arrangement when supplied; omission remains unknown. */
          readonly phalangealPattern?: "triphalangeal";

          /** Independently specified middle bone in a compatible lesser-toe ray. */
          readonly middlePhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
        }
    );
