import { IAutoMovieHumanBodyControl } from "./IAutoMovieHumanBodyControl";

/**
 * Authored values and pins consumed by Human's canonical relaxed measurement
 * protocol, documented in `packages/human/docs/measurement-protocol.md`.
 *
 * Girth goals are answered on the assembled skin at construction-owned model
 * addresses. The four reference examples retain their original native-course
 * values; neither those values nor model addresses establish clinical ISO or
 * ANSUR equivalence. A control is never inferred from another, and unknown
 * independent measurements remain separate from these authored goals.
 */
export interface IAutoMovieHumanBodyControls {
  /** Configured body height course; neither exported bbox extent nor clinical stature is substituted. Unit: mm. */
  height: IAutoMovieHumanBodyControl;

  /** Body shape coordinate: increasing means fatter. Zero and scale belong to the authoring model, not body-fat percentage. Unitless. */
  fat: IAutoMovieHumanBodyControl;

  /** Continuous shape coordinate: positive is feminine, negative masculine. It does not select a sex statistics table. Unitless. */
  masculineFeminine: IAutoMovieHumanBodyControl;

  /** Body shape coordinate: increasing means more muscular. It is not a lean-mass index. Unitless. */
  muscularity: IAutoMovieHumanBodyControl;

  /** Taut chest girth at the owned model bust-apex section. Native-course and clinical chest/bust equivalence remain unestablished. Unit: mm. */
  chest: IAutoMovieHumanBodyControl;

  /** Bust span course; endpoints are not inferred from a clinical breadth. Unit: mm. */
  bustSpan: IAutoMovieHumanBodyControl;

  /** Taut underbust girth at the owned model lower-bust section, separate from the chest. Unit: mm. */
  underbust: IAutoMovieHumanBodyControl;

  /** Anterior interscye course; neither shoulder breadth nor a joint-centre distance. Unit: mm. */
  frontInterscyeLength: IAutoMovieHumanBodyControl;

  /** Neck-to-waist course; no endpoint or surface-to-straight-distance conversion is inferred. Unit: mm. */
  neckToWaist: IAutoMovieHumanBodyControl;

  /** Across-shoulder course; bony biacromial and soft-tissue bideltoid breadth stay distinct. Unit: mm. */
  acrossShoulder: IAutoMovieHumanBodyControl;

  /** Shoulder-to-apex course, not an inferred vertical landmark separation. Unit: mm. */
  shoulderToApex: IAutoMovieHumanBodyControl;

  /** Taut waist girth at the owned model waist. Natural-waist and ANSUR omphalion equivalence remain distinct and unestablished. Unit: mm. */
  waist: IAutoMovieHumanBodyControl;

  /** Taut hip girth at the owned posterior-crest section, distinct from breadth and joint-centre separation. Unit: mm. */
  hip: IAutoMovieHumanBodyControl;

  /** Taut high-hip girth midway between the owned model waist and hip sections; no palpable iliac-crest equivalence is implied. Unit: mm. */
  highHip: IAutoMovieHumanBodyControl;

  /** Length of the owned four-contact model neck-base surface course, distinct from a planar tape or a clinically palpated C7 course. Unit: mm. */
  neckBase: IAutoMovieHumanBodyControl;

  /** Taut girth at the owned model neck section; clinical infrathyroid equivalence remains unestablished. Unit: mm. */
  neck: IAutoMovieHumanBodyControl;

  /** Neck-length course; neither vertebral length nor a guessed landmark difference. Unit: mm. */
  neckLength: IAutoMovieHumanBodyControl;

  /** Upper-arm course; clinical segment and joint-centre correspondence is unestablished. Unit: mm. */
  upperArmLength: IAutoMovieHumanBodyControl;

  /** Lower-arm length course; it is distinct from the Forearm circumference control. Unit: mm. */
  lowerArmLength: IAutoMovieHumanBodyControl;

  /** Taut upper-arm girth midway from the owned shoulder attachment to the elbow centre, square to the upper-arm axis; no clinical acromion/olecranon equivalence is implied. Unit: mm. */
  bicep: IAutoMovieHumanBodyControl;

  /** Taut girth at the owned model elbow-joint section, not joint breadth or a palpated olecranon course. Unit: mm. */
  elbow: IAutoMovieHumanBodyControl;

  /** Taut girth of the owned wrist-crease section, not joint breadth or a stylion derived from an animation-joint offset. Unit: mm. */
  wrist: IAutoMovieHumanBodyControl;

  /** Maximum taut girth over the complete owned forearm muscle region, excluding its geometrically declared joint transitions. Unit: mm. */
  forearm: IAutoMovieHumanBodyControl;

  /** Inseam course, distinct from crotch-to-floor Rise and mechanical leg length. Unit: mm. */
  inseam: IAutoMovieHumanBodyControl;

  /** Maximum horizontal taut girth in the owned upper-thigh region below the model crotch; clinical gluteal-furrow equivalence remains unestablished. Unit: mm. */
  thigh: IAutoMovieHumanBodyControl;

  /** Horizontal taut girth at the owned model knee-joint section, not joint breadth or a palpated mid-patella course. Unit: mm. */
  knee: IAutoMovieHumanBodyControl;

  /** Maximum horizontal taut girth over the owned shank muscle region, excluding its declared ankle and knee transitions. Both sides share this authored goal. Unit: mm. */
  calf: IAutoMovieHumanBodyControl;

  /** Hand circumference course; no hand length or breadth is derived from it. Unit: mm. */
  handCircumference: IAutoMovieHumanBodyControl;
}
