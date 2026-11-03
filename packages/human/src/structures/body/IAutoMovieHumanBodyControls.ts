import { IAutoMovieHumanBodyControl } from "./IAutoMovieHumanBodyControl";

/** Named authored values and pins; no control is inferred from another. */
export interface IAutoMovieHumanBodyControls {
  /** Configured body height course; neither exported bbox extent nor clinical stature is substituted. Unit: mm. */
  height: IAutoMovieHumanBodyControl;

  /** Body shape coordinate: increasing means fatter. Zero and scale belong to the authoring model, not body-fat percentage. Unitless. */
  fat: IAutoMovieHumanBodyControl;

  /** Continuous shape coordinate: positive is feminine, negative masculine. It does not select a sex statistics table. Unitless. */
  masculineFeminine: IAutoMovieHumanBodyControl;

  /** Body shape coordinate: increasing means more muscular. It is not a lean-mass index. Unitless. */
  muscularity: IAutoMovieHumanBodyControl;

  /** Chest circumference course; correspondence to clinical chest or bust tape is unestablished. Unit: mm. */
  chest: IAutoMovieHumanBodyControl;

  /** Bust span course; endpoints are not inferred from a clinical breadth. Unit: mm. */
  bustSpan: IAutoMovieHumanBodyControl;

  /** Underbust circumference course with its own measurement site. Unit: mm. */
  underbust: IAutoMovieHumanBodyControl;

  /** Anterior interscye course; neither shoulder breadth nor a joint-centre distance. Unit: mm. */
  frontInterscyeLength: IAutoMovieHumanBodyControl;

  /** Neck-to-waist course; no endpoint or surface-to-straight-distance conversion is inferred. Unit: mm. */
  neckToWaist: IAutoMovieHumanBodyControl;

  /** Across-shoulder course; bony biacromial and soft-tissue bideltoid breadth stay distinct. Unit: mm. */
  acrossShoulder: IAutoMovieHumanBodyControl;

  /** Shoulder-to-apex course, not an inferred vertical landmark separation. Unit: mm. */
  shoulderToApex: IAutoMovieHumanBodyControl;

  /** Waist circumference course; clinical natural-waist correspondence is unestablished. Unit: mm. */
  waist: IAutoMovieHumanBodyControl;

  /** Hip circumference course, distinct from hip breadth and joint-centre separation. Unit: mm. */
  hip: IAutoMovieHumanBodyControl;

  /** High-hip circumference course; no iliac-crest landmark is implied. Unit: mm. */
  highHip: IAutoMovieHumanBodyControl;

  /** Neck-base circumference course, separate from the neck course. Unit: mm. */
  neckBase: IAutoMovieHumanBodyControl;

  /** Neck circumference course with its own measurement site. Unit: mm. */
  neck: IAutoMovieHumanBodyControl;

  /** Neck-length course; neither vertebral length nor a guessed landmark difference. Unit: mm. */
  neckLength: IAutoMovieHumanBodyControl;

  /** Upper-arm course; clinical segment and joint-centre correspondence is unestablished. Unit: mm. */
  upperArmLength: IAutoMovieHumanBodyControl;

  /** Lower-arm length course; it is distinct from the Forearm circumference control. Unit: mm. */
  lowerArmLength: IAutoMovieHumanBodyControl;

  /** Upper-arm circumference course; it does not establish muscle mass. Unit: mm. */
  bicep: IAutoMovieHumanBodyControl;

  /** Elbow circumference course, not joint breadth. Unit: mm. */
  elbow: IAutoMovieHumanBodyControl;

  /** Wrist circumference course, not joint breadth. Unit: mm. */
  wrist: IAutoMovieHumanBodyControl;

  /** Forearm circumference course, separate from Lower Arm Length. Unit: mm. */
  forearm: IAutoMovieHumanBodyControl;

  /** Inseam course, distinct from crotch-to-floor Rise and mechanical leg length. Unit: mm. */
  inseam: IAutoMovieHumanBodyControl;

  /** Thigh circumference course; site and side are not inferred from clinical limb data. Unit: mm. */
  thigh: IAutoMovieHumanBodyControl;

  /** Knee circumference course, not joint breadth. Unit: mm. */
  knee: IAutoMovieHumanBodyControl;

  /** Calf circumference course; it does not specify left and right independently. Unit: mm. */
  calf: IAutoMovieHumanBodyControl;

  /** Hand circumference course; no hand length or breadth is derived from it. Unit: mm. */
  handCircumference: IAutoMovieHumanBodyControl;
}
