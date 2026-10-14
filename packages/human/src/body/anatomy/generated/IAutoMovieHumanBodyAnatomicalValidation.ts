/**
 * Held-out validation a resolved anatomical generator carries.
 *
 * The error is a surface distance to independently observed anatomy, not a volume or landmark fit, and the domain bounds where the generator applies. Runtime admission must refuse nonfinite errors or an empty cohort.
 *
 * @evidence contracts/common.md#principled-implementation Held-out people, observed age/stature/BMI bounds, posture and mean/p95 surface errors qualify a generator's supported domain.
 * @evidence contracts/common.md#clear-and-simple-design Population/state conditions accompany errors so volume/landmark fits cannot substitute for independently observed 3D surface validity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts BMI implies no composition; filled metadata alone cannot replace finite-error/cohort admission.
 * @evidence contracts/common.md#meaningful-documentation Comments give years/metres/millimetres, inclusive domains, distinct subjects, posture and held-out error meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Validation schemas record observations without computing surface statistics or runtime admission.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Cohort scope identifies evidence without implementing shared evaluation/invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar validation metadata owns no subject files, measurement instruments or active cohort tasks.
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
