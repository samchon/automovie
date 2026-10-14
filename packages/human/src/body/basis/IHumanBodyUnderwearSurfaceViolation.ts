/**
 * A raw local garment condition; it does not certify global embedding.
 *
 * @evidence contracts/common.md#principled-implementation Closed condition kind, actual material location, original signed value/unit and explicit cause preserve one failed forward reading.
 * @evidence contracts/common.md#clear-and-simple-design One local violation record handles vertex and face conditions while unavailability remains null rather than a substituted number.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Local condition values cannot certify global embedding or hide failure through normalization or replacement directions.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish material triangle/vertex, meter/area/dimensionless units and unavailable value meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Violation typing computes no field, area or complete lift-path condition.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Failed-reading metadata stores no reusable forward-condition result across candidate meshes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Located scalar failures acquire no mesh buffers, solver history owner or active evaluator.
 * @author Samchon
 */
export interface IHumanBodyUnderwearSurfaceViolation {
  /** The original condition whose actual evaluated value failed. */
  condition:
    | "field"
    | "base-area"
    | "exterior-direction"
    | "normal"
    | "lift-direction"
    | "offset-path"
    | "final-area";

  /** Actual material triangle ordinal, or null for a vertex-normal condition. */
  triangle: number | null;

  /** Actual material vertex when one supplies the failed normal or lift. */
  vertex: number | null;

  /** Original signed value; null means the reading was unavailable. */
  value: number | null;

  /** Actual unit of that value; no normalization hides a failed reading. */
  unit: "metres" | "square-metres" | "dimensionless" | null;

  /** Named numerical or geometrical reason, without a substituted value. */
  reason: string;
}
