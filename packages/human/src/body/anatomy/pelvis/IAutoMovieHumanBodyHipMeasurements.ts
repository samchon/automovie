import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyGluteusMaximusMeasurements } from "./IAutoMovieHumanBodyGluteusMaximusMeasurements";
import type { IAutoMovieHumanBodyGluteusMediusMeasurements } from "./IAutoMovieHumanBodyGluteusMediusMeasurements";
import type { IAutoMovieHumanBodyGluteusMinimusMeasurements } from "./IAutoMovieHumanBodyGluteusMinimusMeasurements";
import type { IAutoMovieHumanBodyIliopsoasMeasurements } from "./IAutoMovieHumanBodyIliopsoasMeasurements";

/**
 * One side's target or observed hip anatomy and separately named tissues.
 *
 * This pelvic-region group owns three gluteal muscles. The femur belongs to
 * the corresponding lower limb, while coxal bone and shared sacrum belong
 * to the enclosing pelvis. Muscles attach across those ownership boundaries;
 * a generator must resolve the bone surfaces and
 * named tendon sites rather than copying them into this group. Omission of a
 * part's measurement permits only a domain-checked prior or an explicit
 * unavailable result. It never means zero bone or zero muscle.
 *
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
