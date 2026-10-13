/**
 * Target body mass or an actual scale reading in kilograms.
 *
 * Mass alone does not determine the proportions of bone, muscle and adipose tissue or the exterior volume, so the generator must resolve composition separately with an evaluated population model.
 *
 * @evidence contracts/common.md#principled-implementation Mass distinguishes desired kilograms from scale provenance, leaving tissue composition and exterior volume independently unresolved.
 * @evidence contracts/common.md#clear-and-simple-design One scalar union owns total body mass without embedding compartment estimates or a body mesh.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A scale reading is not split into bone, muscle or adipose by fabricated composition weights.
 * @evidence contracts/common.md#meaningful-documentation Member comments give kilogram units, scale method and unknown uncertainty; prose states mass-to-shape limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Mass typing runs no composition estimator or exterior volume reconstruction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The body-mass union contains no evaluated population model result to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Mass metadata retains no scale device handle, model session or acquisition buffer.
 * @author Samchon
 */
export type IAutoMovieHumanBodyMass =
  | {
      /** Fictional mass target or actual scale provenance. */
      readonly kind: "target";

      /** Total body mass in kilograms; composition is separately owned. */
      readonly kilograms: number;
    }
  | {
      /** Fictional mass target or actual scale provenance. */
      readonly kind: "observed";

      /** Total body mass in kilograms; composition is separately owned. */
      readonly kilograms: number;

      /** Scale acquisition rather than mass inferred from body geometry. */
      readonly method: "scale";

      /** Reported absolute uncertainty in kilograms; unknown when omitted. */
      readonly uncertaintyKilograms?: number;
    };
