import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";
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
 *
 * @evidence contracts/common.md#principled-implementation The type carries only the named, separately measurable quantities of this tissue as target-or-observed records, so any subset is representable and no quantity stands for a surface or a path.
 * @evidence contracts/common.md#clear-and-simple-design One record of named optional quantities and no behaviour.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is data only: it has no special case, foreign mutation or compensating path.
 * @evidence contracts/common.md#meaningful-documentation The comment states which structure the type names, what its quantities do not determine and which neighbouring declarations own the adjacent structures, and each member is described.
 * @evidence contracts/modeling.md#part-identity-and-grouping One declaration stands for one named tissue; the adjacent structures it meets are separate declarations.
 * @evidenceExclude contracts/modeling.md#parameter-channels The members are absolute target or observed quantities, not offsets from a neutral that vary a form, and no product path varies a form from them.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The type states no unit or frame of its own; each value's unit is owned by the measurement type it references.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface or volume.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint that a viewer displays, because no product path reads it.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing itself; scalar admission is `admitHumanBodyAnatomicalMeasurements` and population ranges belong to a component resolver.
 * @evidence contracts/anatomy.md#parametric-authority Every member is a named anatomical measurement or a closed named site, and no member addresses a vertex, curve, strand or patch, so a caller cannot sculpt through it.
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
