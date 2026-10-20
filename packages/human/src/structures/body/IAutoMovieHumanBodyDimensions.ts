/** Independent length-course measurements, mm; controls do not fill unknown observations. */
export interface IAutoMovieHumanBodyDimensions {
  /** Height, mm; null means unmeasured. */
  height: number | null;

  /** Chest, mm; null means unmeasured. */
  chest: number | null;

  /** Bust Span, mm; null means unmeasured. */
  bustSpan: number | null;

  /** Underbust, mm; null means unmeasured. */
  underbust: number | null;

  /** Front Interscye Length, mm; null means unmeasured. */
  frontInterscyeLength: number | null;

  /** Neck to Waist, mm; null means unmeasured. */
  neckToWaist: number | null;

  /** Across Shoulder, mm; null means unmeasured. */
  acrossShoulder: number | null;

  /** Shoulder to Apex, mm; null means unmeasured. */
  shoulderToApex: number | null;

  /** Waist, mm; null means unmeasured. */
  waist: number | null;

  /** Hip, mm; null means unmeasured. */
  hip: number | null;

  /** High Hip, mm; null means unmeasured. */
  highHip: number | null;

  /** Neck Base, mm; null means unmeasured. */
  neckBase: number | null;

  /** Neck, mm; null means unmeasured. */
  neck: number | null;

  /** Neck Length, mm; null means unmeasured. */
  neckLength: number | null;

  /** Upper Arm Length, mm; null means unmeasured. */
  upperArmLength: number | null;

  /** Lower Arm Length, mm; null means unmeasured. */
  lowerArmLength: number | null;

  /** Bicep, mm; null means unmeasured. */
  bicep: number | null;

  /** Elbow, mm; null means unmeasured. */
  elbow: number | null;

  /** Wrist, mm; null means unmeasured. */
  wrist: number | null;

  /** Forearm, mm; null means unmeasured. */
  forearm: number | null;

  /** Inseam, mm; null means unmeasured. */
  inseam: number | null;

  /** Thigh, mm; null means unmeasured. */
  thigh: number | null;

  /** Knee, mm; null means unmeasured. */
  knee: number | null;

  /** Calf, mm; null means unmeasured. */
  calf: number | null;

  /** Hand Circumference, mm; null means unmeasured. */
  handCircumference: number | null;
}
