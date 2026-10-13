import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed abdominal fat volumes, separate from waist girth.
 *
 * Subcutaneous adipose lies outside the abdominal muscular fascia; visceral adipose lies within the abdominal cavity. Each field denotes a 3D volume over a documented abdominal region, not the area of one L3 CT slice. The shared `region` supplies matching superior/inferior bony boundaries; a later tissue resolver must also check observed posture and segmentation method before combining two observations. Neither alone gives the shape of a belly fold or a contact-compression modulus.
 *
 * @evidence contracts/common.md#principled-implementation A required bony axial region accompanies at least one independently supplied subcutaneous or visceral volume, preserving anatomical compartment and acquisition provenance.
 * @evidence contracts/common.md#clear-and-simple-design One shared region keeps both depot extents aligned while the volume owner defines targets and segmentation observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A single CT slice area or waist girth cannot replace a compartment's three-dimensional volume, boundary shape or contact modulus.
 * @evidence contracts/common.md#meaningful-documentation The prose separates fascial compartment ownership, matching region bounds and unresolved posture/segmentation compatibility.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Depot volume typing performs no CT integration, fascial segmentation or compression estimation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Common axial bounds describe measurement correspondence without sharing completed adipose reconstructions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Abdominal depot metadata owns no image volume, segmentation buffer or compression task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAbdominalAdiposeMeasurements = {
  /** Common axial extent of both optional depots, fixed by bony landmarks. */
  readonly region: {
    /** Bony landmark bounding the region above. */
    readonly superior: "xiphoidProcess" | "lowerCostalMargin";

    /** Bony landmark bounding the region below. */
    readonly inferior: "iliacCrest" | "pelvicInlet";
  };
} & AutoMovieHumanBodyNonemptyMeasurements<{
  /** Adipose outside the abdominal muscular fascia within the named axial region. */
  subcutaneousVolume?: IAutoMovieHumanBodyAnatomicalVolume;

  /** Adipose inside the abdominal cavity over the same axial region. */
  visceralVolume?: IAutoMovieHumanBodyAnatomicalVolume;
}>;
