/**
 * Named constants of the head and ear construction, shared by every person and
 * both sides.
 *
 * The head is built from Farkas landmarks placed by their published
 * definitions and population relations. Lengths taken from a published
 * norm are written in that norm's millimetres and scaled by the person's face
 * height over the norm's (`profile.unit`), so a constant never fixes a size.
 * Values read on the private references rather than published are marked
 * "Observed": each is a mean over the four references in the stated
 * normalisation, checked on each reference held out from the other three,
 * and is to be replaced by a published value or confirmed by the reference
 * section curves.
 */
export namespace AutoMovieHumanHeadPrior {
  /** Ratios from public inputs to places the inputs do not define. */
  export interface IRatios {
    /**
     * Menton above the neck ring, per neck length. The neck length is a
     * course, not a landmark difference, so this places the head on it.
     * Observed.
     */
    neck: number;

    /**
     * Skull centre (midway from glabella to opisthocranion) ahead of the neck
     * ring's centre, per neck radius. Observed.
     */
    forward: number;
  }

  /** The midline profile's landmarks, relative to glabella and face height. */
  export interface IProfile {
    /** Face height the published millimetres below are scaled from: the 3D Facial Norms' adult women's n-gn, 118.6 mm (Weinberg 2016). */
    unit: number;

    /** Glabella above nasion, per face height. Observed: 0.17, 0.14, 0.17, 0.08 on f1, f2, m1, m2. */
    glabella: number;

    /** Nasion behind glabella, millimetres. Observed: 2.7, 1.7, 2.0, 1.3. */
    nasion: number;

    /** Subnasale ahead of the glabella's vertical, millimetres: Legan and Burstone 1980, 6 (3). */
    subnasale: number;

    /** Soft-tissue pogonion ahead of the glabella's vertical, millimetres: Legan and Burstone 1980, 0 (4). */
    pogonion: number;

    /** Labrale superius and inferius ahead of the sn-pg line, millimetres: Legan and Burstone 1980, 3 (1) and 2 (1). */
    lips: readonly number[];

    /** Sublabiale behind the li-pg line, millimetres: Legan and Burstone 1980's mentolabial sulcus, 4 (2). */
    sulcus: number;

    /**
     * Subnasale to stomion over subnasale to menton. Legan and Burstone's
     * vertical lip-chin ratio Sn-Stms / Stmi-Me = 0.5 with the lips closed
     * puts the stomion a third of the way down; the 3D Facial Norms' sn-sto
     * over sn-gn, 20.5 / 66.4 = 0.31 in women and 22.7 / 73.1 = 0.31 in men,
     * agrees.
     */
    lip: number;

    /** Pogonion above menton, per stomion to menton: a construction choice, the chin's turn spans its lower third. */
    chin: number;

    /** Nasion to pronasale per nasion to subnasale: the 3D Facial Norms' bridge length over nasal height, 47.4 / 54.7 = 0.867 in women and 49.9 / 56.6 = 0.882 in men. */
    bridge: number;
  }

  /** The face's frame beside the midline, per its own measures. */
  export interface IFrame {
    /** Upper facial depth t-n per head length: the 3D Facial Norms' 118.9 / 187.3 = 0.635 in women, 126.7 / 198.3 = 0.639 in men. */
    tragion: number;

    /** Tragion below the fissures' centre, per face height: the Frankfort plane passes orbitale, about 10 mm under the fissure's centre, and porion, a few millimetres under tragion. Construction reasoning, to be read on the reference ear sections. */
    tragionDrop: number;

    /** Cranial base width t-t over maximum cranial width eu-eu: 139.0 / 145.8 = 0.953 in women, 147.9 / 152.3 = 0.971 in men (3D Facial Norms). */
    base: number;

    /** Zygion below the fissures' centre, per face height: the arch runs at about the Frankfort level. Construction reasoning, to be read on the reference sections. */
    zygion: number;

    /** Zygion's place from tragion toward nasion, as a share of their depth apart: the arch's most lateral point lies on its posterior half. Construction reasoning. */
    arch: number;

    /** Frontotemporale behind glabella, per head length: the temporal crest above the lateral orbital rim. Construction reasoning. */
    frontal: number;

    /**
     * Exponent of the face's plan: from the midline to the widest place the
     * face's half width follows a super-ellipse of this exponent. Observed at
     * the zygomatic level on the four references: 2.4 to 2.6.
     */
    plan: number;

    /** Width of the smooth maximum joining the cranium and the face along each ray, millimetres. Construction: it rounds their meeting by a quarter of it at most. */
    union: number;

    /** The cranium's front behind the face's skin at the nasion, millimetres, so the face alone draws the midline from there down. Construction. */
    clear: number;
  }

  /** The auricle. */
  export interface IEar {
    /** Length along the ear per the ear length input. */
    lengthRatio: number;

    /** Chord per the breadth input. */
    breadthRatio: number;

    /** Ear's centre below eye level, in ear lengths. Observed. */
    drop: number;

    /** Ear's line behind the skull centre at its own centre, millimetres. Observed. */
    forward: number;

