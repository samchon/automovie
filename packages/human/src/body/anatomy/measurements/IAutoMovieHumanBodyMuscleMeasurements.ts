import type { AutoMovieHumanBodyNonemptyMeasurements } from "./AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "./IAutoMovieHumanBodyAnatomicalVolume";
import type { IAutoMovieHumanBodyMuscleFatFraction } from "./IAutoMovieHumanBodyMuscleFatFraction";

/**
 * The two independently measurable scalar properties of one muscle belly.
 *
 * A named anatomical component owns this record. Volume does not define its surface, tendon footprint or strength; Dixon proton-density fat fraction describes composition rather than an extra exterior adipose depot. Either observation can be absent while the other is present.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty record permits independently specified muscle-belly volume and PDFF without conflating their units or provenance.
 * @evidence contracts/common.md#clear-and-simple-design The named muscle component owns both quantities while common measurement types own acquisition definitions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Volume cannot supply tendon footprint or strength, and PDFF cannot be double-counted as exterior fat.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains independent omission, one-belly ownership and the limits of both measured scalars.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Muscle quantity typing performs no belly segmentation, volume summation or mechanical estimation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The muscle record shares schemas rather than computed compartment reconstructions across bellies.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A muscle measurement record retains no segmented mesh, tissue texture or solver resource.
 * @author Samchon
 */
export type IAutoMovieHumanBodyMuscleMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Volume of exactly this one muscle's segmented belly. */
    muscleBellyVolume?: IAutoMovieHumanBodyAnatomicalVolume;

    /** Mean MRI fat-proton fraction within this same muscle belly. */
    protonDensityFatFraction?: IAutoMovieHumanBodyMuscleFatFraction;
  }>;
