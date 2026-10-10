import type { IAutoMovieHumanFaceHairFall } from "../IAutoMovieHumanFaceHairFall";
import type { IAutoMovieHumanFaceHairFinish } from "../IAutoMovieHumanFaceHairFinish";
import type { IHumanFaceHairLayerCurl } from "../IHumanFaceHairLayerCurl";
import type { IHumanFaceHairLayerGather } from "../IHumanFaceHairLayerGather";
import type { IHumanFaceHairLayerGuides } from "../IHumanFaceHairLayerGuides";
import type { IHumanFaceHairLayerHairline } from "../IHumanFaceHairLayerHairline";
import type { IHumanFaceHairLayerLift } from "../IHumanFaceHairLayerLift";
import type { IHumanFaceHairLayerPart } from "../IHumanFaceHairLayerPart";
import type { IHumanFaceHairLayerTaper } from "../IHumanFaceHairLayerTaper";
import type { Region } from "./Region";

/**
 * One deterministic root population and its metric styling/appearance inputs.
 * Every length includes its root-to-strip transition. Sampling step is a
 * numerical accuracy setting, distinct from painted fibres and lock count.
 *
 * A legacy scalp ribbon has no authored width. It stands for the whole neighbourhood of
 * one root, so its width is the side of the scalp that root is responsible
 * for, which the population measures from its own local density. Thinner
 * hair is a smaller `count` or a lower `finish.coverage`, never a narrower
 * ribbon. Optional terminalShaftDiameter instead selects individual calibrated
 * shafts; contact adds their radius to the centreline gap and the mesh keeps
 * that calibre. This separate geometry meaning leaves legacy ribbon fields unchanged.
 *
 * @author Samchon
 */
export interface Layer {
  /** Nonblank identity unique within this hairstyle, independent of a person. */
  id: string;

  /** Existing shared basis surface and its declared growth-domain identity. */
  surface: string;

  /** Named anatomical growth domain within that shared surface. */
  domain: string;

  /** Number of generated locks, integral in [0,1024]; not follicles per area. */
  count: number;

  /** Unsigned 32-bit seed; retained roots keep their original sequence identity. */
  seed: number;

  /**
   * Polar hairline angles in [0,pi] radians from +Y about the domain origin.
   * The left/right side and front/back values blend by squared azimuth weights.
   * The mask can only reduce the shared anatomical growth domain.
   */
  hairline: IHumanFaceHairLayerHairline;

  /**
   * Optional neutral-space Gaussian root preference. Sampling retains the
   * requested count within the common domain/hairline, with relative area
   * density exp(-0.5*sum(((root-center)/spread)^2)). This localizes independent
   * populations such as a fringe; it is not a biological density estimate.
   */
  rootRegion?: Region;

  /**
   * Optional individual terminal-shaft diameter in model metres.
   * Omission preserves density-coverage scalp ribbons. Presence selects an
   * individual shaft cross-section, never a density-proxy width or follicle norm.
   */
  terminalShaftDiameter?: number;

  /**
   * Optional authored emergence elevation above the skin tangent plane, in
   * (0,90] degrees. Presence keeps that exact target; omission preserves the
   * existing scalp placement interval. This field defines no clinical norm.
   */
  emergenceAngleDegrees?: number;

  /**
   * Positive centreline lengths in metres at the six neutral chart axes,
   * ordered [+X,-X,+Y,-Y,+Z,-Z]: left, right, crown, nape, front, back.
   * Absolute radial components form nonnegative weights summing to one.
   * These are a regional length field, not six measured anatomical landmarks.
   */
  lengthAxes: [number, number, number, number, number, number];

  /**
   * Optional positive factor on each root's whole length by its frontal
   * share: a root's length is multiplied by 1 + (frontScale - 1) times the
   * weight its direction gives the +Z (front) axis, so the roots of the
   * frontal hairline, whose lengths the blend also takes from the crown,
   * are cut or grown as a fringe is, and the crown behind them is not.
   * Omission is one.
   */
  frontScale?: number;

