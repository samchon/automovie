/**
 * Head, face, jaw and auricle priors with source-specific dimensional scales
 * and anatomical placement conventions.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadPrior in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHeadPrior {
  /** The face's named features. */
  export interface IFace {
    /**
     * Nose profile along the dorsum: fractions from the tip (0) to the nasion
     * (1).
     */
    profileKnots: readonly number[];

    /** Share of the tip's height at each fraction. */
    profile: readonly number[];

    /** Half-width of the dorsum per half nose width, by the same fractions. */
    dorsum: readonly number[];

    /**
     * Tip's ball: half-heights below and above in nose heights, half-width in
     * half nose widths.
     */
    tipBall: readonly number[];

    /**
     * Alar lobules: height, reach in half nose widths, centre above the
     * subnasale in spans of nasion to tip, half-heights above and below
     * likewise, half-width in half nose widths. Reach and half-width put the
     * lobule's fall at the nose's width, so the width input is where it ends. A
     * crest's radius is the square of the half-height over twice the height, so
     * the lower half-height keeps the alar rim round.
     */
    ala: readonly number[];

    /**
     * The nose's base, which trims it from below: its rise under the alar rims,
     * in spans of nasion to tip, and the sharpness of its union with the nose.
     */
    underside: readonly number[];

    /**
     * Nasolabial angle, degrees, and its change per unit of the
     * masculine-feminine control, from about 97 in men to 105 in women. The
     * columella rises over the horizontal by its difference from a right angle
     * less the upper lip's forward lean, which the profile's landmarks give.
     */
    nasolabial: readonly number[];

    /**
     * Alar crease round each lobule's outer side: depth, millimetres;
     * half-width and place, in lobule radii.
     */
    crease: readonly number[];

    /**
     * Lips' resting gap in world millimetres, by Legan and Burstone's rest
     * measurement.
     */
    gape: number;

    /** Jaw joint's fullness per laterotrusion. */
    joint: number;

    /**
     * Philtral groove depth per half-width, followed by half-width per mouth
     * width.
     */
    philtrum: readonly number[];

    /** Lid margin's centre behind the nasion's skin. */
    eyeRecess: number;

    /** Globe radius, millimetres. */
    radius: number;

    /** Margin's centre ahead of the globe's. */
    marginForward: number;

    /** Angle of the nostril's length from the sagittal plane, degrees. */
    nostrilSweep: number;

    /** How much wider the nostril is at the alar base than at the tip's end. */
    nostrilTear: number;
  }

  /** The whole prior. */
  export interface IPrior {
    /** Midline profile. */
    profile: IProfile;

    /** The face's frame beside the midline. */
    frame: IFrame;

    /** Face features. */
    face: IFace;

    /** The jaw. */
    mandible: IMandible;

    /** Auricle. */
    ear: IEar;
  }

  /** The midline profile's landmarks, relative to glabella and face height. */
  export interface IProfile {
    /**
     * Face height the published millimetres below are scaled from: the 3D
     * Facial Norms' adult women's n-gn, 118.6 mm (Weinberg 2016).
     */
    unit: number;

    /** Fallback vertical component of the brow chord per face height. */
    glabella: number;

    /**
     * Fallback anterior component of the brow chord, in the profile norm's
     * millimetres.
     */
    nasion: number;

    /**
     * Subnasale ahead of the glabella's vertical, millimetres: Legan and
     * Burstone 1980, 6 (3).
     */
    subnasale: number;

    /**
     * Soft-tissue pogonion ahead of the glabella's vertical, millimetres: Legan
     * and Burstone 1980, 0 (4).
     */
    pogonion: number;

    /**
     * Clinical perpendicular peak-protrusion norms from Sn-Pg', mm (Legan and
     * Burstone 1980: 3 (1), 2 (1)); section relief reuses them as explicit
     * shape priors, not achieved personal peaks or border directions.
     */
    lips: readonly number[];

    /**
     * Sublabiale behind the li-pg line, millimetres: Legan and Burstone 1980's
     * mentolabial sulcus, 4 (2).
     */
    sulcus: number;

    /**
     * Subnasale to stomion over subnasale to menton. Legan and Burstone's
     * vertical lip-chin ratio Sn-Stms / Stmi-Me = 0.5 with the lips closed puts
     * the stomion a third of the way down; the 3D Facial Norms' sn-sto over
     * sn-gn, 20.5 / 66.4 = 0.31 in women and 22.7 / 73.1 = 0.31 in men,
     * agrees.
     */
    lip: number;

    /**
     * Pogonion above menton, per stomion to menton: a construction choice, the
     * chin's turn spans its lower third.
     */
    chin: number;

    /**
     * Nasion to pronasale per nasion to subnasale: the 3D Facial Norms' bridge
     * length over nasal height, 47.4 / 54.7 = 0.867 in women and 49.9 / 56.6 =
     * 0.882 in men.
     */
    bridge: number;
  }

  /** The face's frame beside the midline, per its own measures. */
  export interface IFrame {
    /**
     * Upper facial depth t-n per head length: the 3D Facial Norms' 118.9 /
     * 187.3 = 0.635 in women, 126.7 / 198.3 = 0.639 in men.
     */
    tragion: number;

    /**
     * Tragion below the fissures' centre, per face height: the Frankfort plane
     * passes orbitale, about 10 mm under the fissure's centre, and porion, a
     * few millimetres under tragion. Construction reasoning, to be read on the
     * reference ear sections.
     */
    tragionDrop: number;

    /**
     * Cranial base width t-t over maximum cranial width eu-eu: 139.0 / 145.8 =
     * 0.953 in women, 147.9 / 152.3 = 0.971 in men (3D Facial Norms).
     */
    base: number;

    /**
     * Zygion below the fissures' centre, per face height: the arch runs at
     * about the Frankfort level. Construction reasoning, to be read on the
     * reference sections.
     */
    zygion: number;

    /**
     * Zygion's place from tragion toward nasion, as a share of their depth
     * apart: the arch's most lateral point lies on its posterior half.
     * Construction reasoning.
     */
    arch: number;

    /**
     * Frontotemporale behind glabella, per head length: the temporal crest
     * above the lateral orbital rim. Construction reasoning.
     */
    frontal: number;

    /** Elliptical fallback exponent of the face's front quarter. */
    plan: number;

    /**
     * Width of the smooth maximum joining the cranium and the face along each
     * ray, millimetres. Construction: it rounds their meeting by a quarter of
     * it at most.
     */
    union: number;

    /**
     * The cranium's front behind the face's skin at the nasion, millimetres, so
     * the face alone draws the midline from there down. Construction.
     */
    clear: number;
  }

  /**
   * The mandible's skin, a volume in the section union. Its plan is the arch of
   * the jaw from the chin to the gonions; its lower border is the mandibular
   * plane through the menton, turning up at the gonial angle into the ramus's
   * posterior border; under the border the skin falls inward to the neck.
   */
  export interface IMandible {
    /**
     * Mandibular plane's rise toward the back, degrees, and per unit of the
     * masculine-feminine control.
     */
    plane: readonly number[];

    /** Gonial angle, degrees, and per unit of the masculine-feminine control. */
    angle: readonly number[];

    /**
     * Lower face-throat angle, degrees: the skin under the chin leaves the
     * gnathion this far round from the line to the subnasale (Legan and
     * Burstone 1980, Sn-Gn'-C 100 (7)); it sets the underside's fall.
     */
    throatAngle: number;

    /** Least fall of the skin under the border from the horizontal, degrees. */
    under: number;
  }

  /** The auricle. */
  export interface IEar {
    /** Insertion length per auricle length, female then male. */
    insertion: readonly [number, number];

    /** Lobular length per auricle length, female then male. */
    lobule: readonly [number, number];

    /** Carrier rim half-thickness per auricle breadth. */
    rim: number;

    /** Circular ridge diameter per auricle breadth. */
    ridge: number;
  }
}
