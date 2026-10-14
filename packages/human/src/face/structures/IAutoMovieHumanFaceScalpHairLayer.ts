import type { IAutoMovieHumanFaceHairCurl } from "./IAutoMovieHumanFaceHairCurl";
import type { IAutoMovieHumanFaceHairFinish } from "./IAutoMovieHumanFaceHairFinish";
import type { IAutoMovieHumanFaceHairGather } from "./IAutoMovieHumanFaceHairGather";
import type { IAutoMovieHumanFaceHairLengths } from "./IAutoMovieHumanFaceHairLengths";
import type { IAutoMovieHumanFaceHairPart } from "./IAutoMovieHumanFaceHairPart";
import type { IAutoMovieHumanFaceHairlineAngles } from "./IAutoMovieHumanFaceHairlineAngles";

/**
 * Coordinate-free scalp styling on one immutable shared growth domain.
 * Regional lengths, comb direction, part and curl are authored targets with no
 * clinical protocol or supported biological population inferred. The external
 * basis owns licensed source geometry and chart origin. This numerical record
 * cannot supply private roots, guide curves, tie vertices or surface patches.
 *
 * @evidence contracts/common.md#principled-implementation expandHumanFaceScalpHair converts named mm/degree traits once into the existing metre/radian layer with exact requested identity/count/seed, shared growth domain and independent finish.
 * @evidence contracts/common.md#clear-and-simple-design Named cut/mask/comb/part/gather/curl traits separate authored style from accuracy controls, root population and procedural optical finish.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Numerical layer admission still checks ranges, wavelength/step relationships and integration budgets; count/seed/clearance are rendering or authored constraints rather than measured follicles, mechanics or collision certification.
 * @evidence contracts/common.md#meaningful-documentation Every unit, closed axis choice and omitted-field convention is explicit without exposing root coordinates or a personal guide path.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This layer record executes no conversion, root selection or curve integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Seeded identity is input to the sampling owner, not a cache implemented here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller fields create no guide buffers, ribbons or generated textures.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceScalpHairLayer {
  /** Unique population identity. */
  id: string;

  /** Shared basis surface identity; personal topology is not accepted. */
  surface: string;

  /** Existing shared anatomical growth-domain identity. */
  domain: string;

  /** Generated locks, integer in [0,1024], independent of biological follicles. */
  count: number;

  /** Deterministic unsigned 32-bit sampling seed. */
  seed: number;

  /** Independent axial cut lengths, each positive in millimetres. */
  lengths: IAutoMovieHumanFaceHairLengths;

  /** Named polar growth limits; no private boundary curve. */
  hairline: IAutoMovieHumanFaceHairlineAngles;

  /** Whole-head comb choice in the shared neutral head frame. */
  comb: "back" | "front" | "left" | "right" | "down";

  /** Independent fringe multiplier on frontal length; positive, omitted is one. */
  fringeScale?: number;

  /** Seeded fractional length amplitude in [0,1]. */
  lengthVariation: number;

  /** Maximum integration interval in (0,5] millimetres, an accuracy control. */
  samplingStepMm: number;

  /** Nonnegative free-path clearance from skin, millimetres. */
  clearanceMm: number;

  /** Nonnegative initial outward bias relative to the unit comb field. */
  liftStrength: number;

  /** Positive millimetres over which outward bias decays. */
  liftHoldMm: number;

  /** Optional positive millimetres over which comb gives way to head-frame -Y. */
  fallHoldMm?: number;

  /** Optional sagittal part; omitted means no separation field. */
  part?: IAutoMovieHumanFaceHairPart;

  /** Optional named scalp tie; omitted leaves the population ungathered. */
  gather?: IAutoMovieHumanFaceHairGather;

  /** Independent direction modulation; angle zero is straight. */
  curl: IAutoMovieHumanFaceHairCurl;

  /** Tip/root width ratio in [0.05,1]; this does not author ribbon width. */
  tipWidth: number;

  /** Fraction in [0,0.95] where taper begins. */
  taperStart: number;

  /** Numerical fibre appearance, independent of root population geometry. */
  finish: IAutoMovieHumanFaceHairFinish;
}
