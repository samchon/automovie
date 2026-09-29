import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySmallBoneMeasurements } from "../measurements/IAutoMovieHumanBodySmallBoneMeasurements";

/**
 * Eight anatomically named carpal bones of one wrist, each measured alone.
 *
 * The proximal row meets radius and the distal row meets metacarpals. A
 * single wrist girth never licenses merging their distinct joint surfaces.
 * @author Samchon
 */
export type IAutoMovieHumanBodyCarpusMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Radial proximal carpal. */
    scaphoid?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Central proximal carpal. */
    lunate?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Ulnar proximal carpal. */
    triquetrum?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Sesamoid bone anterior to triquetrum. */
    pisiform?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Distal radial carpal under thumb. */
    trapezium?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Distal carpal beneath index metacarpal. */
    trapezoid?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Central large distal carpal. */
    capitate?: IAutoMovieHumanBodySmallBoneMeasurements;
    /** Distal ulnar carpal. */
    hamate?: IAutoMovieHumanBodySmallBoneMeasurements;
  }>;