    /** Lean of the ear's line back from the vertical, radians. */
    lean: number;

    /** Egg's wider top: chord growth per unit height along the ear. */
    egg: number;

    /** Stand off the head, in protrusions, as a quadratic along the ear. */
    stand: readonly number[];

    /** Free end of the lobe, in ear lengths. */
    lobeFree: number;

    /** Free end of the helix, in ear lengths. */
    topFree: number;

    /** Below the top, where the section splits round the pocket, in ear lengths. */
    splitFree: number;

    /** Below the top, where the pocket closes, in ear lengths. */
    roofFree: number;

    /** Posterior root behind the anterior root, in chords. */
    root: number;

    /** Helix tube's half thickness, millimetres for a 31 mm ear. */
    rim: number;

    /** Where rings start along the ear, from its bottom. */
    lobeFrom: number;

    /** Over how much of the ear the rings fade in. */
    lobeBlend: number;

    /** Chord fraction where the rim starts, behind the helix root. */
    frontRim: number;

    /** Rings: height, distance in from the rim, width, millimetres for a 31 mm ear. */
    helix: readonly number[];

    /** See {@link helix}. */
    scapha: readonly number[];

    /** See {@link helix}. */
    antihelix: readonly number[];

    /** Bumps: height, place along the chord, place along the ear, widths. */
    concha: readonly number[];

    /** See {@link concha}. */
    tragus: readonly number[];

    /** See {@link concha}. */
    antitragus: readonly number[];
  }

  /** The face's named features. */
  export interface IFace {
    /** Nose profile along the dorsum: fractions from the tip (0) to the nasion (1). */
    profileKnots: readonly number[];

    /** Share of the tip's height at each fraction. */
    profile: readonly number[];

    /** Half-width of the dorsum per half nose width, by the same fractions. */
    dorsum: readonly number[];

    /** Tip's ball: half-heights below and above in nose heights, half-width in half nose widths. */
    tipBall: readonly number[];

    /**
     * Alar lobules: height, reach in half nose widths, centre above the
     * subnasale in spans of nasion to tip, half-heights above and below likewise,
     * half-width in half nose widths. Reach and half-width put the lobule's fall
     * at the nose's width, so the width input is where it ends. A crest's radius
     * is the square of the half-height over twice the height, so the lower
     * half-height keeps the alar rim round.
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
     * Alar crease round each lobule's outer side: depth, millimetres; half-width
     * and place, in lobule radii.
     */
    crease: readonly number[];

    /** Oral fissure's depth and half-height. */
    fissure: readonly number[];

    /** Lips' rest gap per mouth opening. */
    gape: number;

    /** Jaw joint's fullness per laterotrusion. */
    joint: number;

    /** Philtrum's depth and half-width. */
    philtrum: readonly number[];

    /** Depth of the orbit's hollow round the eye, millimetres, before the seat. */
    socket: number;

    /** Lid margin's centre behind the nasion's skin. */
    eyeRecess: number;

    /** Globe centre above the margin's. */
    globeRise: number;

    /** Globe radius, millimetres. */
    radius: number;

    /**
     * Lid margin's harmonics 1 to 3 per coordinate, `[a1, b1, a2, b2, a3, b3]`:
     * x in millimetres, y per half the fissure height, z per half its length.
     */
    margin: readonly (readonly number[])[];

    /** Margin's centre ahead of the globe's. */
    marginForward: number;

    /** Nostril's half-length and half-width at its middle, per half nose width. */
    nostrilSize: readonly number[];

    /** Nostril centre in the base: forward in tip leads, out in half nose widths. */
    nostrilCentre: readonly number[];

    /** Angle of the nostril's length from the sagittal plane, degrees. */
    nostrilSweep: number;

    /** How much wider the nostril is at the alar base than at the tip's end. */
    nostrilTear: number;
  }

  /**
   * The mandible's skin, a volume in the section union. Its plan is the arch of
   * the jaw from the chin to the gonions; its lower border is the mandibular
   * plane through the menton, turning up at the gonial angle into the ramus's
   * posterior border; under the border the skin falls inward to the neck.
   */
  export interface IMandible {
    /** Mandibular plane's rise toward the back, degrees, and per unit of the masculine-feminine control. */
    plane: readonly number[];

    /** Gonial angle, degrees, and per unit of the masculine-feminine control. */
    angle: readonly number[];

    /** Gonion ahead of the ear's line, millimetres. */
    gonion: number;

    /**
     * Lower face-throat angle, degrees: the skin under the chin leaves the
     * gnathion this far round from the line to the subnasale (Legan and
     * Burstone 1980, Sn-Gn'-C 100 (7)); it sets the underside's fall.
     */
    throatAngle: number;

    /** Least fall of the skin under the border from the horizontal, degrees. */
    under: number;

    /**
     * Soft tissue's rounding of the turn under the border, millimetres at no
     * fat: an ellipse whose radius is `taper` times this over the bone's edge
     * and the gonial angle, and this over `taper` squared where it opens into
     * the skin under the jaw.
     */
    round: number;

