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
