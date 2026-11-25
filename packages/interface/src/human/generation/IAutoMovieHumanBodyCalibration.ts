import type { IAutoMovieLoftChain } from "../../construction/IAutoMovieLoftChain";
import type { IAutoMovieLoftContract } from "../../construction/IAutoMovieLoftContract";
import type { IAutoMovieSolidBody } from "../../construction/IAutoMovieSolidBody";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanBranchEvent } from "./IAutoMovieHumanBranchEvent";
import type { IAutoMovieHumanCalibrationBone } from "./IAutoMovieHumanCalibrationBone";
import type { IAutoMovieHumanEyeSeat } from "./IAutoMovieHumanEyeSeat";
import type { IAutoMovieHumanHeadAttachmentLandmarks } from "./IAutoMovieHumanHeadAttachmentLandmarks";
import type { IAutoMovieHumanNailWindow } from "./IAutoMovieHumanNailWindow";
import type { IAutoMovieHumanOralAnatomy } from "./IAutoMovieHumanOralAnatomy";
import type { IAutoMovieHumanSurfaceAppendage } from "./IAutoMovieHumanSurfaceAppendage";
import type { IAutoMovieHumanSurfaceMerge } from "./IAutoMovieHumanSurfaceMerge";
import type { IAutoMovieHumanSurfacePole } from "./IAutoMovieHumanSurfacePole";
import type { IAutoMovieHumanTrunkLandmarks } from "./IAutoMovieHumanTrunkLandmarks";
import type { IAutoMovieHumanDigitNails } from "./hand/IAutoMovieHumanDigitNails";

/**
 * Shared shape coefficients (theta) of the generated body surface.
 *
 * The chains are principal layers fitted from saved Recovery/Hermite sections
 * of a calibration specimen in the registered frame: forward +X, up +Y, lateral
 * +Z, millimetres, floor at y = 0. The generator reads this object and the
 * public parameters only; it never reads reference files.
 *
 * ## Chain tree
 *
 * Chains are joined by {@link IAutoMovieHumanBranchEvent}s. At an event the
 * parent's end section is the contact of several child sections touching at
 * pinch points: a `down` event sits at the parent's bottom with its children
 * below (a crotch, an axilla, the webs between fingers), an `up` event at the
 * parent's top with its children above (an ear rim leaving the head). The
 * parent generates the contact ring once; each child's adjacent end is the arcs
 * of that ring along the parent's phases, so the chains share those vertices. A
 * chain end with no event closes at an {@link IAutoMovieHumanSurfacePole}.
 *
 * Calibration is one stage of the campaign plan: the coefficients first
 * reproduce one specimen, then are replaced by laws in the public inputs
 * identified across all references.
 */
export interface IAutoMovieHumanBodyCalibration {
  /** Achieved stature input of the calibration specimen in mm. */
  stature: number;

  /** All chains of the tree. */
  chains: IAutoMovieLoftChain[];

  /** Branch events, at most one per chain end. */
  events: IAutoMovieHumanBranchEvent[];

  /** Closing points of chain ends without an event. */
  poles: IAutoMovieHumanSurfacePole[];

  /**
   * Anatomical openings cut from the skin by world position, e.g. the eyelid
   * apertures.
   */
  apertures: IAutoMovieHumanLoftAperture[];

  /** Eyeball globes seated behind the eyelid apertures. */
  eyes: IAutoMovieHumanEyeSeat[];

  /**
   * Contracts the body law's pieces broke while building this calibration, each
   * piece degraded to its base (`construction-levels.md`, Totality and
   * diagnostics). The body law creates the list once and every stage that
   * spreads the calibration shares it, so a piece records into it where it
   * degrades; `AutoMovieHuman.generate` carries it into the shape's own
   * diagnostics. A calibration built by hand, as a part viewer's or a test's,
   * may leave it out.
   */
  diagnostics?: IAutoMovieLoftContract.IDiagnostic[];

  /**
   * Chains rooted in a closed loop on another chain's surface (an auricle on
   * the head, a limb on the trunk) instead of sharing a contact ring. Absent
   * means none.
   */
  appendages?: IAutoMovieHumanSurfaceAppendage[];

  /**
   * Solid merges and diffs drawn by the solid tessellation
   * (`AutoMovieHumanBodySurfaceSolids`): each a join's blend published as a
   * chain between a host chain and a part chain. Every chain a merge names is
   * drawn as a trimmed face, not by events or rings. Absent means none.
   */
  merges?: IAutoMovieHumanSurfaceMerge[];

  /**
   * Solids built as bodies of trimmed faces (`AutoMovieSolidBody`): merges onto
   * merged hosts, whose rails cross faces, published with
   * `AutoMovieSolidBody.publish`. Every face is a chain of `chains` (the blends
   * included) and is drawn by the solid tessellation
   * (`AutoMovieHumanBodySurfaceSolids`), not by events or rings. Absent means
   * none.
   */
  bodies?: IAutoMovieSolidBody.IPublished[];

  /**
   * The bind skeleton the limbs were lofted on, placed before any limb skin by
   * `AutoMovieHumanSkeletonLaw`. Absent on a calibration still being built.
   */
  skeleton?: IAutoMovieHumanCalibrationBone[];

  /**
   * The mouth behind the `mouth` aperture: the lips' contact line, the teeth,
   * the cavity's lining and the tongue, placed by `AutoMovieHumanMouth`. Absent
   * on a calibration whose head has no generated mouth.
   */
  mouth?: IAutoMovieHumanOralAnatomy;

  /**
   * The head's landmarks as its construction solved them, so parts placed on
   * the head (hair, garments) attach through landmarks instead of coordinates.
   * Absent on a calibration whose head is not generated.
   */
  head?: IAutoMovieHumanHeadAttachmentLandmarks;

  /**
   * The trunk's landmarks as its solve placed them, left side: the shoulders'
   * arm arc stands on their glenohumeral centre, so the arm and the skeleton
   * stand on the same centre instead of reading one off the skin. Absent on a
   * calibration whose trunk is not generated.
   */
  trunk?: IAutoMovieHumanTrunkLandmarks;

  /**
   * The nail plates, one per digit chain: a window of the digit chain's own
   * surface from the plate's root to its free edge, as wide as the plate
   * (`AutoMovieHumanNailPlate`). The skin's nail parts are that window of the
   * chain lifted by the plate's thickness. Absent on a calibration without
   * digits.
   */
  nails?: IAutoMovieHumanNailWindow[];

  /**
   * Native nail inputs whose original digit face survived the solid tree. Final
   * skin consumes the shared chart, not a second overlapping surface.
   */
  nailSources?: IAutoMovieHumanDigitNails.IPlaced[];
}
