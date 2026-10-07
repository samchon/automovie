import type { IAutoMovieHumanFaceHairLengths } from "./IAutoMovieHumanFaceHairLengths";
import type { IAutoMovieHumanFaceHairlineAngles } from "./IAutoMovieHumanFaceHairlineAngles";
import type { IAutoMovieHumanFaceHairCurl } from "./IAutoMovieHumanFaceHairCurl";
import type { IAutoMovieHumanFaceHairPart } from "./IAutoMovieHumanFaceHairPart";
import type { IAutoMovieHumanFaceHairFinish } from "./IAutoMovieHumanFaceHairFinish";
import type { IAutoMovieHumanFaceHairGather } from "./IAutoMovieHumanFaceHairGather";

/**
 * Sparse named styling edits over one existing numerical hair population.
 * Omitted traits retain that layer's exact values, including legacy field
 * directions, guide policy and root envelopes. This makes ordinary documents
 * editable without an approximate conversion of their full styling fields.
 * Explicit choices intentionally replace their named trait. Values are authored
 * styling targets with no clinical acquisition protocol or population fit.
 *
 * @evidence contracts/common.md#principled-implementation Sparse edits preserve every unselected legacy degree of freedom while expressing selected styling in named units.
 * @evidence contracts/common.md#clear-and-simple-design One traits record serves an existing population; no private guide or second geometry path enters.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing counts, seeds, numerical policy and unedited styling remain caller-owned.
 * @evidence contracts/common.md#meaningful-documentation States sparse preservation, explicit replacement and clinical qualification.
 * @evidence contracts/modeling.md#parameter-channels Each optional trait changes its named field only; null explicitly removes a part or hanging operation.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres and degrees convert once to the existing head-frame metres and radians.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The existing population owns part identity.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Existing generation emits the population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Existing root registration and contact owners construct the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The coupled builder observes styling.
 * @evidence contracts/anatomy.md#anatomical-source These authored targets have no measured biological population or acquisition protocol; clinical calibration is unknown.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing hair admission owns numerical representation limits.
 * @evidence contracts/anatomy.md#parametric-authority Only named measurements and closed choices are new person inputs; legacy geometry fields are never exposed by this record.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairTraits {
  /** Independent regional cut lengths; omitted retains all existing axes. */
  lengths?: IAutoMovieHumanFaceHairLengths;

  /** Independent polar hairline limits; omitted retains the existing mask. */
  hairline?: IAutoMovieHumanFaceHairlineAngles;

  /** Explicit unit-axis comb selection; omitted retains the exact legacy field. */
  comb?: "back" | "front" | "left" | "right" | "down";

  /** Positive frontal-length multiplier; omitted retains existing fringe scale. */
  fringeScale?: number;

  /** Fractional seeded length amplitude in [0,1]; omitted retains existing amplitude. */
  lengthVariation?: number;

  /** Nonnegative outward bias; omitted retains existing bias. */
  liftStrength?: number;

  /** Positive outward-bias decay length, millimetres; omitted retains existing hold. */
  liftHoldMm?: number;

  /** Positive comb-to-hanging decay length in mm; null removes it, omission retains it. */
  fallHoldMm?: number | null;

  /** Sagittal part traits; preserves existing local bias/envelope, null removes part. */
  part?: IAutoMovieHumanFaceHairPart | null;

  /** Optional named tie styling; null removes the tie, omission retains it. */
  gather?: IAutoMovieHumanFaceHairGather | null;

  /** Direction modulation; omitted retains the existing curl. */
  curl?: IAutoMovieHumanFaceHairCurl;

  /** Tip/root width ratio in [0.05,1]; omitted retains existing taper. */
  tipWidth?: number;

  /** Taper onset fraction in [0,0.95]; omitted retains existing onset. */
  taperStart?: number;

  /** Fibre finish; omitted preserves the existing finish and painted resolution. */
  finish?: IAutoMovieHumanFaceHairFinish;
}