  /** Seeded fractional length amplitude in [0,1]. */
  lengthVariation: number;

  /**
   * The guide hierarchy: `fraction` in (0,1] of the roots, chosen by their
   * own sample identity, are integrated through the fields and the surface
   * contact as guides; every other root is a strand interpolated from its
   * `neighbours` (integral in [1,8]) nearest guides on the same side of the
   * part, weighted by scalp distance against the guides' own mean spacing.
   * Optional `clump` in [0,1] gathers strands toward their nearest guide,
   * nothing at the root and that fraction of the way at the tip. Absent,
   * every root is a guide, which is the flat population.
   */
  guides?: IHumanFaceHairLayerGuides;

  /**
   * Optional shared gathering operation for a tied hairstyle. The tie is a
   * ray from the growth domain's neutral origin, with polar angle from +Y
   * and azimuth from +Z toward +X, both in radians. The builder attaches
   * its hit barycentrically to the current scalp. `radius` in metres is the
   * tie neighborhood; `strength` in (0,1] blends scalp-directed attraction
   * with the ordinary comb field until a curve enters it. The remaining
   * authored length then follows `tail.direction` in the head frame. No
   * individual curve or tie vertex is stored. A gathered layer integrates
   * all roots because whole-curve guide interpolation would mix the two
   * stages at different arc fractions.
   */
  gather?: IHumanFaceHairLayerGather;

  /** Positive maximum integration step in metres, at most 0.005. */
  samplingStep: number;

  /** Nonnegative requested free-strip clearance from the skin, in metres. */
  clearance: number;

  /**
   * Nonzero dimensionless neutral head-frame flow vector. Its magnitude sets its
   * weight relative to the optional parting field; it is not a physical force.
   */
  flow: [number, number, number];

  /** Nonnegative outward direction bias and its positive decay distance (m). */
  lift: IHumanFaceHairLayerLift;

  /**
   * Optional hand-over from the combed `flow` to hanging along the head's
   * downward axis, by arc length. Omission keeps the combed direction for
   * the whole lock.
   */
  fall?: IAutoMovieHumanFaceHairFall;

  /**
   * Optional continuous parting field. The plane normal is normalized before
   * use and offset is signed metric distance from the neutral frame origin.
   * The tanh transition width and arc-length decay reach are positive metres.
   * A Gaussian root-space envelope optionally limits the field's influence.
   */
  part?: IHumanFaceHairLayerPart;

  /**
   * Wave or helical direction modulation. Angle is in [0,pi/2) radians.
   * Wavelength and onset reach are positive metres of centreline arc length.
   * A wavelength needs at least eight integration intervals. Contact can
   * modify the desired curl; this does not prescribe a stress-free rod shape.
   */
  curl: IHumanFaceHairLayerCurl;

  /** Positive tip/root width ratio in [0.05,1] and taper start fraction [0,0.95]. */
  taper: IHumanFaceHairLayerTaper;

  /**
   * Linear RGB/roughness in [0,1] and procedural fibre appearance. Painted
   * fibres are integral in [1,32], coverage in [0.1,1], normal/shade in [0,1].
   * This generates shared-formula pixels and stores no personal bitmap.
   *
   * `color` is the pigmented fibre's own colour. Greying is a follicle's own
   * switch, so a greying head is an admixture of white and pigmented fibres
   * rather than one faded colour: `grey` is the proportion of the painted
   * fibres left unpigmented, in [0,1], and each painted fibre takes one side
   * of that switch by its own deterministic coordinate. Absent or zero
   * paints every fibre pigmented, which is the population before this field
   * existed. Greying runs temples first, then frontal, vertex and parietal,
   * with the occipital region last, so a head that is grey only at the
   * temples is a layer of its own with its own `rootRegion` and proportion,
   * not a field invented here.
   */
  finish: IAutoMovieHumanFaceHairFinish;
}
