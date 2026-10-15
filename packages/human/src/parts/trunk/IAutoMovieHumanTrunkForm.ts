/**
 * The trunk's form coefficients: every number that shapes the trunk beyond the identity's measurements and the skeleton, in one record so they are fitted together and cited together.
 *
 * Lengths are fractions of stature unless a field says otherwise; shares are fractions of the named span.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanTrunkForm {
  /** Depth of the back behind the vertebral column. */
  behind: IAutoMovieHumanTrunkForm.IBehind;

  /** Front-back position of the widest point of a section, as a share from the back to the front. */
  widest: IAutoMovieHumanTrunkForm.IWidest;

  /** Squareness exponents of the front and back halves of a section; 2 is an ellipse. */
  squareness: Record<"front" | "back", IAutoMovieHumanTrunkForm.ISquareness>;

  /** The front of the midline between the measured levels. */
  front: IAutoMovieHumanTrunkForm.IFront;

  /** The back of the midline between the measured levels. */
  back: IAutoMovieHumanTrunkForm.IBack;

  /** The half breadth between the measured levels. */
  half: IAutoMovieHumanTrunkForm.IHalf;

  /** The two gluteus maximus masses. */
  gluteal: IAutoMovieHumanTrunkForm.IGluteal;

  /** The breasts. */
  breast: IAutoMovieHumanTrunkForm.IBreast;

  /** The upper thigh's section at the gluteal furrow. */
  thigh: IAutoMovieHumanTrunkForm.IThigh;

  /**
   * Depth of the collar below the neck base ring along the neck's axis, in statures: the root of the neck keeps the ring's own section that far before it flares into the trapezius and the clavicles, so the joined surface's girth along the ring is the ring's.
   */
  collar: number;
}
export namespace IAutoMovieHumanTrunkForm {
  /**
   * Distance from the vertebral column back to the skin as a share of the local depth.
   *
   * @author Samchon
   */
  export interface IBehind {
    /** At the iliac crest, of the waist depth. */
    lumbar: number;

    /** At the natural waist, of the waist depth. */
    waist: number;

    /** At the chest point, of the chest depth. */
    thorax: number;

    /** At the axilla, of the chest depth. */
    axilla: number;
  }

  /**
   * Share from the back to the front where a section is widest.
   *
   * @author Samchon
   */
  export interface IWidest {
    /** Below the iliac crest. */
    pelvis: number;

    /** At the natural waist. */
    waist: number;

    /** Over the chest. */
    chest: number;
  }

  /**
   * Squareness at the measured levels.
   *
   * @author Samchon
   */
  export interface ISquareness {
    /** At the buttock point. */
    buttock: number;

    /** At the natural waist. */
    waist: number;

    /** At the costal arch. */
    costal: number;

    /** At the chest point. */
    chest: number;
  }

  /**
   * The front of the midline.
   *
   * @author Samchon
   */
  export interface IFront {
    /** Soft tissue over the anterior superior iliac spines, in statures. */
    spine: number;

    /** Soft tissue over the spines per point of body fat above 15%, millimetres. */
    spineFat: number;

    /** The lower abdomen at the buttock level behind the spines, in statures. */
    buttock: number;

    /** The lower abdomen at the buttock level as a share of the way from the spines to the waist's front. */
    buttockToWaist: number;

    /** The iliac spines' level as a share of the way from the lower abdomen to the waist's front, where that lies ahead of the spines. */
    iliac: number;

    /** The navel as a share of the way from the lower abdomen to the waist's front. */
    navel: number;

    /** The pubis at the crotch behind the lower abdomen, in statures. */
    pubis: number;

    /** The costal arch as a share of the way from the waist's front to the chest's. */
    costal: number;

    /** The inframammary fold behind the chest point, in statures. */
    fold: number;

    /** The axilla level behind the chest point, in statures. */
    axilla: number;
  }

  /**
   * The back of the midline.
   *
   * @author Samchon
   */
  export interface IBack {
    /** The gluteal fold in front of the buttock's back, in statures. */
    fold: number;

    /** The upper buttock, halfway to the iliac crest, as a share of the way from the buttock's back to the crest's. */
    upperButtock: number;

    /** The upper back, 0.55 of the way from the axilla to cervicale, as a share of the way from the axilla's back to cervicale. */
    upperBack: number;
  }

  /**
   * The half breadth.
   *
   * @author Samchon
   */
  export interface IHalf {
    /** At the gluteal furrow, of the hip half breadth. */
    gluteal: number;

    /** Below the trochanter top where the hip is widest, in statures. */
    trochanter: number;

    /** How far below the iliac crest the hip narrows toward the waist, in statures. */
    crestBelow: number;

    /** Just below the iliac crest as a share of the way from the hip half breadth to the waist's. */
    crest: number;

    /** At the costal arch as a share of the way from the waist half breadth to the chest's. */
    costal: number;

    /** At the axilla, of the chest half breadth. */
    axilla: number;

    /** At the axilla per unit of muscularity, of the chest half breadth: the latissimus wings. */
    axillaMuscle: number;
  }

  /**
   * The gluteus maximus masses.
   *
   * @author Samchon
   */
  export interface IGluteal {
    /** Projection behind the profile's back as a share of the buttock depth. */
    projection: number;

    /** Centre across from the midline as a share of the half breadth at the buttock point. */
    across: number;

    /** Centre below the buttock point, in statures. */
    below: number;

    /** Half-width as a share of the half breadth at the buttock point. */
    width: number;

    /** Reach above the centre, in statures. */
    above: number;

    /** Reach below the centre, in statures. */
    under: number;

    /** Share of the push turned outward from the centre. */
    outward: number;
  }

  /**
   * The breasts.
   *
   * @author Samchon
   */
  export interface IBreast {
    /** Projection as a share of the girth the bust adds over the underbust. */
    projection: number;

    /** Apex angle from the anterior midline toward the side, degrees. */
    angle: number;

    /** Angular half-width of the mound, degrees. */
    spread: number;

    /** Share of the apex's projection kept between the mound and the anterior midline, where the two breasts and the chest fat between them fill the sternum. */
    fill: number;

    /** Reach above the apex, in statures. */
    above: number;

    /** Reach below the apex, in statures. */
    below: number;

    /** Drop of the mound per millimetre of projection under its own weight. */
    drop: number;

    /** Share of the projection turned outward. */
    lateral: number;
  }

  /**
   * The upper thigh.
   *
   * @author Samchon
   */
  export interface IThigh {
    /** Breadth of each thigh as a share of the hip breadth. */
    breadth: number;

    /** Front of the thigh behind the lower abdomen, in statures. */
    front: number;

    /** Squareness of the medial half, flattened where the thighs press together. */
    medial: number;

    /** Squareness of the lateral half. */
    lateral: number;
  }
}
