import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";
import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";

/**
 * Target or observed tissue volumes of one breast above the pectoral fascia.
 *
 * Fibroglandular and adipose tissue are separate compartments. A tape bust
 * girth measures the outer chest, not either compartment; pectoralis major is
 * a different muscle underneath and belongs to the shoulder/thorax movement
 * system. Cooper's suspensory ligaments and skin provide support, but neither
 * their 3D paths nor elasticity follows from these two volume readings.
 * An adult standing breast cannot be reconstructed by copying a supine MRI
 * outline or by exposing a cup-size morph as its tissue volume.
 * @author Samchon
 */
export type IAutoMovieHumanBodyBreastMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
  fibroglandularVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  adiposeVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