    /**
     * Growth of the soft tissue's roundings with fat, as the logarithm per unit
     * of the fat control: subcutaneous fat over the jaw and under the chin
     * thickens with it, and rounds the border and fills the throat.
     */
    fat: number;

    /** See {@link round}. */
    taper: number;

    /** The arch's front behind the chin's skin, in radii over the bone's edge. */
    inset: number;

    /** Arch's half-length behind the gonion, in half mandibular widths. */
    back: number;

    /** Width of the blend with the face and the neck, millimetres. */
    blend: number;

    /**
     * Width of that blend under the border, millimetres at no fat: the hollow
     * where the skin under the jaw meets the neck at the cervicomental angle,
     * which the sections cross nearly along that skin.
     */
    throat: number;
  }

  /** The whole prior. */
  export interface IPrior {
    /**
     * Hump of the section planes' tilt about the lateral axis, nose side down:
     * height in radians, its station, its widths below and above. The station
     * runs 0 at the neck ring, 1 at the menton, 2 at the subnasale, 3 at eye
     * level and 4 at the vertex.
     */
    tilt: readonly number[];

    /** Input ratios. */
    ratios: IRatios;

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

  /** The population's prior. */
  export const PRIOR: IPrior = {
    tilt: [-0.245, 1.3, 0.62, 0.52],
    ratios: {
      neck: 0.5806,
      forward: 0.8043,
    },
    profile: {
      unit: 118.6,
      glabella: 0.14,
      nasion: 1.9,
      subnasale: 6,
      pogonion: 0,
      lips: [3, 2],
      sulcus: 4,
      lip: 1 / 3,
      chin: 1 / 3,
      bridge: 0.875,
    },
    frame: {
      tragion: 0.637,
      tragionDrop: 0.07,
      base: 0.962,
      zygion: 0.1,
      arch: 0.25,
      frontal: 0.16,
      plan: 2.5,
      union: 6,
      clear: 6,
    },
    face: {
      profileKnots: [-0.3, 0, 0.2, 0.55, 1, 1.25],
      profile: [0, 0.82, 0.86, 0.6, 0.2, 0],
      dorsum: [0.7, 0.66, 0.6, 0.52, 0.48, 0.5],
      tipBall: [0.8, 0.46, 0.72],
      ala: [11, 0.62, 0.3, 0.25, 0.2, 0.4],
      underside: [0.05, 4],
      nasolabial: [101.25, 3.75],
      crease: [1, 0.5, 1.3],
      fissure: [1.8, 0.9],
      gape: 0.012,
      joint: 0.09,
      philtrum: [0.9, 3.2],
      socket: 3.9,
      eyeRecess: 13.5,
      globeRise: 2.2,
      radius: 11.392,
      margin: [
        [-1.6, 1.27, -3.3, -0.14, -0.7, -0.1],
        [0.28, 1, 0.08, 0.01, 0.08, 0.033],
        [1, 0.03, -0.034, -0.02, 0.062, 0.018],
      ],
      marginForward: 6.26,
      nostrilSize: [0.33, 0.15],
      nostrilCentre: [0.42, 0.5],
      nostrilSweep: 40,
      nostrilTear: 0.35,
    },
    // Frankfort to mandibular plane 25 degrees, steeper in women; gonial angle
    // about 120 in men and 125 in women; a cervicomental angle of about 112.
    mandible: {
      plane: [25, 2.5],
      angle: [122.5, 2.5],
      gonion: 20,
      throatAngle: 100,
      under: 3,
      // 6.2 mm over the bone's edge, which the lower head's layers cross nearly
      // square, and 26 mm into the skin under the jaw, which they cross at about
      // 18 degrees. A circle of 6 mm turned 34 degrees a layer at the underside,
      // and an ellipse of 4.9 and 15.8 mm, the least the 1.27 mm layers carry
      // by a straight estimate, still turned 29. 33 mm ran past the 24 to 30 mm
      // of underside a thick neck leaves before the throat, and rounded the
      // border into it. Stated at no fat: 10 mm at the references' fat of about
      // -0.6.
      round: 13.5,
      fat: 0.5,
      taper: 0.62,
      inset: 1,
      back: 0.5,
      blend: 6,
      throat: 24,
    },
    ear: {
      lengthRatio: 1.02,
      breadthRatio: 1,
      drop: 0.36,
      forward: -16,
      lean: 0.2,
      egg: 0.12,
      stand: [0.5, 0.155, -0.195],
      lobeFree: 0.04,
      topFree: 0.22,
      splitFree: 0.09,
      roofFree: 0.06,
      root: 0.55,
      rim: 1.7,
      lobeFrom: 0.62,
      lobeBlend: 0.3,
      frontRim: 0.2,
      helix: [2.2, 2.5, 2.2],
      scapha: [-1.8, 6.5, 2.4],
      antihelix: [2.2, 11.5, 2.6],
      concha: [-8.5, 0.34, -0.12, 0.2, 0.34],
      tragus: [2.4, 0.1, -0.2, 0.07, 0.12],
      antitragus: [1.8, 0.42, -0.55, 0.1, 0.1],
    },
  };
}
