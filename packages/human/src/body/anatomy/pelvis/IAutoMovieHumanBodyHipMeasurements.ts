import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyGluteusMaximusMeasurements } from "./IAutoMovieHumanBodyGluteusMaximusMeasurements";
import type { IAutoMovieHumanBodyGluteusMediusMeasurements } from "./IAutoMovieHumanBodyGluteusMediusMeasurements";
import type { IAutoMovieHumanBodyGluteusMinimusMeasurements } from "./IAutoMovieHumanBodyGluteusMinimusMeasurements";
import type { IAutoMovieHumanBodyIliopsoasMeasurements } from "./IAutoMovieHumanBodyIliopsoasMeasurements";

/**
 * One side's target or observed hip anatomy and separately named tissues.
 *
 * This pelvic-region group owns three gluteal muscles. The femur belongs to the corresponding lower limb, while coxal bone and shared sacrum belong to the enclosing pelvis. Muscles attach across those ownership boundaries; a generator must resolve the bone surfaces and named tendon sites rather than copying them into this group. Omission of a part's measurement permits only a domain-checked prior or an explicit unavailable result. It never means zero bone or zero muscle.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty hip group independently owns three gluteal muscles and iliopsoas while referencing neighboring skeletal ownership.
 * @evidence contracts/common.md#clear-and-simple-design Coxal/sacral bones stay in pelvis and femur in lower limb; hip fields own muscle quantities only.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent measurements mean unknown rather than zero tissue or permission to duplicate cross-region bones.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains cross-owner attachments, domain-checked inference obligations and independent muscle omission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Hip grouping types execute no cross-region attachment solving or gluteal reconstruction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pelvic hip schema coordinates no cached neighboring-bone resolution work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Hip measurement groups acquire no combined muscle mesh, skeletal buffers or generation tasks.
 * @author Samchon
 */
export type IAutoMovieHumanBodyHipMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Superficial gluteal muscle, the largest of the three. */
    gluteusMaximus?: IAutoMovieHumanBodyGluteusMaximusMeasurements;

    /** Gluteal muscle deep to maximus, inserting on the greater trochanter. */
    gluteusMedius?: IAutoMovieHumanBodyGluteusMediusMeasurements;

    /** Deepest gluteal muscle, inserting on the anterior greater trochanter. */
    gluteusMinimus?: IAutoMovieHumanBodyGluteusMinimusMeasurements;

    /** Lumbar/iliac hip flexors with a separately measured combined CT label. */
    iliopsoas?: IAutoMovieHumanBodyIliopsoasMeasurements;
  }>;
