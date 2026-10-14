import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed dimensions of one os coxae (ilium, ischium and pubis).
 *
 * A coxal bone is a pelvic component, not a second copy inside each hip. Its acetabulum receives the femoral head; its posterior ilium carries gluteal origins. A measured volume or acetabular diameter does not reconstruct its 3D surface or establish a tendon attachment. The latter requires an independently resolved bone shape and named landmarks. No user-authored vertex or contour is part of this measurement contract.
 *
 * Terminology: FIPAT Terminologia Anatomica 1998, A02.5.01.001, os coxae (hip bone).
 *
 * @evidence contracts/common.md#principled-implementation A nonempty coxal record permits bone volume or acetabular diameter with their separate quantity/provenance contracts.
 * @evidence contracts/common.md#clear-and-simple-design Each os coxae has one pelvic owner; hip attachment consumers reference rather than duplicate it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Volume or diameter cannot replace independently resolved surfaces or tendon landmarks, and no authored vertex input is admitted.
 * @evidence contracts/common.md#meaningful-documentation Prose defines ilium/ischium/pubis ownership, acetabulum and attachment limits; members distinguish bone-only volume from diameter.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Coxal measurement typing executes no acetabular surface fitting or pelvic mesh integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The coxal record holds no completed landmark fit for reuse across hip consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Coxal scalar metadata retains no pelvic segmentation, surface buffers or registration handles.
 * @author Samchon
 */
export type IAutoMovieHumanBodyCoxalBoneMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Segmented volume of this one bone, excluding the opposite side. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;

    /** Diameter of its articular acetabulum, independent of the femoral head. */
    acetabularDiameter?: IAutoMovieHumanBodyAnatomicalLength;
  }>;
