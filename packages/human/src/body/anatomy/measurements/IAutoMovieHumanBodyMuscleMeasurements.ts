import type { AutoMovieHumanBodyNonemptyMeasurements } from "./AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "./IAutoMovieHumanBodyAnatomicalVolume";
import type { IAutoMovieHumanBodyMuscleFatFraction } from "./IAutoMovieHumanBodyMuscleFatFraction";

/**
 * The two independently measurable scalar properties of one muscle belly.
 *
 * A named anatomical component owns this record. Volume does not define its
 * surface, tendon footprint or strength; Dixon proton-density fat fraction
 * describes composition rather than an extra exterior adipose depot.
 * Either observation can be absent while the other is present.
 * @author Samchon
 */
export type IAutoMovieHumanBodyMuscleMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Volume of exactly this one muscle's segmented belly. */
    muscleBellyVolume?: IAutoMovieHumanBodyAnatomicalVolume;
    /** Mean MRI fat-proton fraction within this same muscle belly. */
    protonDensityFatFraction?: IAutoMovieHumanBodyMuscleFatFraction;
  }>;
