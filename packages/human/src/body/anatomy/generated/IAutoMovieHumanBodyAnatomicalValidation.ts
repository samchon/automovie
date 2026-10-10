/**
 * Held-out validation a resolved anatomical generator carries.
 *
 * The error is a surface distance to independently observed anatomy, not a
 * volume or landmark fit, and the domain bounds where the generator applies.
 * Runtime admission must refuse nonfinite errors or an empty cohort.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAnatomicalValidation {
  /** Cohort with independently observed anatomy. */
  readonly cohort: string;
  /** Number of distinct people in the held-out evaluation. */
  readonly subjects: number;
  /** Inclusive chronological age domain in years. */
  readonly ageYears: readonly [number, number];
  /** Inclusive standing stature domain in metres. */
  readonly statureMetres: readonly [number, number];
  /** Inclusive BMI domain; not a claim BMI determines composition. */
  readonly bodyMassIndex: readonly [number, number];
  /** Posture in which reference anatomy and error were evaluated. */
  readonly posture: "standing" | "supine" | "prone" | "seated";
  /** Mean surface distance to held-out observed anatomy, millimetres. */
  readonly meanSurfaceErrorMillimetres: number;
  /** 95th-percentile surface distance to held-out observed anatomy, millimetres. */
  readonly p95SurfaceErrorMillimetres: number;
}
