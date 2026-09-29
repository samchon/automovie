import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";
import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySurfaceArc } from "../measurements/IAutoMovieHumanBodySurfaceArc";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";

/**
 * Target or observed tissue volumes of one breast above the pectoral fascia.
 *
 * Fibroglandular and adipose tissue are separate compartments. A tape bust
 * girth measures the outer chest, not either compartment; pectoralis major is
 * a different muscle underneath and belongs to the shoulder/thorax movement
 * system. Cooper's suspensory ligaments and skin provide support, but neither
 * their 3D paths nor elasticity follows from these two volume readings.
 * Clinical standing breast anthropometry uses the palpable medial-to-lateral
 * base, sternal notch to nipple, and nipple to inframammary-fold landmarks
 * (Huang et al. 2017, doi:10.1371/journal.pone.0172122). Contoured tape
 * distances are distinct from direct 3D vectors (Oranges et al. 2019,
 * doi:10.21873/invivo.11548). These scalar constraints do not license copying
 * a supine MRI outline or converting a cup size to internal tissue volume.
 * @author Samchon
 */
export type IAutoMovieHumanBodyBreastMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
  /** Glandular and fibrous tissue above pectoral fascia, per one breast. */
  fibroglandularVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  /** This breast's adipose tissue, excluding chest-wall subcutaneous fat. */
  adiposeVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  /** Palpable medial-to-lateral breast base width, not torso chest breadth. */
  baseWidth?: IAutoMovieHumanBodySurfaceDistance;
  /** Skin-contoured path from sternal notch to this side's nipple. */
  sternalNotchToNippleArc?: IAutoMovieHumanBodySurfaceArc;
  /** Unstretched standing skin path from nipple to the lowest fold point. */
  nippleToInframammaryFoldArc?: IAutoMovieHumanBodySurfaceArc;
  }>;
