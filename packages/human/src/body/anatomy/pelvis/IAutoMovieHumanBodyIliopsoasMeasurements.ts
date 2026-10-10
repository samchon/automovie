import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";
import type { IAutoMovieHumanBodyIliacusMeasurements } from "./IAutoMovieHumanBodyIliacusMeasurements";
import type { IAutoMovieHumanBodyPsoasMajorMeasurements } from "./IAutoMovieHumanBodyPsoasMajorMeasurements";

/**
 * One side's iliopsoas group with separately owned psoas and iliacus bellies.
 *
 * MOOSE CT labels the combined iliopsoas (labels 9/10), not its two muscle
 * bellies. The optional group volume preserves that observation without
 * inventing a split or copying it into both child muscles; a later resolver
 * must reconcile any independently observed child volumes against this total.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyIliopsoasMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Combined psoas-major and iliacus belly volume, counted once. */
    combinedMuscleVolume?: IAutoMovieHumanBodyAnatomicalVolume;

    /** Lumbar-origin psoas major when independently segmented. */
    psoasMajor?: IAutoMovieHumanBodyPsoasMajorMeasurements;

    /** Iliac-fossa iliacus when independently segmented. */
    iliacus?: IAutoMovieHumanBodyIliacusMeasurements;
  }>;
