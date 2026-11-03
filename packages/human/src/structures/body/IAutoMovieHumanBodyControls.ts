import { IAutoMovieHumanBodyControl } from "./IAutoMovieHumanBodyControl";

/**
 * Named authored values and pins; no control is inferred from another.
 *
 * Each tape is the measurement of its published definition at its published
 * site: ISO 8559-1:2017, ANSUR II, ANSUR 1988 or NHANES, recorded under
 * `packages/human/docs/sources/`. A girth is a tape drawn taut, which bridges
 * hollows. A paired site takes the right side, as ISO 8559-1 and ANSUR II do.
 */
export interface IAutoMovieHumanBodyControls {
  /** Stature: the vertex above the standing surface, standing erect (ANSUR II). No anatomy row yet reads it on a skin against this value. Unit: mm. */
  height: IAutoMovieHumanBodyControl;

  /** Body shape coordinate: increasing means fatter. Zero and scale belong to the authoring model, not body-fat percentage. Unitless. */
  fat: IAutoMovieHumanBodyControl;

  /** Continuous shape coordinate: positive is feminine, negative masculine. It does not select a sex statistics table. Unitless. */
  masculineFeminine: IAutoMovieHumanBodyControl;

  /** Body shape coordinate: increasing means more muscular. It is not a lean-mass index. Unitless. */
  muscularity: IAutoMovieHumanBodyControl;

  /** Bust (chest) girth: horizontal at the bust point, the most anterior point of the bust or chest (ISO 8559-1 5.3.4; ANSUR II chest circumference). Unit: mm. */
  chest: IAutoMovieHumanBodyControl;

  /**
   * Bust point width: the straight breadth between the bust points (ISO 8559-1 5.2.3). ISO places the bust point in a bra (3.1.11), so a bare skin does not show this site and no observer reads it there. Unit: mm.
   */
  bustSpan: IAutoMovieHumanBodyControl;

  /** Under bust girth: horizontal directly below the breasts, at the inframammary fold (ISO 8559-1 5.3.8). Unit: mm. */
  underbust: IAutoMovieHumanBodyControl;

  /**
   * Anterior interscye course, meant as ISO 8559-1 5.4.7 across front width between the armpit front fold points. Those points are set by a rule pressed under the arm (3.1.13), which a skin alone does not fix, so its clinical correspondence is unestablished. It is neither shoulder breadth nor a joint-centre distance. Unit: mm.
   */
  frontInterscyeLength: IAutoMovieHumanBodyControl;

  /** Back neck point to waist: the surface distance from cervicale down the back's median line to the natural waist level (ISO 8559-1 5.4.5; ANSUR 1988 natural waist back length). Unit: mm. */
  neckToWaist: IAutoMovieHumanBodyControl;

  /**
   * Across back shoulder width: from one shoulder point, the acromion's lateral edge projected vertically to the skin, over the back neck point to the other (ISO 8559-1 5.4.3). Its observer places the shoulder points from the rig's shoulder joints, which this control helps build, so no reading independent of the construction confirms the site. Bony biacromial and soft-tissue bideltoid breadth stay distinct. Unit: mm.
   */
  acrossShoulder: IAutoMovieHumanBodyControl;

  /**
   * Side neck point to bust point over the skin (ISO 8559-1 5.4.10; ANSUR 1988 neck to bust point length). ISO places the bust point in a bra, so a bare skin does not show this site and no observer reads it there. Unit: mm.
   */
  shoulderToApex: IAutoMovieHumanBodyControl;

  /**
   * Natural waist girth: horizontal at the least girth between the lowest rib and the iliac crest (ANSUR 1988), the level ISO 8559-1 5.3.10 sets midway between those bony landmarks. It is not ANSUR II's omphalion waist. Unit: mm.
   */
  waist: IAutoMovieHumanBodyControl;

  /** Hip girth: horizontal at the buttocks' greatest posterior projection (ISO 8559-1 5.3.13; ANSUR II buttock circumference), distinct from hip breadth and joint-centre separation. Unit: mm. */
  hip: IAutoMovieHumanBodyControl;

  /** Top hip girth: horizontal midway between the waist level and the hip level (ISO 8559-1 5.3.12). Unit: mm. */
  highHip: IAutoMovieHumanBodyControl;

  /** Neck base girth: over the back neck point, the side neck points and the front neck point at the jugular notch (ISO 8559-1 5.3.3). Unit: mm. */
  neckBase: IAutoMovieHumanBodyControl;

  /** Neck girth: just below the thyroid cartilage, perpendicular to the neck's axis (ISO 8559-1 5.3.2; ANSUR II at infrathyroid level). Unit: mm. */
  neck: IAutoMovieHumanBodyControl;

  /** Neck-length course; neither ISO 8559-1 nor ANSUR II defines a neck length, so it is neither vertebral length nor a guessed landmark difference. Unit: mm. */
  neckLength: IAutoMovieHumanBodyControl;

  /**
   * Acromion-radiale length, arm hanging, a beam caliper held parallel to the arm (ANSUR II). Its observer reads acromion and radiale at the rig's shoulder and elbow joints, which this control places, so no reading independent of the construction confirms it. Unit: mm.
   */
  upperArmLength: IAutoMovieHumanBodyControl;

  /**
   * Radiale-stylion length, a beam caliper held parallel to the forearm (ANSUR II), distinct from the Forearm circumference control. Its landmarks, like the upper arm's, stand at the rig's joints. Unit: mm.
   */
  lowerArmLength: IAutoMovieHumanBodyControl;

  /** Relaxed upper arm girth midway between acromion and olecranon, perpendicular to the arm, arm hanging (NHANES mid-upper arm circumference); not ANSUR's flexed biceps, and it does not establish muscle mass. Unit: mm. */
  bicep: IAutoMovieHumanBodyControl;

  /** Elbow girth over the olecranon, arm extended (ANSUR 1988 elbow circumference), not joint breadth. Unit: mm. */
  elbow: IAutoMovieHumanBodyControl;

  /** Wrist girth over stylion, perpendicular to the forearm (ANSUR II wrist circumference), not joint breadth. Unit: mm. */
  wrist: IAutoMovieHumanBodyControl;

  /** Relaxed maximum forearm girth below the elbow, perpendicular to the forearm; not ANSUR's flexed forearm circumference, and separate from Lower Arm Length. No source note yet records a survey of the relaxed girth. Unit: mm. */
  forearm: IAutoMovieHumanBodyControl;

  /** Inside leg length: the crotch's height less the outer ankle point's (ISO 8559-1 5.7.6), distinct from crotch-to-floor Rise and mechanical leg length. Unit: mm. */
  inseam: IAutoMovieHumanBodyControl;

  /** Thigh girth: horizontal at the widest part of the thigh below the gluteal fold (ISO 8559-1 5.3.20); not ANSUR II's, which is perpendicular to the thigh at the gluteal furrow. Unit: mm. */
  thigh: IAutoMovieHumanBodyControl;

  /** Knee girth: horizontal at the centre of the kneecap (ISO 8559-1 5.3.22), not joint breadth. Unit: mm. */
  knee: IAutoMovieHumanBodyControl;

  /** Calf girth: horizontal at the widest part of the calf (ISO 8559-1 5.3.24; ANSUR II calf circumference). Unit: mm. */
  calf: IAutoMovieHumanBodyControl;

  /** Hand circumference over the heads of metacarpals II to V, thumb excluded (ANSUR 1988 hand circumference at metacarpale); no hand length or breadth is derived from it. Unit: mm. */
  handCircumference: IAutoMovieHumanBodyControl;
}
