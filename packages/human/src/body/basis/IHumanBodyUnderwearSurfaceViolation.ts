/** A raw local garment condition; it does not certify global embedding. */
export interface IHumanBodyUnderwearSurfaceViolation {
  /** The original condition whose actual evaluated value failed. */
  condition: "field" | "base-area" | "exterior-direction" | "normal" | "lift-direction" | "offset-path" | "final-area";

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
