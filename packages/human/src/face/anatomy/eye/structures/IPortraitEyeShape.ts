import type { IPortraitEyebrowProfile } from "../../brow/IPortraitEyebrowProfile";
import type { IPortraitEyelashProfile } from "../../lash/IPortraitEyelashProfile";
import type { IPortraitAegyoSalShape } from "./IPortraitAegyoSalShape";
import type { IPortraitIrisPigment } from "./IPortraitIrisPigment";
import type { IPortraitLowerLidProfile } from "./IPortraitLowerLidProfile";
import type { IPortraitOcularTissueShape } from "./IPortraitOcularTissueShape";
import type { IPortraitUpperLidProfile } from "./IPortraitUpperLidProfile";

/**
 * Numerical eye shape independent of its host socket. Lengths are millimetres;
 * width/opening multipliers deform the fitted aperture, not an isolated eyeball.
 *
 *
 * @evidence contracts/common.md#principled-implementation Independent metric authoring controls separate shaped aperture, optical identity, tissue profiles and tessellation.
 * @evidence contracts/common.md#clear-and-simple-design resolvePortraitEyeInputs owns compatibility/copied consumed profiles while fit/contact/finish own host feasibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional modes are explicit current contracts; no positive dimension or local scalar check implies acquired anatomy or complete clearance.
 * @evidence contracts/common.md#meaningful-documentation Fields give millimetres, optional fallback meanings, gaze-independent identity, sampling roles and physical inspection limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitEyeShape is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitEyeShape declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitEyeShape acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IPortraitEyeShape {
  /** Multiplier of the socket aperture width; one retains its measured width. */
  widthScale: number;

  /** Multiplier of aperture height; one retains the measured opening. */
  openingScale: number;

  /** Upward outer-corner displacement, fading towards the inner corner, in mm. */
  outerCornerLift: number;

  /** Socket translation along the recorded camera ray, in mm. */
  socketLift: number;

  /**
   * Independent globe translation along the normalized observation ray, in mm.
   * Positive advances the optical body toward that camera; negative recesses
   * it. Outer skin attachment targets do not translate with it; shared skin
   * refinement and final contact still settle the emitted surface. Omission
   * and zero preserve the fitted globe. This is an
   * identity depth control, not gaze, blink or a measured clinical displacement.
   */
  globeLift?: number;

  /** Geodesic reach of surrounding skin adaptation, in mm. */
  blendReach: number;

  /**
   * Optional surrounding-skin reservation. Reserve cuts a containing host patch
   * before installing the lid rows and connects its unchanged outer boundary
   * through a shared annulus. Omission retains the original boundary-deformation
   * path. This changes attachment topology, not the eye's optical dimensions.
   */
  skinAttachment?: "reserve";

  /** Sample original skin at each reserved bridge triangle's interior before subdivision; omission preserves the original boundary-only annulus. */
  skinBridge?: "sampled";

  /** Upper lid fold width, in mm. */
  foldWidth: number;

  /** Upper crease depth behind the lid ridge, in mm. */
  foldDepth: number;

  /** Additional upper tarsal volume in front of the aperture plane, in mm. */
  upperLidVolume: number;

  /**
   * Optional complete upper tissue sections, ordered medial to lateral. These
   * replace basic fold/volume rows within the canthal sine fade; they do not
   * add a second relief layer. Omission preserves the original upper formula.
   */
  upperLidProfile?: IPortraitUpperLidProfile;

  /** Width of the lower eyelid's soft-tissue transition, in mm. */
  lowerLidWidth: number;

  /** Peak lower-lid roll projection, in mm; independent of the upper fold. */
  lowerLidVolume: number;

  /**
   * Optional complete lower-tissue sections, ordered medial to lateral. The
   * section owns pretarsal body, subtarsal boundary and preseptal transition.
   * A sine fade blends it to the basic canthi; omission is the exact basic row
   * formula. Ocular contact owns its inner support; a separate final check
   * resolves residual penetration after shared refinement and surface layers.
   */
  lowerLidProfile?: IPortraitLowerLidProfile;

  /**
   * Optional grouped pretarsal roll relief immediately below the lashes.
   * Omission preserves the eyelid-only construction; when supplied, the eye
   * component replaces its lower profile's competing rows with one continuous
   * rounded crest and a short lower shoulder.
   */
  aegyoSal?: IPortraitAegyoSalShape;

  /** Forward projection of the inner lid margin, in mm. */
  lidThickness: number;

  /** Optical globe radius in mm; fitted in the declared basis independently of gaze. */
  surfaceRadius: number;

  /**
   * Depth-fitting direction for the spherical cap. Omission/aperture-plane
   * preserves the canthal-plane fit. Observation-ray keeps the reference rim
   * mean's image position when fitting centre depth. With tangent canthal
   * support, the fixed canthal midpoint instead anchors that image position.
   * Neither fit recovers an anatomical globe centre. Current gaze and blink
   * do not choose this mode.
   */
  sphereFit?: "aperture-plane" | "observation-ray";

  /**
   * Optional fixed canthal connective support. Tangent uses the declared
   * surfaceRadius for the optical globe and joins separately fixed observed
   * canthi to its sampled convex surface. Its depth fit uses only supported
   * rim rays and preserves visible canthi; it does not enlarge the globe to
   * span every canthus. Requires observation-ray fitting and radial optics.
   * The same identity surface supplies drawing and contact through expression.
   */
  canthalSupport?: "tangent";

  /**
   * Iris/cornea frame. Omission or head-plane preserves the original XY height
   * field. Radial authors both layers around the globe-to-iris axis, with
   * unchanged local radii and thickness. Requires full limbus and corneal
   * contact, and keeps a complete globe even without expression performance.
   */
  opticalFrame?: "head-plane" | "radial";

  /** Corneal curvature radius in mm; greater than iris radius and no greater than globe radius. */
  cornealRadius: number;

  /** Positive axial thickness of the closed anterior optical shell, in mm. */
  cornealThickness: number;

  /** Corneal rim's lift above the globe, in mm; clears the underlying iris surface. */
  cornealRimLift: number;

  /**
   * Closed optical boundary: omission or aperture retains visible-aperture
   * clipping; limbus keeps the complete circular cornea independent of the lids.
   * The latter separates optical anatomy from visibility. It does not itself
   * refit lid contact to the larger volume, which requires rendered inspection.
   */
  cornealBoundary?: "aperture" | "limbus";

  /**
   * Optional ocular contact basis. Omission or globe retains the basic rows;
   * cornea first places the inner section support on the actual full corneal
   * mesh along viewRay, then resolves residual refined-skin penetration with
   * lidThickness clearance. It requires limbus boundary and preserves the
   * recorded projection coordinates of each boundary contact.
   */
  lidContact?: "globe" | "cornea";

  /** Post-contact skin adaptation distance in mm; omission uses 3, zero keeps the face-contact targets without neighbouring adaptation. */
  lidContactReach?: number;

  /** Iris radius in mm before clipping against the fitted eyelid. */
  irisRadius: number;

  /** Pupil radius in mm; smaller than the iris. */
  pupilRadius: number;

  /** Optional instance-owned linear-RGB pigment; omission uses the shared legacy palette. */
  irisPigment?: IPortraitIrisPigment;

  /** Optional medial conjunctiva and lower lid margin; omission leaves them absent. */
  tissues?: IPortraitOcularTissueShape;

  /** Number of independently generated brow fibres, in [0,4096]; zero disables them. */
  browFibres: number;

  /** Optional fibre dimensions and skin clearance; omission uses the declared brow profile. */
  browProfile?: IPortraitEyebrowProfile;

  /** Number of upper lashes. */
  upperLashes: number;

  /** Optional upper-lash arc, launch and cross-section profile; omission preserves the original short-lash formula. */
  upperLashProfile?: IPortraitEyelashProfile;

  /** Tessellation controls, separate from the anatomical shape. */
  sampling: {
    /** Angular globe/visible-sheet count; resident globe admission bounds it separately. */
    eyeColumns: number;

    /** Latitude/visible-sheet count, independent of optical dimensions. */
    eyeRows: number;

    /** Angular iris/corneal column count, at least three on admitted profiles. */
    irisColumns: number;

    /** Positive integral radial iris/corneal interval count. */
    irisRows: number;
  };
}
