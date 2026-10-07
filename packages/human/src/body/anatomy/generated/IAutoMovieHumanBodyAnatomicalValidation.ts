/**
 * Held-out validation a resolved anatomical generator carries.
 *
 * The error is a surface distance to independently observed anatomy, not a
 * volume or landmark fit, and the domain bounds where the generator applies.
 * Runtime admission must refuse nonfinite errors or an empty cohort.
 *
 * @evidence contracts/common.md#principled-implementation Cohort, domain, posture and surface error stay together with the result they qualify.
 * @evidence contracts/common.md#clear-and-simple-design One named record for every resolved part and the skin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Volume or landmark fit cannot stand in for surface error.
 * @evidence contracts/common.md#meaningful-documentation States what each field measures and its unit.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It qualifies a part; it defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Errors are millimetres, stature metres and age years.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It renders nothing.
 * @evidence contracts/anatomy.md#anatomical-source The cohort, population domain and posture of the validating observation are carried with the result.
 * @evidenceExclude contracts/anatomy.md#permitted-range The generator owns admission of its domain.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is not an authoring input.
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
