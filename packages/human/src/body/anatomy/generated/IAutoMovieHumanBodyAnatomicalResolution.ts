/**
 * The result of trying to generate a named anatomical component.
 *
 * The current connected exterior skin is insufficient to infer an individual
 * bone, muscle or fat boundary. A caller must therefore distinguish a
 * generated and independently evaluated part from an unavailable one. A
 * population prediction declares its observed age, stature and body-mass
 * range and leave-subject-out geometric error; an output cannot silently
 * extrapolate beyond that domain or turn a study mean into a person's fact.
 * A direct imaged scalar can condition generation but does not itself validate
 * the generated 3D surface. Validation is attached to the generator revision,
 * including the posture in which its surface error was measured. Runtime
 * admission must refuse nonfinite errors or an empty cohort/revision.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAnatomicalResolution<Id extends string, Value> =
  | {
      /** Stable identity of the anatomical part or shared skin. */
      readonly id: Id;
      /** Geometry passed the named validation cohort and domain checks. */
      readonly status: "resolved";
      /** Generated component, never user-authored mesh input. */
      readonly value: Value;
      /** Population prior may remain even when no individual imaging exists. */
      readonly source: "measurement-conditioned" | "population-predicted";
      /** Revision identity of the shape generator evaluated below. */
      readonly generatorRevision: string;
      /** Held-out 3D surface error, not merely volume or landmark fit. */
      readonly validation: {
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
        /** Surface distance to held-out observed anatomy, not a volume fit. */
        readonly meanSurfaceErrorMillimetres: number;
        readonly p95SurfaceErrorMillimetres: number;
      };
    }
  | {
      /** Names the exact part that could not be resolved. */
      readonly id: Id;
      /** No validated individual component was generated. */
      readonly status: "unavailable";
      /** Distinguishes missing input, missing anatomy and domain failure. */
      readonly reason:
        | "missing-anatomical-input"
        | "anatomical-variant-absent"
        | "missing-bone-landmark"
        | "missing-tissue-boundary"
        | "inconsistent-measurements"
        | "acquisition-not-registered"
        | "outside-observed-population"
        | "posture-not-validated"
        | "geometry-not-validated"
        | "contact-not-validated";
    };
