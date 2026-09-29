import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySmallBoneMeasurements } from "../measurements/IAutoMovieHumanBodySmallBoneMeasurements";

/**
 * Five tarsal bones distal to talus/calcaneus and proximal to metatarsals.
 *
 * Each named observation belongs to one bone. Longitudinal and transverse
 * foot arches are generated relationships, not a vertex height authored here.
 * @author Samchon
 */
export type IAutoMovieHumanBodyMidfootMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Medial bone articulating with talar head. */
    navicular?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Lateral bone articulating with calcaneus. */
    cuboid?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Medial cuneiform under first metatarsal. */
    medialCuneiform?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Intermediate cuneiform under second metatarsal. */
    intermediateCuneiform?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Lateral cuneiform under third metatarsal. */
    lateralCuneiform?: IAutoMovieHumanBodySmallBoneMeasurements;
  }>;
