import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";
import type { IAutoMovieHumanBodySurfaceArc } from "../measurements/IAutoMovieHumanBodySurfaceArc";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";

/**
 * Target or observed tissue volumes of one breast above the pectoral fascia.
 *
 * Fibroglandular and adipose tissue are separate compartments. A tape bust girth measures the outer chest, not either compartment; pectoralis major is a different muscle underneath and belongs to the shoulder/thorax movement system. Cooper's suspensory ligaments and skin provide support, but neither their 3D paths nor elasticity follows from these two volume readings.
 *
 * Huang et al. (2017, doi:10.1371/journal.pone.0172122) report standing base-width, sternal-notch-to-nipple and nipple-to-fold measurements in 605 Chinese breast-surgery patients, distinguishing unstretched and stretched nipple-to-fold acquisition. That cohort is not a universal physiological reference. This schema separately names a skin-contoured arc and a direct distance; their geometric definitions need not yield the same value. These scalar constraints do not license copying a supine MRI outline or converting a cup size to internal tissue volume.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty breast measurements distinguish fibroglandular/adipose volumes, palpable base width and skin-contoured arcs with shared target/observation provenance.
 * @evidence contracts/common.md#clear-and-simple-design One breast owns tissue compartments and external constraints while common volume/distance/arc types retain acquisition definitions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bust girth, cup size or a supine MRI outline cannot supply independent tissue volumes, standing support paths or elasticity.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish breast tissue from chest-wall fat and direct width from contoured standing skin paths.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Breast quantity typing computes no tissue segmentation, suspensory ligament geometry or standing support solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Independent breast scalars retain no completed standing/supine correspondence result to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This breast input owns no MRI outline, ligament buffers or elasticity simulation.
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
