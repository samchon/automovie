/**
 * What the trunk and shoulders read: the person's tapes, courses and
 * controls in calibration millimetres (the public input times the stature
 * scale), the one fixed input every trunk piece is built from.
 *
 * Each tape is an ISO 8559-1:2017 girth taken at its site on the skin; each
 * course a taut surface length between its landmarks, defined in
 * `docs/sources/iso-8559-1-2017-landmarks.md`.
 */
export interface IAutoMovieHumanTrunkInputs {
  /** Hip tape: the girth at the buttock point. */
  hip: number;

  /** High hip tape: midway between the waist and the hip. */
  highHip: number;

  /** Waist tape: the natural waist. */
  waist: number;

  /** Underbust tape: at the inframammary fold. */
  underbust: number;

  /** Chest tape: at the bust point. */
  chest: number;

  /** Bust span: the straight breadth between the bust points (ISO 8559-1 5.2.3). */
  bustSpan: number;

  /** Neck base tape. */
  neckBase: number;

  /** Across back shoulder width: shoulder point over the back neck point to shoulder point (ISO 8559-1 5.4.3); a reading of the skin, the shoulder points stand on the biacromial breadth. */
  acrossShoulder: number;

  /** Biacromial breadth: between the acromia (ISO 7250-1:2017 6.2.7), twice the shoulder point's lateral place. */
  biacromial: number;

  /** Acromial height: the acromion over the floor (ANSUR II), the shoulder point's height. */
  acromion: number;

  /** Axilla height: the armpit's vault over the floor (ANSUR II), where the arm parts from the trunk. */
  axilla: number;

  /** Whether the person's measured anatomy is a woman's (`AutoMovieHumanBodyAnatomy`): the chest tape then closes over the breasts, a man's over the pectoral wall. */
  female: boolean;

  /** Biceps tape: the upper arm's greatest girth, the arm's root radius is its girth radius. */
  bicep: number;

  /** Back neck point to waist, down the back's median skin (ISO 8559-1 5.4.5). */
  neckToWaist: number;

  /** Side neck point to bust point over the front (ISO 8559-1 5.4.10). */
  shoulderToApex: number;

  /** Upper arm length, acromion to radiale (ANSUR II): the glenohumeral centre's offset below the shoulder point is a share of it. */
  upperArm: number;

  /** Masculine-feminine control. */
  sex: number;

  /** Fat control. */
  fat: number;

  /** Muscularity control. */
  muscularity: number;

  /** Calibration millimetres per world millimetre. */
  scale: number;
}
